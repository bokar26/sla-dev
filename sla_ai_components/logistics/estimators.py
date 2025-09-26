from __future__ import annotations
from typing import Dict, Any, Tuple
from .hs_llm import infer_hs_code
from .weight import estimate_unit_net_weight_kg, estimate_packaging_per_unit_kg, compute_weights, chargeable_air_weight_kg
from .duties import estimate_duties_and_taxes, estimate_duties_with_rules
from .regulations_llm import get_regulations
from .corridor_rules import choose_rules

def estimate_logistics(
    *,
    sku_spec: Dict[str, Any],
    bom: Dict[str, Any] | None,
    qty_units: int,
    origin_country: str,
    dest_country: str,
    incoterm: str = "FOB",
    freight_usd: float = 0.0,
    insurance_usd: float = 0.0,
    transport_mode: str = "ocean",
    corridor_overrides: Dict[str, float] | None = None
) -> Dict[str, Any]:
    # 1) HS code via LLM
    hs = infer_hs_code(sku_spec)

    # 2) Weight calculation
    unit_net_kg = estimate_unit_net_weight_kg(sku_spec, bom)
    packaging_kg_per_unit = estimate_packaging_per_unit_kg(sku_spec)
    weights = compute_weights(qty_units, unit_net_kg, packaging_kg_per_unit, include_pallet=True)

    chargeable_kg = weights["gross_kg"]
    if transport_mode.lower() == "air":
        dims = sku_spec.get("dimensions")
        chargeable_kg = chargeable_air_weight_kg(dims, qty_units, weights["gross_kg"])

    # 3a) Get regulations for origin/dest + HS
    regs = get_regulations(origin_country=origin_country, dest_country=dest_country, hs_code=hs["primary_hs"])

    # 3b) Choose rules (regs if confident, else corridor defaults)
    rules = choose_rules(origin_country=origin_country, dest_country=dest_country, hs_code=hs["primary_hs"], regs=regs)

    # 3c) Compute duties using chosen rules
    customs_basis_fob_usd = float(sku_spec.get("customs_basis_fob_usd", 0.0))
    sur = {}
    if "surcharges" in sku_spec:
        sur = sku_spec["surcharges"]  # e.g., {"port_fees_usd":40,"broker_fee_usd":100}

    duties = estimate_duties_with_rules(
        rules=rules,
        customs_basis_fob_usd=customs_basis_fob_usd,
        insurance_usd=insurance_usd,
        freight_usd=freight_usd,
        surcharges=sur
    )

    return {
        "hs": hs,
        "weights": weights,
        "chargeable_weight_kg": chargeable_kg,
        "regulations": regs,   # include docs/exemptions/restrictions for UI
        "rules_used": rules,   # which basis/rates we applied
        "duties": duties
    }
