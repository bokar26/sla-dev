from __future__ import annotations
from typing import Dict, Any, List
# TODO: replace with real repos/SQL calls
from sla_ai_components.data.repos import fetch_factories_for_spec, fetch_lane_candidates

def enrich_spec_with_data(spec: Dict[str, Any]) -> Dict[str, Any]:
    """
    Use available data to add corridor hints / feasibility flags before ranking.
    """
    factories = fetch_factories_for_spec(spec)
    lanes = fetch_lane_candidates(spec)

    # Pull origin/dest hints from lanes if not present
    if "origin_hint" not in spec and lanes:
        # crude example: infer origin from lane_id prefix
        lane0 = lanes[0]["lane_id"]
        if "-" in lane0:
            o = lane0.split("-")[0][:2].upper()
            spec["origin_hint"] = o
    if "dest_hint" not in spec and lanes:
        lane0 = lanes[0]["lane_id"]
        parts = lane0.split("-")
        if len(parts) >= 2:
            d = parts[1][:2].upper()
            spec["dest_hint"] = d

    spec["candidate_counts"] = {"factories": len(factories), "lanes": len(lanes)}
    return spec
