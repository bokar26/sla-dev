from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import List, Optional
from sla_ai_components.data.repos import fetch_saved_quotes

router = APIRouter(prefix="/api", tags=["quotes"])

class QuoteOut(BaseModel):
    id: str
    ref: str
    product: Optional[str] = None
    vendor_name: Optional[str] = None
    origin_city: Optional[str] = None
    origin_country_iso2: Optional[str] = None
    origin_port_code: Optional[str] = None
    incoterm: Optional[str] = None
    weight_kg: Optional[float] = None
    volume_cbm: Optional[float] = None
    ready_date: Optional[str] = None

class QuotesResp(BaseModel):
    items: List[QuoteOut]

@router.get("/saved-quotes", response_model=QuotesResp)
def saved_quotes(limit: int = Query(100, ge=1, le=500)):
    data = fetch_saved_quotes(limit=limit)
    return {"items": data}
