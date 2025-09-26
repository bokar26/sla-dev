from __future__ import annotations
import numpy as np
from typing import List, Dict, Tuple

def cosine_match(spec_vec: np.ndarray, factory_vec: np.ndarray) -> float:
    denom = (np.linalg.norm(spec_vec) * np.linalg.norm(factory_vec)) + 1e-9
    return float(np.dot(spec_vec, factory_vec) / denom)  # 0..1

def compute_cost(
    *,
    fob: float,
    material_index: float,
    supplier_claim: float,
    usage_per_unit: float,
    duty_pct: float,
    lane_rate: float,
    unit_volume_or_weight: float
) -> float:
    material_delta = (material_index - supplier_claim) * usage_per_unit
    logistics_cost = lane_rate * unit_volume_or_weight
    return fob - material_delta + duty_pct * fob + logistics_cost

def logistics_score(
    *,
    transit_days: float,
    on_time_rate: float,
    seasonal_penalty: float,
    max_transit_cap: float = 60.0
) -> float:
    time_term = 1 - min(transit_days / max_transit_cap, 1.0)
    return 0.5 * time_term + 0.5 * on_time_rate - seasonal_penalty

def rank_candidates(
    cands: List[Dict],
    weights: Tuple[float, float, float, float] = (0.35, 0.35, 0.20, 0.10)
) -> List[Dict]:
    """cands require: match (0..1), cost (float), logistics (0..1), risk (0..1)."""
    w1, w2, w3, w4 = weights
    costs = np.array([c['cost'] for c in cands], dtype=float)
    cmin, cmax = float(costs.min()), float(costs.max())
    span = (cmax - cmin + 1e-9)
    for c in cands:
        cost_norm = (c['cost'] - cmin) / span
        c['cost_norm'] = cost_norm
        c['total'] = w1 * c['match'] + w2 * (1 - cost_norm) + w3 * c['logistics'] - w4 * c['risk']
    return sorted(cands, key=lambda x: x['total'], reverse=True)
