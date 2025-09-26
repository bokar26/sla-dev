from __future__ import annotations
from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Any, Dict, List, Tuple

from sla_ai_components.costing.bom_llm import get_bom_from_llm
from sla_ai_components.costing.cost_models import compute_cost_baseline_usd
from sla_ai_components.logistics.estimators import estimate_logistics

router = APIRouter(prefix="/cost", tags=["cost"])

# TODO: replace with real DB lookups
def material_price_lookup(material_id: str, name: str, unit: str, region: str) -> Tuple[float, str]:
    # Example stub: $2.85/kg for cotton-like, $0.10/set packaging, etc.
    if unit.lower() in ("kg", "kilogram", "kilograms"):
        return 2.85, f"stub_index_{region}"
    if unit.lower() in ("m", "meter", "metre"):
        return 1.10, f"stub_index_{region}"
    if unit.lower() in ("pcs", "piece", "set"):
        return 0.10, f"stub_index_{region}"
    return 1.00, f"stub_index_{region}"

class CostRequest(BaseModel):
    sku_spec: Dict[str, Any]
    qty_units: int = 1000
    region: str = "TN-IN"
    duty_pct: float = 0.0
    logistics_cost_usd: float = 0.0
    labor_rate_usd_per_hour: float = 3.5
    overhead_pct_of_direct: float = 0.18
    setup_cost_usd: float = 250.0
    amortize_units: int = 10000
    packaging_cost_per_unit_usd: float = 0.08
    qc_cost_per_unit_usd: float = 0.05
    inland_freight_per_unit_usd: float = 0.03
    fob_override_usd: float | None = None
    use_llm_bom: bool = True
    # NEW: Logistics integration options
    use_logistics_estimate: bool = False
    origin_country: str = "IN"
    dest_country: str = "US"
    transport_mode: str = "ocean"
    freight_usd: float = 0.0
    insurance_usd: float = 0.0

@router.post("/estimate")
def estimate_cost(req: CostRequest):
    bom = get_bom_from_llm(req.sku_spec) if req.use_llm_bom else {"materials": [], "labor_std_hours": 0.0, "confidence": 0.5}
    
    # NEW: Optionally call logistics estimation for detailed duties/taxes
    logistics_result = None
    if req.use_logistics_estimate:
        # Add FOB value to sku_spec for customs calculation
        sku_spec_with_fob = req.sku_spec.copy()
        if req.fob_override_usd:
            sku_spec_with_fob["customs_basis_fob_usd"] = req.fob_override_usd
        
        logistics_result = estimate_logistics(
            sku_spec=sku_spec_with_fob,
            bom=bom,
            qty_units=req.qty_units,
            origin_country=req.origin_country,
            dest_country=req.dest_country,
            freight_usd=req.freight_usd,
            insurance_usd=req.insurance_usd,
            transport_mode=req.transport_mode
        )
    
    # Use logistics duties if available, otherwise fall back to simple duty_pct
    duty_pct = req.duty_pct
    logistics_cost_usd = req.logistics_cost_usd
    
    if logistics_result:
        # Use detailed duties from logistics estimation
        duties_total = logistics_result["duties"]["total_border_charges_usd"]
        # TODO: Replace simple duty_pct calculation with detailed duties
        # For now, we'll add the duties to logistics_cost_usd
        logistics_cost_usd += duties_total
    
    cost = compute_cost_baseline_usd(
        sku_spec=req.sku_spec,
        qty_units=req.qty_units,
        region=req.region,
        bom=bom,
        material_price_lookup=material_price_lookup,
        labor_rate_usd_per_hour=req.labor_rate_usd_per_hour,
        overhead_pct_of_direct=req.overhead_pct_of_direct,
        setup_cost_usd=req.setup_cost_usd,
        amortize_units=req.amortize_units,
        packaging_cost_per_unit_usd=req.packaging_cost_per_unit_usd,
        qc_cost_per_unit_usd=req.qc_cost_per_unit_usd,
        inland_freight_per_unit_usd=req.inland_freight_per_unit_usd,
        duty_pct=duty_pct,
        logistics_cost_usd=logistics_cost_usd,
        fob_override_usd=req.fob_override_usd
    )
    
    result = {"bom": bom, "cost": cost}
    if logistics_result:
        result["logistics"] = logistics_result
    
    return result
