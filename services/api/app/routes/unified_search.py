from __future__ import annotations
from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import time, json, asyncio, os
from rapidfuzz import fuzz

from ..internal_index import recall_internal, get_internal_corpus
from ..openai_helpers import llm_structured_query, web_collect_vendors, normalize_url
from ..core.settings import settings

router = APIRouter(prefix="/v1", tags=["unified-search"])

class UnifiedSearchReq(BaseModel):
    q: str
    country: Optional[str] = None
    product_type: Optional[str] = None
    quantity: Optional[int] = None
    customization: Optional[str] = "any"  # "yes", "no", "any"
    image_upload_id: Optional[str] = None

class UnifiedSearchRes(BaseModel):
    items: List[Dict[str, Any]]
    meta: Dict[str, Any]

def score_vendor(vendor: Dict[str, Any], structured_query: Dict[str, Any]) -> Dict[str, Any]:
    """Score vendor using weighted criteria"""
    
    # Extract query parameters
    country = structured_query.get("country")
    category = structured_query.get("category", "")
    materials = structured_query.get("materials", [])
    customization = structured_query.get("customization", "any")
    quantity = structured_query.get("quantity")
    image_summary = structured_query.get("image_summary", "")
    
    # Extract vendor data
    v_country = vendor.get("country", "")
    v_product_types = str(vendor.get("product_types", "")).lower()
    v_materials = str(vendor.get("materials", "")).lower()
    v_capabilities = str(vendor.get("capabilities", "")).lower()
    v_min_moq = vendor.get("min_moq")
    
    # 1. Country score (0.35)
    country_score = 0.0
    if country and v_country:
        if v_country.lower() == country.lower():
            country_score = 100.0
        else:
            country_score = 20.0
    else:
        country_score = 70.0
    country_reason = f"Country match: {v_country} vs {country} ({country_score:.0f}/35)"
    
    # 2. Product/category score (0.30)
    product_score = 0.0
    if category and category in v_product_types:
        product_score = 100.0
    elif any(term in v_product_types for term in structured_query.get("query_terms", [])):
        product_score = 80.0
    else:
        product_score = 30.0
    product_reason = f"Product match: {category} in {v_product_types} ({product_score:.0f}/30)"
    
    # 3. Text/query semantic match (0.20)
    text_score = 0.0
    query_terms = structured_query.get("query_terms", [])
    if query_terms:
        text_blob = f"{vendor.get('name', '')} {v_product_types} {v_materials}".lower()
        text_score = max(fuzz.token_set_ratio(term.lower(), text_blob) for term in query_terms)
    else:
        text_score = 50.0
    text_reason = f"Text match: query terms vs vendor data ({text_score:.0f}/20)"
    
    # 4. Customization capability (0.10)
    cust_score = 0.0
    if customization == "yes":
        has_cust = any(keyword in v_capabilities for keyword in ["oem", "odm", "custom", "yes", "true"])
        cust_score = 100.0 if has_cust else 0.0
    elif customization == "any":
        cust_score = 50.0
    else:
        cust_score = 50.0
    cust_reason = f"Customization: {customization} vs {v_capabilities} ({cust_score:.0f}/10)"
    
    # 5. Quantity/MOQ fit (0.05)
    qty_score = 0.0
    if quantity and v_min_moq:
        try:
            moq = float(v_min_moq)
            if quantity >= moq:
                qty_score = 100.0
            else:
                qty_score = max(20.0, 100.0 * (quantity / moq))
        except Exception:
            qty_score = 50.0
    else:
        qty_score = 50.0
    qty_reason = f"MOQ fit: {quantity} vs {v_min_moq} ({qty_score:.0f}/5)"
    
    # 6. Image boost (up to +0.10)
    image_boost = 0.0
    if image_summary:
        # Check if image summary matches vendor category/name
        if any(term in v_product_types for term in image_summary.lower().split()):
            image_boost = 10.0
        elif any(term in vendor.get("name", "").lower() for term in image_summary.lower().split()):
            image_boost = 5.0
    image_reason = f"Image boost: {image_summary} match ({image_boost:.0f}/10)" if image_boost > 0 else "No image boost"
    
    # Calculate final score
    final_score = (
        0.35 * country_score +
        0.30 * product_score +
        0.20 * text_score +
        0.10 * cust_score +
        0.05 * qty_score +
        image_boost
    )
    
    return {
        "score": round(final_score),
        "reasoning": {
            "country": country_reason,
            "product": product_reason,
            "text": text_reason,
            "customization": cust_reason,
            "quantity": qty_reason,
            "image": image_reason
        }
    }

