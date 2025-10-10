from fastapi import APIRouter, Body
from ..models.search import SearchRequest
from ..search.orchestrator import perform_unified_search
from typing import Dict, Any

router = APIRouter(prefix="/v1", tags=["search"])

@router.post("/search")
async def unified_search(req: SearchRequest):
    """Unified search: internal + web with progressive widening"""
    items, meta = await perform_unified_search(req)
    return {"items": items, "meta": meta}
