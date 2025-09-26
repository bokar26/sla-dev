from __future__ import annotations
from typing import Dict, Any, List
from sla_ai_components.suggestions.generator import candidate_routes, candidate_suppliers
from sla_ai_components.logistics.estimators import estimate_logistics
from sla_ai_components.ai_ops.route_scorer import score_routes

def evaluate_route_suggestions(tenant_id: str, spec: Dict[str, Any], origin: str, dest: str, qty: int = 1000) -> List[Dict[str, Any]]:
    lanes = candidate_routes(spec, origin, dest)
    # For each lane, compute freight + duties (logistics) and build a route object, then score
    routes = []
    for lane in lanes:
        logistics = estimate_logistics(
            sku_spec={**spec, "customs_basis_fob_usd": 0.0},
            bom=None,
            qty_units=qty,
            origin_country=origin or "IN",
            dest_country=dest or "US",
            incoterm="FOB",
            freight_usd=0.0,
            insurance_usd=0.0,
            transport_mode=lane.get("mode","ocean").lower()
        )
        # NOTE: In a real system you'd compute freight with your rate tables; keep zero for relative duty basis demo
        duties = float(logistics["duties"]["total_border_charges_usd"])
        routes.append({
            "lane_id": lane["lane_id"], "mode": lane.get("mode","ocean").lower(),
            "on_time_rate": float(lane.get("on_time_rate", 0.0)),
            "eta_days": float(lane.get("transit_days_p50", 0.0)),
            "freight_usd": float(lane.get("rate", 0.0)),  # placeholder
            "duties_taxes_usd": duties,
            "landed_total_usd": float(lane.get("rate", 0.0)) + duties,
            "risk": lane.get("congestion_index", 0.0),
        })
    ranked = score_routes(routes, "balanced")
    # Convert top few into suggestions (expected improvements require baseline comparison; stub a delta)
    out = []
    for r in ranked[:3]:
        out.append({
            "kind":"route",
            "title": f"Try {r['mode'].upper()} lane {r['lane_id']}",
            "description": "Lower combined landed or faster ETA based on current lanes.",
            "data_json": {"route": r, "spec": spec, "origin": origin, "dest": dest},
            "impact_score": float(r["score"]),
            "expected_savings_usd": max(0.0, 100.0 * r["score"]),   # stub
            "expected_eta_days_delta": -1.0 if r["mode"]=="air" else 0.0,
            "confidence": 0.6
        })
    return out

def evaluate_supplier_suggestions(tenant_id: str, spec: Dict[str, Any], origin: str, dest: str, qty: int = 1000) -> List[Dict[str, Any]]:
    # Use mock ranking for supplier suggestions
    suppliers = candidate_suppliers(spec)
    out = []
    for i, supplier in enumerate(suppliers[:3]):
        # Mock ranking scores
        mock_score = 0.7 + (i * 0.1)  # Decreasing scores
        out.append({
            "kind":"supplier",
            "title": f"Consider factory {supplier['factory_id']}",
            "description": "Higher match score and potentially lower landed cost.",
            "data_json": {"supplier": supplier, "spec": spec},
            "impact_score": mock_score,
            "expected_savings_usd": max(0.0, 120.0 * mock_score),
            "expected_eta_days_delta": -0.5 if mock_score > 0.5 else 0.0,
            "confidence": 0.65
        })
    return out
