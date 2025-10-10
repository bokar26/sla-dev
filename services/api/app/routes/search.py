# services/api/app/routes/search.py
from fastapi import APIRouter, Body, HTTPException
from ..models.search_models import UnifiedSearchRequest, UnifiedSearchResponse
from typing import Dict, Any
import time, asyncio

from ..search.unified import perform_unified_search
from ..core.settings import settings
import os

router = APIRouter(prefix="/v1", tags=["search"])

def _coerce_to_request(payload: Dict[str, Any]) -> UnifiedSearchRequest:
    """
    Accept either:
    - New shape: {"q": "...", "country": "...", ...}
    - Legacy shape: {"body": {...same fields...}}
    """
    if payload is None:
        raise ValueError("Empty request payload")
    if "q" in payload:
        return UnifiedSearchRequest(**payload)
    if "body" in payload and isinstance(payload["body"], dict):
        return UnifiedSearchRequest(**payload["body"])
    # Friendly error to eliminate 'loc:["body","body"]' confusion
    raise ValueError("Request must contain fields at top-level (q, country, ...) or a 'body' object")

# Removed score_vendor function - using legacy internal search instead

# The perform_unified_search function is now imported from search.unified

@router.post("/search", response_model=UnifiedSearchResponse)
async def search_unified(payload: Dict[str, Any] = Body(...)):
    """
    Frontend should POST a plain JSON body matching UnifiedSearchRequest.
    This endpoint also accepts legacy { "body": { ... } } for backward compatibility.
    """
    try:
        req = _coerce_to_request(payload)
    except Exception as e:
        return UnifiedSearchResponse(items=[], meta={"warning": f"Invalid request: {e}"})

    # ---- Call your existing unified search orchestrator here ----
    # This should: read req.q/country/product_type/quantity/customization/image_upload_id/min_score
    # and return combined top-10 from internal + web search.
    results, meta = await perform_unified_search(req)  # <- make sure this function exists and returns (list, dict)

    return UnifiedSearchResponse(items=results, meta=meta)
