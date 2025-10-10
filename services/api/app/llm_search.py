# -*- coding: utf-8 -*-
from typing import List, Dict, Any, Optional
import os, json, re, time
from pydantic import BaseModel, Field, ValidationError
from openai import OpenAI
from .internal_loader import get_corpus
from .search.normalize import expand_product_terms, tokens

OPENAI_MODEL = os.getenv("OPENAI_MODEL_SEARCH", "gpt-5")  # fallback handled below
MAX_INTERNAL_ROWS = int(os.getenv("LLM_INTERNAL_ROWS", "250"))  # snapshot size

class LLMVendor(BaseModel):
    id: Optional[str] = None
    name: str
    url: Optional[str] = None
    country: Optional[str] = None
    product_type: Optional[str] = None
    moq: Optional[int] = None
    score: int = Field(ge=0, le=100)
    source: str  # "internal" | "web"
    rationale: str

class LLMSearchResponse(BaseModel):
    items: List[LLMVendor]
    meta: Dict[str, Any] = {}

def _build_query_string(q: Optional[str], country: Optional[str], product_type: Optional[str],
                        quantity: Optional[int], customization: Optional[str],
                        image_label: Optional[str]) -> str:
    parts = []
    if q: parts.append(f"Text: {q}")
    if image_label: parts.append(f"Image: {image_label}")
    if country: parts.append(f"Country: {country}")
    if product_type: parts.append(f"ProductType: {product_type}")
    if quantity: parts.append(f"Quantity: {quantity}")
    if customization: parts.append(f"Customization: {customization}")
    return " | ".join(parts) if parts else "(no user text)"

def _compact_row(r: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": r.get("id") or r.get("supplier_id") or r.get("_id"),
        "name": r.get("name") or r.get("company") or r.get("title"),
        "country": r.get("country"),
        "product_types": r.get("product_types") or r.get("category") or r.get("categories"),
        "materials": r.get("materials"),
        "capabilities": r.get("capabilities"),
        "tags": r.get("tags"),
        "moq": r.get("moq"),
        "url": r.get("website") or r.get("url") or r.get("alibaba_url"),
        "_raw": r,
    }

def _slice_internal(corpus: List[Dict[str, Any]], q: str, product_type: Optional[str], country: Optional[str]) -> List[Dict[str, Any]]:
    """Very light prefilter so we don't send the whole corpus to the model."""
    q_terms = set(tokens(q))
    if product_type:
        q_terms |= set(tokens(product_type))
    out = []
    for r in corpus:
        blob = " ".join(filter(None, [
            str(r.get("name","")), str(r.get("description","")), str(r.get("materials","")),
            str(r.get("product_types","")), str(r.get("tags","")), str(r.get("capabilities",""))
        ])).lower()
        # cheap checks
        hits = sum(1 for t in q_terms if t in blob)
        if country:
            rc = (r.get("country") or "").lower()
            if country.lower() != rc and hits == 0:
                continue
        if hits > 0 or (product_type and (product_type.lower() in blob)):
            out.append(_compact_row(r))
    # cap snapshot
    return out[:MAX_INTERNAL_ROWS] if len(out) > MAX_INTERNAL_ROWS else out

def _system_prompt() -> str:
    return (
        "You are SLA Search, an expert sourcing copilot.\n"
        "Goal: Given a user query string and an INTERNAL_SNAPSHOT of suppliers, return the TOP 10 supplier matches.\n\n"
        "Ranking order (most to least weight): country ➜ product intent ➜ text similarity ➜ customization ➜ quantity.\n"
        "Scoring: 0–100. Return only suppliers with best fit; prefer higher scores.\n"
        "Mark source='internal' for all results since they come from the internal snapshot.\n"
        "For each item include a short rationale explaining the match.\n"
        "If info is ambiguous, be conservative and lower the score.\n"
        "Return JSON with items array containing: id, name, url, country, product_type, moq, score, source, rationale."
    )

