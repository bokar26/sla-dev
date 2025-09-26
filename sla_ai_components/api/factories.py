from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from sla_ai_components.data.factories_repo import get_factory_full_hydrated

router = APIRouter(prefix="/api/factories", tags=["factories"])

class FactoryOut(BaseModel):
    id: str
    vendor_name: str
    site_name: Optional[str] = None
    country_iso2: Optional[str] = None
    city: Optional[str] = None
    capabilities: List[str] = []
    certifications: List[str] = []
    past_clients: List[str] = []
    moq: Optional[int] = None
    lead_time_days: Optional[int] = None
    capacity_units_month: Optional[int] = None
    images: List[str] = []

@router.get("/{factory_id}", response_model=FactoryOut)
def get_factory(factory_id: str):
    data = get_factory_full_hydrated(factory_id)
    if not data:
        raise HTTPException(status_code=404, detail="Factory not found")
    return data
