from __future__ import annotations
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from sla_ai_components.logistics.regulations_llm import get_regulations

router = APIRouter(prefix="/logistics", tags=["logistics"])

class RegsRequest(BaseModel):
    origin_country: str
    dest_country: str
    hs_code: str
    max_age_days: int = 14

@router.post("/regulations")
def regulations(req: RegsRequest):
    data = get_regulations(
        origin_country=req.origin_country,
        dest_country=req.dest_country,
        hs_code=req.hs_code,
        max_age_days=req.max_age_days
    )
    return data
