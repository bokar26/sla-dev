from __future__ import annotations
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
import hashlib, json, os, time

# Removed import - using new search system
from ..web.fetch import fetch_readable
from ..core.settings import settings
from openai import OpenAI

router = APIRouter(prefix="/v1/suppliers", tags=["suppliers-details"])

CACHE_DIR = os.getenv("PROFILE_CACHE_DIR", ".cache/supplier_profiles")
os.makedirs(CACHE_DIR, exist_ok=True)

# Initialize OpenAI client
_openai_api_key = getattr(settings, 'OPENAI_API_KEY', None)
_client = OpenAI(api_key=_openai_api_key) if _openai_api_key else None

class DetailsReq(BaseModel):
    id: Optional[str] = None
    name: Optional[str] = None
    url: Optional[str] = None
    source: Optional[str] = None  # "internal" | "web" | None
    country: Optional[str] = None
    product_type: Optional[str] = None

def _load_cache(key: str) -> Optional[Dict[str, Any]]:
    path = os.path.join(CACHE_DIR, f"{key}.json")
    if not os.path.exists(path):
        return None
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return None

def _save_cache(key: str, data: Dict[str, Any]):
    path = os.path.join(CACHE_DIR, f"{key}.json")
    try:
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False)
    except Exception:
        pass

def _cache_key(url: Optional[str], name: Optional[str]) -> str:
    raw = (url or "") + "|" + (name or "")
    return hashlib.sha1(raw.encode("utf-8")).hexdigest()

def _extract_with_llm(url: str, readable_text: str) -> Dict[str, Any]:
    """
    Use OpenAI to extract normalized supplier fields from page text.
    Return a dict with as many fields as possible; missing fields optional.
    """
    if not _client:
        return {"site": url, "notes": "OpenAI not configured"}
    
    sys = (
        "You are a sourcing analyst. Extract a supplier profile from the provided page content. "
        "Return ONLY a JSON object with these keys (omit unknown): "
        "{name, site, email, phone, address, moq, lead_time, materials, capabilities, "
        "certs, export_markets, membership, alibaba_id}."
    )
    user = {
        "url": url,
        "content": readable_text[:20000]  # keep token safety
    }
    
    try:
        resp = _client.chat.completions.create(
            model=getattr(settings, 'OPENAI_MODEL', 'gpt-4o-mini'),
            messages=[
                {"role": "system", "content": sys},
                {"role": "user", "content": json.dumps(user)}
            ],
            temperature=0.1,
            max_tokens=500
        )
        text = resp.choices[0].message.content or ""
        try:
            data = json.loads(text)
            if isinstance(data, dict):
                return data
        except Exception:
            pass
    except Exception as e:
        print(f"LLM extraction error: {e}")
    
    return {"site": url, "notes": "extraction_failed"}

@router.post("/details")
def supplier_details(req: DetailsReq):
    """
    Strategy:
    1) If internal: try to find a strong match by name/url and return the row.
    2) If url exists (internal or web), fetch page & run LLM extraction to enrich.
    3) Merge internal + web extraction where possible.
    4) Cache by url|name so drawer opens fast next time.
    """
    # 1) Try internal lookup
    internal_hit = None
    if req.name or req.url:
        q = (req.name or "").strip()
        if req.url and not q:
            q = req.url
        # search internal with low min filter; pick top 1
        hits = search_internal(q, req.country, req.product_type, None, None, top_k=5)
        internal_hit = hits[0] if hits else None

    # Build a baseline profile from internal (if any)
    profile: Dict[str, Any] = {}
    if internal_hit:
        profile.update({
            "id": internal_hit.get("id"),
            "name": internal_hit.get("name"),
            "country": internal_hit.get("country"),
            "product_types": internal_hit.get("product_types"),
            "moq": internal_hit.get("moq"),
            "source": internal_hit.get("source") or "internal",
            "url": internal_hit.get("url"),
            "materials": internal_hit.get("materials", []),
            "certs": internal_hit.get("certs", []),
            "lead_days": internal_hit.get("lead_days")
        })

    # 2) If we have a URL (from request or internal), attempt live fetch + extraction
    live_error = None
    url = req.url or profile.get("url")
    if url:
        key = _cache_key(url, req.name or profile.get("name"))
        cached = _load_cache(key)
        if cached:
            # merge cached over baseline if blank
            for k,v in cached.items():
                if v and (not profile.get(k)):
                    profile[k] = v
            profile["_cache"] = True
        else:
            try:
                text = fetch_readable(url) or ""
                if text.strip():
                    enrich = _extract_with_llm(url, text)
                    # merge enrich over baseline only if absent in baseline
                    for k,v in enrich.items():
                        if v and (not profile.get(k)):
                            profile[k] = v
                    _save_cache(key, profile)
            except Exception as e:
                live_error = str(e)

    if not profile and not live_error:
        # nothing found
        raise HTTPException(status_code=404, detail="Supplier not found")

    # Always return a valid payload; include a non-fatal live_error note if any
    return {
        "ok": True,
        "profile": profile,
        "live_error": live_error,
    }
