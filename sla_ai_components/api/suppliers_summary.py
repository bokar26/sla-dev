from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import List, Optional, Any
from sla_ai_components.data.repos import fetch_suppliers_summary

router = APIRouter(prefix="/api", tags=["suppliers"])

class SupplierItem(BaseModel):
    id: str
    vendor_name: str
    country_iso2: Optional[str] = None
    city: Optional[str] = None
    category: Optional[str] = None
    updated_at: Optional[str] = None

class SupplierSummary(BaseModel):
    total: int
    items: List[SupplierItem]

@router.get("/suppliers/summary", response_model=SupplierSummary)
def suppliers_summary(limit: int = Query(5, ge=1, le=50)):
    data = fetch_suppliers_summary(limit=limit)
    return data
