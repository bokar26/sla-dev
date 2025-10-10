from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, Literal
from ..llm_search import llm_orchestrated_search, LLMSearchResponse

router = APIRouter()

class LLMSearchRequest(BaseModel):
    q: Optional[str] = None
    country: Optional[str] = None
    product_type: Optional[str] = None
    quantity: Optional[int] = None
    customization: Optional[Literal["any","yes","no"]] = "any"
    image_label: Optional[str] = None
    min_score: Optional[int] = 80  # UI still controls gating; we'll filter client-side

@router.get("/v1/llm-search/debug")
async def llm_search_debug() -> dict:
    import os
    openai_key = os.getenv("OPENAI_API_KEY")
    return {
        "openai_key_exists": bool(openai_key),
        "openai_key_length": len(openai_key) if openai_key else 0,
        "should_use_fallback": not openai_key or openai_key.strip() == ""
    }

@router.post("/v1/llm-search")
async def llm_search(body: LLMSearchRequest) -> dict:
    try:
        res: LLMSearchResponse = await llm_orchestrated_search(body.model_dump())
        # UI can filter below min_score; keep all for transparency
        return {"items":[i.model_dump() for i in res.items], "meta": res.meta}
    except Exception as e:
        import traceback
        return {"items":[], "meta": {"error": str(e), "traceback": traceback.format_exc()}}
