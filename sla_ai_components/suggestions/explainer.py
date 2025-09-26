from __future__ import annotations
from typing import Dict, Any

def explain(s: Dict[str, Any]) -> str:
    k = s.get("kind")
    if k == "route":
        r = s["data_json"]["route"]
        return f"ETA {round(r['eta_days'])}d, on-time {round(100*r['on_time_rate'])}%, duties ${r['duties_taxes_usd']:.2f}."
    if k == "supplier":
        supplier = s["data_json"]["supplier"]
        return f"Factory {supplier['factory_id']} in {supplier.get('country_iso2', 'Unknown')} with strong capability match."
    return "Opportunity detected based on recent trends."
