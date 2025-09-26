from __future__ import annotations
from typing import Dict, Any, List
from datetime import datetime, timedelta

# TODO: replace with real repos/queries
def fetch_recent_orders(tenant_id: str, days: int = 30) -> List[Dict[str, Any]]:
    """Return recent orders/shipments with: sku_spec, qty, origin, dest, mode, cost, eta, lane_id, factory_id."""
    # Mock data for demonstration - replace with real database queries
    return [
        {
            "sku_spec": {"category": "hoodie", "dimensions": {"x": 30, "y": 25, "z": 8}},
            "qty": 1000,
            "origin": "IN",
            "dest": "US", 
            "mode": "ocean",
            "landed_usd": 12000.0,
            "eta_days": 20.0,
            "lane_id": "IN-US-001",
            "factory_id": "F001"
        },
        {
            "sku_spec": {"category": "t-shirt", "dimensions": {"x": 25, "y": 20, "z": 5}},
            "qty": 2000,
            "origin": "CN",
            "dest": "US",
            "mode": "air",
            "landed_usd": 15000.0,
            "eta_days": 3.0,
            "lane_id": "CN-US-AIR-001",
            "factory_id": "F002"
        },
        {
            "sku_spec": {"category": "denim", "dimensions": {"x": 35, "y": 30, "z": 10}},
            "qty": 500,
            "origin": "IN",
            "dest": "US",
            "mode": "ocean",
            "landed_usd": 8000.0,
            "eta_days": 22.0,
            "lane_id": "IN-US-001",
            "factory_id": "F001"
        }
    ]

def build_trend_features(tenant_id: str, lookback_days: int = 90) -> Dict[str, Any]:
    orders = fetch_recent_orders(tenant_id, lookback_days)
    # Aggregate by corridor & SKU category
    corridors = {}
    categories = {}
    for o in orders:
        corridor = f"{o.get('origin')}-{o.get('dest')}"
        corridors.setdefault(corridor, {"count":0, "qty":0, "avg_cost":0.0, "avg_eta":0.0})
        c = corridors[corridor]
        c["count"] += 1
        c["qty"] += int(o.get("qty",0))
        c["avg_cost"] += float(o.get("landed_usd", 0.0))
        c["avg_eta"] += float(o.get("eta_days", 0.0))
        cat = (o.get("sku_spec",{}).get("category") or "generic").lower()
        categories[cat] = categories.get(cat, 0) + 1

    for k,v in corridors.items():
        if v["count"]:
            v["avg_cost"] /= v["count"]
            v["avg_eta"]  /= v["count"]

    return {
        "orders": orders,
        "corridors": corridors,        # frequent corridors
        "categories": categories       # frequent product types
    }
