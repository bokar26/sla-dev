from fastapi import APIRouter
from ..web.search_providers import duckduckgo_search, bing_search, serper_search
from ..core.settings import settings

router = APIRouter(prefix="/v1/probe", tags=["probe"])

@router.get("/duckduckgo")
async def probe_duckduckgo(q: str = "jeans manufacturer"):
    res = await duckduckgo_search(q, max_results=3)
    return {"ok": bool(res), "count": len(res)}

@router.get("/serper")
async def probe_serper(q: str = "jeans manufacturer"):
    if not getattr(settings, 'SERPER_API_KEY', None):
        return {"ok": False, "reason": "SERPER_API_KEY missing"}
    res = await serper_search(q, max_results=3)
    return {"ok": bool(res), "count": len(res)}

@router.get("/bing")
async def probe_bing(q: str = "jeans manufacturer"):
    if not getattr(settings, 'BING_SEARCH_KEY', None):
        return {"ok": False, "reason": "BING_SEARCH_KEY missing"}
    res = await bing_search(q, max_results=3)
    return {"ok": bool(res), "count": len(res)}
