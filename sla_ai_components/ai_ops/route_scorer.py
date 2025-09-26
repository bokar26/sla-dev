from __future__ import annotations
from typing import List, Dict, Tuple
import numpy as np

PROFILES = {
  "balanced":  {"w_cost":0.45, "w_speed":0.35, "w_rel":0.20, "w_risk":0.10},
  "cost":      {"w_cost":0.60, "w_speed":0.20, "w_rel":0.20, "w_risk":0.10},
  "speed":     {"w_cost":0.25, "w_speed":0.55, "w_rel":0.20, "w_risk":0.10},
}

def normalize_array(vals: List[float]) -> List[float]:
    arr = np.array(vals, dtype=float)
    vmin, vmax = float(arr.min()), float(arr.max())
    span = (vmax - vmin) or 1.0
    return [ (v - vmin) / span for v in arr ]

def score_routes(routes: List[Dict], profile: str = "balanced") -> List[Dict]:
    """
    Each route dict must contain: 'landed_total_usd', 'eta_days', 'on_time_rate', 'risk'
    Returns sorted list with 'score' and normalized fields.
    """
    if not routes: return []
    prof = PROFILES.get(profile, PROFILES["balanced"])

    costs   = [r["landed_total_usd"] for r in routes]
    etas    = [r["eta_days"] for r in routes]
    rels    = [r.get("on_time_rate", 0.0) for r in routes]
    risks   = [r.get("risk", 0.0) for r in routes]

    cost_norm = normalize_array(costs)      # lower better
    eta_norm  = normalize_array(etas)       # lower better

    for i, r in enumerate(routes):
        score = (
            prof["w_cost"] * (1 - cost_norm[i]) +
            prof["w_speed"] * (1 - eta_norm[i]) +
            prof["w_rel"]  * rels[i] -
            prof["w_risk"] * risks[i]
        )
        r["score"] = float(score)
        r["cost_norm"] = cost_norm[i]
        r["eta_norm"] = eta_norm[i]

    return sorted(routes, key=lambda x: x["score"], reverse=True)
