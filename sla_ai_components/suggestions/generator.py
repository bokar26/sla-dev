from __future__ import annotations
from typing import Dict, Any, List
from sla_ai_components.data.repos import fetch_lane_candidates, fetch_factories_for_spec

def candidate_routes(spec: Dict[str, Any], origin: str, dest: str, lane_limit: int = 8):
    lanes = fetch_lane_candidates(spec)[:lane_limit]
    # Filter to same origin/dest if your repo supports it; else keep generic and let evaluator score.
    return lanes

def candidate_suppliers(spec: Dict[str, Any], k: int = 10):
    return fetch_factories_for_spec(spec)[:k]

def build_candidates_from_trends(features: Dict[str, Any]) -> List[Dict[str, Any]]:
    cands = []
    # For each frequent corridor & category, propose both routes & suppliers
    for corridor, agg in (features.get("corridors") or {}).items():
        origin, dest = corridor.split("-") if "-" in corridor else (None, None)
        for cat, _cnt in (features.get("categories") or {}).items():
            spec = {"category": cat}
            cands.append({"type":"route", "spec": spec, "origin": origin, "dest": dest})
            cands.append({"type":"supplier", "spec": spec, "origin": origin, "dest": dest})
    return cands
