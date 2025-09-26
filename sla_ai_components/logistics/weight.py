from __future__ import annotations
from typing import Dict, Any

DEFAULT_PACKAGING_PER_UNIT_KG = 0.05
DEFAULT_PALLET_KG = 20.0

def estimate_unit_net_weight_kg(sku_spec: Dict[str, Any], bom: Dict[str, Any] | None) -> float:
    """
    Try BOM first (sum material qty where unit is kg).
    Fallback: derive from dimensions/density if provided, else heuristic.
    """
    # BOM-based
    if bom and "materials" in bom:
        total = 0.0
        for m in bom["materials"]:
            unit = str(m.get("unit","")).lower()
            if unit in ("kg","kilogram","kilograms"):
                total += float(m.get("qty",0.0))
        if total > 0:
            return total
    # Dimension heuristic
    dims = sku_spec.get("dimensions")
    density = sku_spec.get("density_kg_per_m3")
    if dims and density:
        x,y,z = dims.get("x"), dims.get("y"), dims.get("z")
        if all(isinstance(v,(int,float)) for v in (x,y,z)):
            m3 = (x/100.0)*(y/100.0)*(z/100.0)
            return m3 * float(density)
    # Fallback heuristic by category
    cat = str(sku_spec.get("category","generic")).lower()
    if cat in ("tshirt","shirt","hoodie","apparel","garment"):
        return 0.45  # kg per garment (rough default; tune later)
    return 1.0      # generic default

def estimate_packaging_per_unit_kg(sku_spec: Dict[str, Any]) -> float:
    return float(sku_spec.get("packaging_kg_per_unit", DEFAULT_PACKAGING_PER_UNIT_KG))

def compute_weights(qty_units: int, unit_net_kg: float, packaging_kg_per_unit: float, include_pallet: bool = True):
    net = unit_net_kg * qty_units
    packaging = packaging_kg_per_unit * qty_units
    pallet = DEFAULT_PALLET_KG if include_pallet else 0.0
    gross = net + packaging + pallet
    return {"unit_net_kg": unit_net_kg, "net_kg": net, "packaging_kg": packaging, "pallet_kg": pallet, "gross_kg": gross}

def chargeable_air_weight_kg(dimensions_cm: Dict[str, float] | None, qty_units: int, gross_kg: float) -> float:
    """
    IATA volumetric weight heuristic: (L*W*H in cm) / 6000 per package.
    If per-unit dims exist, use qty multiplier. Else fall back to gross.
    """
    if not dimensions_cm:
        return gross_kg
    L, W, H = dimensions_cm.get("x"), dimensions_cm.get("y"), dimensions_cm.get("z")
    if not all(isinstance(v,(int,float)) and v>0 for v in (L,W,H)):
        return gross_kg
    vol_per_unit = (L*W*H)/6000.0
    vol_total = vol_per_unit * qty_units
    return max(gross_kg, vol_total)
