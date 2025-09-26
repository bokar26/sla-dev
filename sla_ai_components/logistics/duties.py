from __future__ import annotations
from typing import Dict, Any

"""
Config-driven estimator. We avoid hardcoding jurisdictional minutiae.
Corridor config chooses customs value basis and which fees/taxes to apply.
"""

def customs_value(
    *,
    basis: str,                 # "FOB" or "CIF"
    fob_usd: float,
    insurance_usd: float,
    freight_usd: float
) -> float:
    if basis.upper() == "CIF":
        return fob_usd + insurance_usd + freight_usd
    return fob_usd  # FOB basis

def estimate_duty_usd(customs_value_usd: float, duty_rate_pct: float) -> float:
    return customs_value_usd * max(duty_rate_pct, 0.0)

def estimate_import_tax_usd(customs_value_usd: float, duty_usd: float, import_tax_rate_pct: float) -> float:
    """
    VAT/GST often applies to (customs value + duty + sometimes freight/fees).
    We keep it generic via corridor config; default: value + duty.
    """
    taxable = customs_value_usd + duty_usd
    return taxable * max(import_tax_rate_pct, 0.0)

def estimate_surcharges_usd(port_fees_usd: float = 0.0, broker_fee_usd: float = 0.0, other_fees_usd: float = 0.0) -> float:
    return max(port_fees_usd, 0.0) + max(broker_fee_usd, 0.0) + max(other_fees_usd, 0.0)

# Example corridor defaults (tune/extend per destination)
CORRIDOR_CONFIG = {
    # Example generic: duty on FOB (or CIF per corridor), optional import tax
    # NOTE: Replace these with real corridor rules when available.
    ("IN","US"): {"basis":"FOB", "duty_rate_pct": 0.10, "import_tax_rate_pct": 0.00},
    ("CN","US"): {"basis":"FOB", "duty_rate_pct": 0.10, "import_tax_rate_pct": 0.00},
    ("IN","EU"): {"basis":"CIF", "duty_rate_pct": 0.09, "import_tax_rate_pct": 0.20},  # VAT example
}

def estimate_duties_with_rules(
    *,
    rules: Dict[str, Any],
    customs_basis_fob_usd: float,
    insurance_usd: float,
    freight_usd: float,
    surcharges: Dict[str, float] | None = None
) -> Dict[str, Any]:
    """
    Compute duties using explicit rules (from regulations or corridor config).
    """
    basis = rules.get("basis","FOB")
    value = customs_value(basis=basis, fob_usd=customs_basis_fob_usd, insurance_usd=insurance_usd, freight_usd=freight_usd)
    duty_rate_pct = float(rules.get("duty_rate_pct", 0.0))
    import_tax_rate_pct = float(rules.get("import_tax_rate_pct", 0.0))

    duty_usd = estimate_duty_usd(value, duty_rate_pct)
    import_tax_usd = estimate_import_tax_usd(value, duty_usd, import_tax_rate_pct)

    s = surcharges or {}
    sur = estimate_surcharges_usd(s.get("port_fees_usd",0.0), s.get("broker_fee_usd",0.0), s.get("other_fees_usd",0.0))
    total = duty_usd + import_tax_usd + sur
    return {
        "basis": basis,
        "customs_value_usd": value,
        "duty_rate_pct": duty_rate_pct,
        "duty_usd": duty_usd,
        "import_tax_rate_pct": import_tax_rate_pct,
        "import_tax_usd": import_tax_usd,
        "surcharges_usd": sur,
        "total_border_charges_usd": total
    }

def estimate_duties_and_taxes(
    *,
    origin_country: str,
    dest_country: str,
    hs_code: str,
    customs_basis_fob_usd: float,
    insurance_usd: float,
    freight_usd: float,
    overrides: Dict[str, float] | None = None
) -> Dict[str, Any]:
    """
    Returns a generic estimate; real corridors can override rates/basis.
    (Kept for backward compatibility)
    """
    cfg = CORRIDOR_CONFIG.get((origin_country, dest_country), {"basis":"FOB","duty_rate_pct":0.0,"import_tax_rate_pct":0.0})
    if overrides:
        cfg = {**cfg, **overrides}

    value = customs_value(basis=cfg["basis"], fob_usd=customs_basis_fob_usd, insurance_usd=insurance_usd, freight_usd=freight_usd)
    duty_usd = estimate_duty_usd(value, cfg["duty_rate_pct"])
    import_tax_usd = estimate_import_tax_usd(value, duty_usd, cfg["import_tax_rate_pct"])

    # Surcharges placeholders (configurable by corridor/customer)
    port_fees_usd = overrides.get("port_fees_usd", 0.0) if overrides else 0.0
    broker_fee_usd = overrides.get("broker_fee_usd", 0.0) if overrides else 0.0
    other_fees_usd = overrides.get("other_fees_usd", 0.0) if overrides else 0.0
    surcharges_usd = estimate_surcharges_usd(port_fees_usd, broker_fee_usd, other_fees_usd)

    total = duty_usd + import_tax_usd + surcharges_usd
    return {
        "basis": cfg["basis"],
        "customs_value_usd": value,
        "duty_rate_pct": cfg["duty_rate_pct"],
        "duty_usd": duty_usd,
        "import_tax_rate_pct": cfg["import_tax_rate_pct"],
        "import_tax_usd": import_tax_usd,
        "surcharges_usd": surcharges_usd,
        "total_border_charges_usd": total
    }
