from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List
from sla_ai_components.data.repos import create_quote_in_db

router = APIRouter(prefix="/api/quotes", tags=["quotes"])

class QuoteIn(BaseModel):
    factory_id: str
    vendor_name: str
    inquiry_text: Optional[str] = None
    product_type: Optional[str] = None
    origin_city: Optional[str] = None
    origin_country_iso2: Optional[str] = None
    quantity: Optional[int] = None
    lead_time_days: Optional[int] = None
    materials_required: Optional[str] = None

class QuoteOut(BaseModel):
    id: str
    ref: str

@router.post("/create", response_model=QuoteOut)
def create_quote(q: QuoteIn):
    result = create_quote_in_db(q.dict())
    return result
