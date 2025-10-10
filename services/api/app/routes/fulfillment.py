from __future__ import annotations
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any

router = APIRouter(prefix="/v1/fulfillment", tags=["fulfillment"])

class RouteReq(BaseModel):
    incoterm: str
    payload: Dict[str, Any]

# Incoterms and their responsibilities
INCOTERMS_RESPONSIBILITIES = {
    "EXW": {
        "seller": ["goods_ready"],
        "buyer": ["export_clearance", "origin_handling", "main_carriage", "insurance", "destination_handling", "customs_duties", "last_mile"]
    },
    "FCA": {
        "seller": ["goods_ready", "export_clearance"],
        "buyer": ["origin_handling", "main_carriage", "insurance", "destination_handling", "customs_duties", "last_mile"]
    },
    "FAS": {
        "seller": ["goods_ready", "export_clearance"],
        "buyer": ["origin_handling", "main_carriage", "insurance", "destination_handling", "customs_duties", "last_mile"]
    },
    "FOB": {
        "seller": ["goods_ready", "export_clearance", "origin_handling"],
        "buyer": ["main_carriage", "insurance", "destination_handling", "customs_duties", "last_mile"]
    },
    "CFR": {
        "seller": ["goods_ready", "export_clearance", "origin_handling", "main_carriage"],
        "buyer": ["insurance", "destination_handling", "customs_duties", "last_mile"]
    },
    "CIF": {
        "seller": ["goods_ready", "export_clearance", "origin_handling", "main_carriage", "insurance"],
        "buyer": ["destination_handling", "customs_duties", "last_mile"]
    },
    "CPT": {
        "seller": ["goods_ready", "export_clearance", "origin_handling", "main_carriage"],
        "buyer": ["insurance", "destination_handling", "customs_duties", "last_mile"]
    },
    "CIP": {
        "seller": ["goods_ready", "export_clearance", "origin_handling", "main_carriage", "insurance"],
        "buyer": ["destination_handling", "customs_duties", "last_mile"]
    },
    "DAP": {
        "seller": ["goods_ready", "export_clearance", "origin_handling", "main_carriage", "destination_handling"],
        "buyer": ["customs_duties", "last_mile"]
    },
    "DPU": {
        "seller": ["goods_ready", "export_clearance", "origin_handling", "main_carriage", "destination_handling", "unloading"],
        "buyer": ["customs_duties", "last_mile"]
    },
    "DDP": {
        "seller": ["goods_ready", "export_clearance", "origin_handling", "main_carriage", "destination_handling", "customs_duties", "last_mile"],
        "buyer": []
    }
}

def estimate_costs(incoterm: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    """Estimate costs for different Incoterms"""
    weight = float(payload.get("weight_kg", 0))
    volume = float(payload.get("volume_cbm", 0))
    goods_value = float(payload.get("goods_value", 0))
    mode = payload.get("mode", "sea").lower()
    
    # Base cost calculations
    if mode == "sea":
        base_carriage = max(50, volume * 30 + weight * 0.5)
    elif mode == "air":
        base_carriage = max(100, weight * 2.5)
    else:  # land
        base_carriage = max(75, weight * 1.5)
    
    # Cost components
    cost_components = {
        "goods_ready": 0,  # No additional cost
        "export_clearance": 80.0,
        "origin_handling": 120.0,
        "main_carriage": base_carriage,
        "insurance": max(30.0, goods_value * 0.003),  # 0.3% of goods value
        "destination_handling": 140.0,
        "unloading": 90.0,
        "customs_duties": float(payload.get("duties_taxes", 0)),
        "last_mile": 120.0
    }
    
    # Determine who pays what
    responsibilities = INCOTERMS_RESPONSIBILITIES.get(incoterm.upper(), {})
    seller_responsibilities = responsibilities.get("seller", [])
    buyer_responsibilities = responsibilities.get("buyer", [])
    
    seller_costs = {}
    buyer_costs = {}
    
    for component, cost in cost_components.items():
        if component in seller_responsibilities:
            seller_costs[component] = cost
        elif component in buyer_responsibilities:
            buyer_costs[component] = cost
    
    return {
        "buyer_cost": round(sum(buyer_costs.values()), 2),
        "seller_cost": round(sum(seller_costs.values()), 2),
        "breakdown": {
            "buyer": buyer_costs,
            "seller": seller_costs
        },
        "total_cost": round(sum(cost_components.values()), 2)
    }

@router.get("/incoterms")
def get_incoterms():
    """Get available Incoterms and their field requirements"""
    return {
        "incoterms": list(INCOTERMS_RESPONSIBILITIES.keys()),
        "responsibilities": INCOTERMS_RESPONSIBILITIES
    }

@router.post("/plan")
def plan_route(req: RouteReq):
    """Plan a route with cost estimation for a specific Incoterm"""
    incoterm = req.incoterm.upper()
    if incoterm not in INCOTERMS_RESPONSIBILITIES:
        raise HTTPException(400, f"Invalid incoterm: {incoterm}")
    
    costs = estimate_costs(incoterm, req.payload or {})
    
    return {
        "incoterm": incoterm,
        "costs": costs,
        "payload": req.payload
    }