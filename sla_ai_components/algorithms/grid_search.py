from __future__ import annotations
from typing import Dict, List, Any
from sla_ai_components.algorithms.score import (
    cosine_match,
    compute_cost,
    logistics_score,
    rank_candidates,
)

def grid_rank(
    *,
    spec_vec,
    factories: List[Dict[str, Any]],
    materials: Dict[tuple, float],  # key: (material_id, region) -> index price
    lanes: List[Dict[str, Any]],
    params: Dict[str, Any]
) -> List[Dict[str, Any]]:
    cands: List[Dict[str, Any]] = []
    for f in factories:
        match = cosine_match(spec_vec, f['factory_vec'])
        mat_key = (f['material_id'], f['material_region'])
        mat_index = materials.get(mat_key, f.get('material_claim_price', 0.0))
        for lane in lanes:
            cost = compute_cost(
                fob=f['quoted_fob'],
                material_index=mat_index,
                supplier_claim=f.get('material_claim_price', mat_index),
                usage_per_unit=params['usage_per_unit'],
                duty_pct=params['duty_pct'],
                lane_rate=lane['rate'],
                unit_volume_or_weight=params['unit_volume_or_weight'],
            )
            logi = logistics_score(
                transit_days=lane['transit_days_p50'],
                on_time_rate=lane['on_time_rate'],
                seasonal_penalty=params.get('seasonal_penalty', 0.0),
            )
            risk = (
                params.get('risk_alpha', 0.5) * f.get('defect_rate_90d', 0.0) +
                params.get('risk_beta', 0.3) * lane.get('congestion_index', 0.0) +
                params.get('risk_gamma', 0.2) * f.get('material_volatility', 0.0)
            )
            cands.append({
                "factory_id": f['factory_id'],
                "lane_id": lane['lane_id'],
                "match": match,
                "cost": cost,
                "logistics": logi,
                "risk": risk,
                "fob": f['quoted_fob'],
                "transit_days": lane['transit_days_p50'],
                "on_time": lane['on_time_rate'],
            })
    return rank_candidates(cands)
