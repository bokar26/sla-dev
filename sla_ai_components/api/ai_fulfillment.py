from __future__ import annotations
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional

from sla_ai_components.data.repos import fetch_lane_candidates  # extend to fetch by origin/dest/mode
from sla_ai_components.logistics.estimators import estimate_logistics
from sla_ai_components.ai_ops.freight_calc import cbm_per_unit, ocean_freight_usd, air_chargeable_weight_kg, air_freight_usd
from sla_ai_components.ai_ops.route_scorer import score_routes

router = APIRouter(prefix="/ai/fulfillment", tags=["ai"])

class FulfillmentRequest(BaseModel):
    sku_spec: Dict[str, Any]
    qty_units: int = 1000
    origin_country: str
    dest_country: str
    transport_modes: List[str] = Field(default_factory=lambda: ["ocean","air"])
    profile: str = "balanced"  # "cost" | "speed" | "balanced"
    lane_limit: int = 10
    # Optional overrides
    port_fees_usd: float = 0.0
    broker_fee_usd: float = 0.0
    other_fees_usd: float = 0.0

class RouteOut(BaseModel):
    lane_id: str
    mode: str
    carrier: Optional[str] = None
    eta_days: float
    on_time_rate: float
    freight_usd: float
    duties_taxes_usd: float
    ex_factory_total_usd: float
    landed_total_usd: float
    score: float
    top: bool
    details: Dict[str, Any]

class FulfillmentResponse(BaseModel):
    routes: List[RouteOut]
    top_index: int

@router.post("/options", response_model=FulfillmentResponse)
def fulfillment_options(req: FulfillmentRequest):
    # 1) Build candidate lanes
    all_lanes = fetch_lane_candidates(req.sku_spec)  # extend to filter by origin/dest/mode
    if not all_lanes:
        raise HTTPException(404, "No lanes found")
    
    # Filter by transport modes first, then apply limit
    lanes = []
    for lane in all_lanes:
        lane_mode = lane.get("mode","ocean").lower()
        if lane_mode in [m.lower() for m in req.transport_modes]:
            lanes.append(lane)
            if len(lanes) >= req.lane_limit:
                break

    # 2) Compute BOM/weights/duties per mode+lane via estimate_logistics
    routes = []
    for lane in lanes:
        lane_mode = lane.get("mode","ocean").lower()

        # Logistics estimation (HS code, weights, duties rules)
        # We pass FOB basis via sku_spec.customs_basis_fob_usd if available; else allow 0 and use ex-factory later.
        logistics = estimate_logistics(
            sku_spec=req.sku_spec,
            bom=None,  # you can pass a BOM if you already computed it
            qty_units=req.qty_units,
            origin_country=req.origin_country,
            dest_country=req.dest_country,
            incoterm="FOB",
            freight_usd=0.0,          # we compute freight below per lane
            insurance_usd=0.0,
            transport_mode=lane_mode,
            corridor_overrides={
                "port_fees_usd": req.port_fees_usd,
                "broker_fee_usd": req.broker_fee_usd,
                "other_fees_usd": req.other_fees_usd,
            }
        )

        # 3) Freight math per lane
        freight_usd = 0.0
        eta_days = float(lane.get("transit_days_p50", 0))
        on_time = float(lane.get("on_time_rate", 0.0))

        if lane_mode == "air":
            chargeable = logistics["chargeable_weight_kg"]
            rate_per_kg = float(lane.get("rate", 0.0))
            freight_usd = air_freight_usd(rate_per_kg, chargeable)
        else:
            # ocean: assuming lane['rate'] is per CBM
            unit_cbm = cbm_per_unit(req.sku_spec.get("dimensions"))
            rate_per_cbm = float(lane.get("rate", 0.0))
            freight_usd = ocean_freight_usd(rate_per_cbm, req.qty_units, unit_cbm)

        # 4) Duties/taxes with chosen rules (basis FOB/CIF handled inside estimator)
        duties_usd = float(logistics["duties"]["total_border_charges_usd"])

        # 5) Ex-factory placeholder (if you already have ex-factory from cost API, pass it in sku_spec)
        ex_factory_total = float(req.sku_spec.get("ex_factory_total_usd", 0.0))

        # 6) Landed
        landed_total = ex_factory_total + freight_usd + duties_usd

        routes.append({
            "lane_id": lane["lane_id"],
            "mode": lane_mode,
            "carrier": lane.get("carrier"),
            "eta_days": eta_days,
            "on_time_rate": on_time,
            "freight_usd": freight_usd,
            "duties_taxes_usd": duties_usd,
            "ex_factory_total_usd": ex_factory_total,
            "landed_total_usd": landed_total,
            "risk": lane.get("congestion_index", 0.0),
            "details": {
                "weights": logistics["weights"],
                "hs": logistics["hs"],
                "regulations": logistics.get("regulations"),
                "rules_used": logistics.get("rules_used"),
            }
        })

    # 7) Score + sort
    ranked = score_routes(routes, req.profile)
    if not ranked:
        raise HTTPException(404, "No routes after filtering")

    # mark top
    ranked[0]["top"] = True
    for r in ranked[1:]:
        r["top"] = False

    # 8) Shape response
    out = [RouteOut(**r) for r in ranked]
    return FulfillmentResponse(routes=out, top_index=0)
