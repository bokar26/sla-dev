from fastapi import APIRouter
from ..internal_loader import get_corpus

router = APIRouter(prefix="/v1/debug", tags=["debug"])

@router.get("/internal-stats")
async def internal_stats():
    """Return internal index statistics"""
    corpus = await get_corpus()
    by = {}
    for r in corpus:
        c = (r.get("country") or "unknown").lower()
        by[c] = by.get(c, 0) + 1
    return {"count": len(corpus), "by_country": by}