@router.post("/unified-search", response_model=UnifiedSearchRes)
async def unified_search(body: UnifiedSearchReq, file: Optional[UploadFile] = File(None)):
    """Unified search: internal + OpenAI web with weighted scoring"""
    t0 = time.perf_counter()
    
    # Validate required parameters
    if not body.q:
        raise HTTPException(status_code=400, detail="Query parameter 'q' is required")
    
    # Load image if provided
    image_bytes = None
    if file:
        image_bytes = await file.read()
    
    # 1. Extract structured query
    structured_query = await llm_structured_query(body.q, image_bytes)
    
    # 2. Parallel search: internal + web
    time_budget = float(os.getenv("SEARCH_TIME_BUDGET_MS", "45000")) / 1000.0
    
    async def search_internal_async():
        return recall_internal(structured_query, top_k=200)
    
    async def search_web_async():
        return await web_collect_vendors(structured_query)
    
    try:
        internal_results, web_results = await asyncio.gather(
            search_internal_async(),
            search_web_async(),
            return_exceptions=True
        )
        
        # Handle exceptions
        if isinstance(internal_results, Exception):
            print(f"Internal search error: {internal_results}")
            internal_results = []
        if isinstance(web_results, Exception):
            print(f"Web search error: {web_results}")
            web_results = []
            
    except Exception as e:
        print(f"Search error: {e}")
        internal_results = []
        web_results = []
    
    # 3. Merge and score all candidates
    all_candidates = []
    
    # Add internal results
    for vendor in internal_results:
        vendor["url"] = normalize_url(vendor.get("url", ""))
        all_candidates.append(vendor)
    
    # Add web results
    for vendor in web_results:
        vendor["url"] = normalize_url(vendor.get("url", ""))
        all_candidates.append(vendor)
    
    # 4. Score all candidates
    scored_candidates = []
    for vendor in all_candidates:
        scoring_result = score_vendor(vendor, structured_query)
        scored_candidates.append({
            **vendor,
            "score": scoring_result["score"],
            "reasoning": scoring_result["reasoning"]
        })
    
    # 5. Sort and filter
    scored_candidates.sort(key=lambda x: x["score"], reverse=True)
    
    min_score = int(os.getenv("SEARCH_MIN_SCORE", "80"))
    target_count = int(os.getenv("SEARCH_TARGET", "10"))
    
    # Get top results
    top_results = scored_candidates[:target_count]
    
    # Check if we need to include below-threshold results
    above_threshold = [r for r in top_results if r["score"] >= min_score]
    below_threshold = [r for r in top_results if r["score"] < min_score]
    
    warning = None
    if len(above_threshold) < target_count and below_threshold:
        warning = f"Some results below threshold ({min_score}) due to limited matches."
    
    # 6. Prepare response
    meta = {
        "elapsed_ms": round((time.perf_counter() - t0) * 1000),
        "structured_query": structured_query,
        "internal_candidates": len(internal_results),
        "web_candidates": len(web_results),
        "total_candidates": len(all_candidates),
        "min_score": min_score,
        "target_count": target_count,
        "above_threshold": len(above_threshold),
        "below_threshold": len(below_threshold),
        "warning": warning,
        "providers_used": {
            "internal": len(internal_results) > 0,
            "openai_web": len(web_results) > 0
        }
    }
    
    return UnifiedSearchRes(
        items=top_results,
        meta=meta
    )

@router.get("/debug/search-dry-run")
async def search_dry_run(q: str):
    """Debug endpoint to test structured query extraction"""
    try:
        structured_query = await llm_structured_query(q)
        internal_count = len(recall_internal(structured_query, top_k=50))
        return {
            "structured_query": structured_query,
            "internal_candidates": internal_count,
            "web_enabled": os.getenv("OPENAI_USE_WEB", "0") == "1"
        }
    except Exception as e:
        return {"error": str(e)}
