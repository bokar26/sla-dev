from __future__ import annotations
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict, Any
import numpy as np

from sla_ai_components.embeddings.embed import embed_spec
from sla_ai_components.data.repos import (
    fetch_factories_for_spec,
    fetch_material_index_map,
    fetch_lane_candidates,
)
from sla_ai_components.algorithms.grid_search import grid_rank

router = APIRouter(tags=["rank"])

class CandidateOut(BaseModel):
    factory_id: str
    lane_id: str
    total: float
    match: float
    cost: float
    logistics: float
    risk: float
    fob: float
    transit_days: float
    on_time: float

class RankRequest(BaseModel):
    sku_spec: Dict[str, Any]
    qty: int = 1000
    hs_code: str = "6110.20"
    duty_pct: float = 0.0
    usage_per_unit: float = 0.35          # kg/pc or equivalent
    unit_volume_or_weight: float = 0.012  # cbm/pc or kg/pc
    seasonal_penalty: float = 0.0
    use_detailed_cost: bool = False        # NEW: Use /cost/estimate for detailed cost calculation

@router.post("", response_model=List[CandidateOut])
def rank(req: RankRequest):
    spec_vec = np.array(embed_spec(req.sku_spec), dtype=float)

    factories = fetch_factories_for_spec(req.sku_spec)
    materials = fetch_material_index_map(req.sku_spec)
    lanes = fetch_lane_candidates(req.sku_spec)

    # TODO: If use_detailed_cost=True, call /cost/estimate for each factory
    # and use the detailed landed cost instead of the simple cost calculation
    # For now, we'll use the existing grid_rank logic
    
    ranked = grid_rank(
        spec_vec=spec_vec,
        factories=factories,
        materials=materials,
        lanes=lanes,
        params=dict(
            duty_pct=req.duty_pct,
            usage_per_unit=req.usage_per_unit,
            unit_volume_or_weight=req.unit_volume_or_weight,
            seasonal_penalty=req.seasonal_penalty,
        ),
    )
    return [
        CandidateOut(
            factory_id=c["factory_id"],
            lane_id=c["lane_id"],
            total=c["total"],
            match=c["match"],
            cost=c["cost"],
            logistics=c["logistics"],
            risk=c["risk"],
            fob=c["fob"],
            transit_days=c["transit_days"],
            on_time=c["on_time"],
        )
        for c in ranked[:5]
    ]
