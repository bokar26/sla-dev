from __future__ import annotations
from typing import Dict, Any

def cbm_per_unit(dimensions_cm: Dict[str, float]) -> float:
    if not dimensions_cm: return 0.0
    L, W, H = dimensions_cm.get("x",0), dimensions_cm.get("y",0), dimensions_cm.get("z",0)
    if min(L,W,H) <= 0: return 0.0
    return (L/100.0)*(W/100.0)*(H/100.0)

def ocean_freight_usd(rate_usd_per_cbm: float, qty_units: int, unit_cbm: float) -> float:
    return float(rate_usd_per_cbm * unit_cbm * qty_units)

def air_chargeable_weight_kg(dimensions_cm: Dict[str,float] | None, qty_units: int, gross_kg: float) -> float:
    # IATA volumetric divisor 6000
    if not dimensions_cm: return gross_kg
    L, W, H = dimensions_cm.get("x",0), dimensions_cm.get("y",0), dimensions_cm.get("z",0)
    if min(L,W,H) <= 0: return gross_kg
    vol_per_unit = (L*W*H)/6000.0
    vol_total = vol_per_unit * qty_units
    return max(gross_kg, vol_total)

def air_freight_usd(rate_usd_per_kg: float, chargeable_kg: float) -> float:
    return float(rate_usd_per_kg * chargeable_kg)
