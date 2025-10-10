from __future__ import annotations
from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import time, json, asyncio

# Removed import - using new search system
from ..llm.tool_web import call_tools_loop
from ..scoring.needs import Needs, from_text, merge as merge_needs
from ..media.vision import extract_needs_from_image
from ..scoring.rank import score_supplier
from ..utils.url_utils import prefer_url
from ..llm.openai_client import respond, output_text
from ..core.settings import settings

router = APIRouter(prefix="/v1/suppliers", tags=["suppliers"])

class SearchReq(BaseModel):
    q: str
    country: str | None = None
    product_type: str | None = None
    customization: bool | None = None
    quantity: int | None = None
    min_score: int = 70
    top_k: int = 10
    time_budget_ms: int = 60000
    # optional image caption to boost query tokens
    image_caption: str | None = None

class SearchRes(BaseModel):
    items: List[Dict[str, Any]]
    meta: Dict[str, Any]

@router.post("/search", response_model=SearchRes)
async def suppliers_search(body: SearchReq):
    """Capability-first unified search: internal + web with weighted scoring"""
    t0 = time.perf_counter()
    
    # 1) Build Needs from text
    needs_text = await from_text(body.q or "", body.country, body.product_type, body.customization, body.quantity)
    needs = needs_text
    
    # 2) If image caption provided, merge with needs
    if body.image_caption:
        # For now, just add the caption to the query
        needs.productName = needs.productName or body.image_caption
    
    # 3) Internal recall (broad; we'll score later)
    internal = search_internal(
        q=needs.productName or needs.category or body.q,
        country=None,  # do not hard filter—country will be a *preference* weight
        product_type=None,
        customization=body.customization,
        quantity=body.quantity,
        top_k=200
    )
    
    # 4) OpenAI web search (only OpenAI; use tools:[{type:"web"}])
    web_items = []
    try:
        prompt = f"Find manufacturers or factories for: {needs.productName or needs.category or body.q}. Return a short JSON array of items with keys: name, country (if known), url (homepage preferred), product_types[], materials[], processes[], moq (if known)."
        resp = await respond(settings.OPENAI_MODEL, [
            {"role": "user", "content": prompt}
        ])
        text_output = output_text(resp)
        try:
            arr = json.loads(text_output)
            if isinstance(arr, list):
                for it in arr[:30]:
                    it = dict(it)
                    it["source"] = "web"
                    it["url"] = prefer_url(it)
                    web_items.append(it)
        except Exception:
            pass
    except Exception as e:
        print(f"Web search error: {e}")
    
    # 5) Normalize internal rows & compute score
    def norm_row(r):
        r = dict(r)
        r["source"] = r.get("source") or "internal"
        r["url"] = prefer_url(r) or r.get("url", "")
        return r
    
    candidates = [norm_row(x) for x in internal] + [norm_row(x) for x in web_items]
    
    scored = []
    for s in candidates:
        val = score_supplier(s, needs, needs.country)
        reason = f"Weighted match (category>{'yes' if val else 'no'}) capability materials/processes; moq fit; quality; country pref; customization)"
        scored.append({
            **s,
            "score": round(val),
            "reasoning": reason
        })
    
    # 6) Sort & filter
    min_score = body.min_score or 70
    scored.sort(key=lambda x: x["score"], reverse=True)
    top = [x for x in scored if x["score"] >= min_score][:body.top_k]
    
    # Add belowThreshold flag for items below original threshold
    for item in top:
        item["belowThreshold"] = item["score"] < body.min_score
    
    return SearchRes(
        items=top,
        meta={
            "elapsed_ms": round((time.perf_counter()-t0)*1000),
            "needs": needs.model_dump(),
            "providers_used": {"openai_web": bool(web_items)},
            "internal_candidates": len(internal),
            "web_candidates": len(web_items),
            "min_score": body.min_score,
            "top_k": body.top_k,
            "debug": {
                "candidates_count": len(candidates),
                "scored_count": len(scored),
                "top_count": len(top),
                "first_candidate": candidates[0] if candidates else None,
                "first_scored": scored[0] if scored else None
            }
        }
    )