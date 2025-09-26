from __future__ import annotations
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Any, Dict, Optional, List

from sla_ai_components.logistics.estimators import estimate_logistics

router = APIRouter(prefix="/logistics", tags=["logistics"])

class LogisticsRequest(BaseModel):
    sku_spec: Dict[str, Any]
    bom: Optional[Dict[str, Any]] = None
    qty_units: int = 1000
    origin_country: str = "IN"
    dest_country: str = "US"
    incoterm: str = "FOB"
    freight_usd: float = 0.0
    insurance_usd: float = 0.0
    transport_mode: str = "ocean"
    corridor_overrides: Optional[Dict[str, float]] = None
    # If known, you can pass a customs_basis_fob_usd in sku_spec for duties calc.

class RoutePlanningRequest(BaseModel):
    origin: Dict[str, Optional[str]]
    destination: Dict[str, Optional[str]]
    quote_id: Optional[str] = None

class RouteOption(BaseModel):
    mode: str
    carrier: str
    transit_days: int
    cost_usd: float
    reliability: float
    description: str

class RoutePlanningResponse(BaseModel):
    options: List[RouteOption]
    origin: Dict[str, Optional[str]]
    destination: Dict[str, Optional[str]]
    quote_id: Optional[str] = None

@router.post("/estimate")
def logistics_estimate(req: LogisticsRequest):
    result = estimate_logistics(
        sku_spec=req.sku_spec,
        bom=req.bom,
        qty_units=req.qty_units,
        origin_country=req.origin_country,
        dest_country=req.dest_country,
        incoterm=req.incoterm,
        freight_usd=req.freight_usd,
        insurance_usd=req.insurance_usd,
        transport_mode=req.transport_mode,
        corridor_overrides=req.corridor_overrides
    )
    return result

@router.post("/plan", response_model=RoutePlanningResponse)
def plan_route(req: RoutePlanningRequest):
    """
    Plan shipping routes between origin and destination.
    Returns available shipping options with costs and transit times.
    """
    # Mock route options for now - replace with real logistics planning
    options = [
        RouteOption(
            mode="ocean",
            carrier="Maersk",
            transit_days=21,
            cost_usd=850.0,
            reliability=0.95,
            description="Standard ocean freight via container"
        ),
        RouteOption(
            mode="ocean",
            carrier="CMA CGM",
            transit_days=18,
            cost_usd=920.0,
            reliability=0.92,
            description="Express ocean freight"
        ),
        RouteOption(
            mode="air",
            carrier="FedEx",
            transit_days=3,
            cost_usd=2800.0,
            reliability=0.98,
            description="Air freight express"
        ),
        RouteOption(
            mode="air",
            carrier="DHL",
            transit_days=5,
            cost_usd=2200.0,
            reliability=0.96,
            description="Air freight standard"
        )
    ]
    
    return RoutePlanningResponse(
        options=options,
        origin=req.origin,
        destination=req.destination,
        quote_id=req.quote_id
    )