def _user_prompt(query_string: str, snapshot: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    return [
        {"role": "user", "content": f"USER_QUERY: {query_string}\n\nINTERNAL_SNAPSHOT: {json.dumps(snapshot, ensure_ascii=False)}\n\nProvide up to 10 best matches from the snapshot."}
    ]

def _web_tools():
    """
    Try to enable OpenAI web search tool if available in this account.
    If model rejects tools, we still succeed on internal-only.
    """
    # For now, disable web tools to avoid issues
    return []

async def llm_orchestrated_search(req: Dict[str, Any]) -> LLMSearchResponse:
    q = (req.get("q") or "").strip()
    country = req.get("country")
    product_type = req.get("product_type")
    quantity = req.get("quantity")
    customization = req.get("customization") or "any"
    image_label = req.get("image_label")

    query_string = _build_query_string(q, country, product_type, quantity, customization, image_label)

    corpus = await get_corpus()
    snapshot = _slice_internal(corpus, q or product_type or "", product_type, country)

    # Check if OpenAI API key is available
    openai_key = os.getenv("OPENAI_API_KEY")
    print(f"DEBUG: OpenAI key available: {bool(openai_key and openai_key.strip())}")
    print(f"DEBUG: Using fallback path: {not openai_key or openai_key.strip() == ''}")
    if not openai_key or openai_key.strip() == "":
        print("DEBUG: Using fallback scoring")
        # Fallback: use simple scoring without LLM
        from rapidfuzz import fuzz
        
        items = []
        for supplier in snapshot[:50]:  # Limit to top 50 for performance
            # Simple scoring
            name = str(supplier.get("name", "")).lower()
            product_types = str(supplier.get("product_types", "")).lower()
            materials = str(supplier.get("materials", "")).lower()
            description = str(supplier.get("description", "")).lower()
            
            text_blob = f"{name} {product_types} {materials} {description}"
            text_score = fuzz.token_set_ratio(q.lower(), text_blob) if q else 50
            
            # Country match
            supplier_country = str(supplier.get("country", "")).lower()
            if country:
                country_score = 100.0 if supplier_country == country.lower() else 40.0
            else:
                country_score = 80.0
            
            # Product type match
            product_score = 100.0 if product_type and product_type.lower() in product_types else 30.0
            
            # Final score
            final_score = int(0.5 * text_score + 0.3 * country_score + 0.2 * product_score)
            
            if final_score >= 30:  # Minimum threshold
                items.append(LLMVendor(
                    id=supplier.get("id"),
                    name=supplier.get("name", "Unknown Supplier"),
                    url=supplier.get("url"),
                    country=supplier.get("country"),
                    product_type=supplier.get("product_types"),
                    moq=supplier.get("moq"),
                    score=final_score,
                    source="internal",
                    rationale=f"Text match: {text_score}%, Country: {country_score}%, Product: {product_score}%"
                ))
        
        # Sort by score and take top 10
        items.sort(key=lambda x: x.score, reverse=True)
        items = items[:10]
        
        print(f"DEBUG: Fallback returning {len(items)} items")
        return LLMSearchResponse(
            items=items,
            meta={
                "openai_model": "fallback",
                "openai_web": False,
                "snapshot_size": len(snapshot),
                "note": "OpenAI API key not available, using fallback scoring"
            }
        )

    # OpenAI path
    client = OpenAI(api_key=openai_key)
    model = OPENAI_MODEL
    # simple fallback
    try:
        client.models.retrieve(model)
    except Exception:
        model = "gpt-4o-mini"

    messages = [{"role": "system", "content": _system_prompt()}] + _user_prompt(query_string, snapshot)

    # Ask for strict JSON:
    response = None
    tools = _web_tools()
    try:
        # Simplified approach - use chat completions instead of responses
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            tools=tools,             # if unsupported, server will ignore
            response_format={"type": "json_object"}
        )
        raw = json.loads(response.choices[0].message.content)
    except Exception as e:
        error_msg = str(e)
        if "quota" in error_msg.lower() or "429" in error_msg:
            print(f"DEBUG: OpenAI quota exceeded, using fallback scoring")
            # Use fallback scoring when quota is exceeded
            from rapidfuzz import fuzz
            
            items = []
            for supplier in snapshot[:50]:  # Limit to top 50 for performance
                # Simple scoring
                name = str(supplier.get("name", "")).lower()
                product_types = str(supplier.get("product_types", "")).lower()
                materials = str(supplier.get("materials", "")).lower()
                description = str(supplier.get("description", "")).lower()
                
                text_blob = f"{name} {product_types} {materials} {description}"
                text_score = fuzz.token_set_ratio(q.lower(), text_blob) if q else 50
                
                # Country match
                supplier_country = str(supplier.get("country", "")).lower()
                if country:
                    country_score = 100.0 if supplier_country == country.lower() else 40.0
                else:
                    country_score = 80.0
                
                # Product type match
                product_score = 100.0 if product_type and product_type.lower() in product_types else 30.0
                
                # Final score
                final_score = int(0.5 * text_score + 0.3 * country_score + 0.2 * product_score)
                
                if final_score >= 30:  # Minimum threshold
                    items.append(LLMVendor(
                        id=supplier.get("id"),
                        name=supplier.get("name", "Unknown Supplier"),
                        url=supplier.get("url"),
                        country=supplier.get("country"),
                        product_type=supplier.get("product_types"),
                        moq=supplier.get("moq"),
                        score=final_score,
                        source="internal",
                        rationale=f"Text match: {text_score}%, Country: {country_score}%, Product: {product_score}%"
                    ))
            
            # Sort by score and take top 10
            items.sort(key=lambda x: x.score, reverse=True)
            items = items[:10]
            
            return LLMSearchResponse(
                items=items,
                meta={
                    "openai_model": "fallback-quota",
                    "openai_web": False,
                    "snapshot_size": len(snapshot),
                    "note": "OpenAI quota exceeded, using fallback scoring"
                }
            )
        else:
            # fallback: no tools / plain JSON
            response = client.chat.completions.create(
                model=model, 
                messages=messages,
                response_format={"type": "json_object"}
            )
            try:
                raw = json.loads(response.choices[0].message.content)
            except Exception:
                raw = {"items":[],"meta":{"note":"model returned non-JSON"}}

    # Validate & repair once
    try:
        parsed = LLMSearchResponse(**raw)
    except ValidationError:
        # Try a one-shot repair
        repair_prompt = [
            {"role":"system","content":"You returned invalid JSON. Repair to EXACTLY the JSON schema used before."},
            {"role":"user","content":json.dumps(raw, ensure_ascii=False)}
        ]
        rep = client.chat.completions.create(model=model, messages=repair_prompt,
                                      response_format={"type":"json_object"})
        raw2 = json.loads(rep.choices[0].message.content)
        parsed = LLMSearchResponse(**raw2)

    # normalize URLs: if source internal and url missing, try to fetch from snapshot map
    urlmap = {}
    for r in snapshot:
        rid = str(r.get("id") or "")
        if rid:
            urlmap[rid] = r.get("url")
    for it in parsed.items:
        if it.source == "internal" and (not it.url) and it.id and it.id in urlmap:
            it.url = urlmap[it.id]

    # meta attachments
    meta = parsed.meta or {}
    meta.update({
        "openai_model": model,
        "openai_web": True,    # we attempted tools; actual search depends on account feature
        "snapshot_size": len(snapshot)
    })
    parsed.meta = meta
    return parsed
