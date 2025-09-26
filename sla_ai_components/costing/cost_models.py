from __future__ import annotations
from typing import Dict, Any, List, Tuple
from decimal import Decimal
from .currency import convert_to_usd

def compute_material_cost_usd(
    *,
    bom: Dict[str, Any],
    material_price_lookup,   # callable: (material_id, name, unit, region) -> (price_per_unit_usd, source)
    region: str,
    qty_units: int
) -> Tuple[Decimal, List[Dict[str, Any]]]:
    """
    Returns total materials cost for the order and a breakdown list.
    qty_units: number of final goods in the order.
    """
    breakdown = []
    total = Decimal("0")
    for m in bom.get("materials", []):
        mat_id = m.get("material_id") or m.get("name")
        unit = m.get("unit", "kg")
        per_unit_qty = Decimal(str(m.get("qty", 0)))
        waste = Decimal(str(m.get("waste_factor", 0.05)))
        needed = per_unit_qty * Decimal(qty_units) * (Decimal("1") + waste)

        price_usd, source = material_price_lookup(mat_id, m.get("name"), unit, region)
        line_cost = (Decimal(str(price_usd)) * needed).quantize(Decimal("0.0001"))
        total += line_cost
        breakdown.append({
            "material_id": mat_id,
            "name": m.get("name"),
            "unit": unit,
            "qty_total": float(needed),
            "unit_price_usd": float(price_usd),
            "line_cost_usd": float(line_cost),
            "source": source
        })
    return total, breakdown

def compute_labor_cost_usd(
    *,
    labor_std_hours_per_unit: float,
    labor_rate_usd_per_hour: float,
    qty_units: int
):
    from decimal import Decimal
    hours = Decimal(str(labor_std_hours_per_unit)) * Decimal(qty_units)
    return (hours * Decimal(str(labor_rate_usd_per_hour))).quantize(Decimal("0.0001"))

def compute_overheads_usd(
    *,
    overhead_pct_of_direct: float,
    direct_cost_usd: float
):
    from decimal import Decimal
    return (Decimal(str(direct_cost_usd)) * Decimal(str(overhead_pct_of_direct))).quantize(Decimal("0.0001"))

def compute_tooling_setup_amortized_usd(
    *,
    setup_cost_usd: float,
    amortize_units: int
):
    from decimal import Decimal
    if amortize_units <= 0: return Decimal("0")
    per_unit = Decimal(str(setup_cost_usd)) / Decimal(amortize_units)
    return per_unit.quantize(Decimal("0.0001"))

def compute_packaging_qc_inland_usd(
    *,
    packaging_cost_per_unit_usd: float,
    qc_cost_per_unit_usd: float,
    inland_freight_per_unit_usd: float,
    qty_units: int
):
    from decimal import Decimal
    total = (Decimal(str(packaging_cost_per_unit_usd)) +
             Decimal(str(qc_cost_per_unit_usd)) +
             Decimal(str(inland_freight_per_unit_usd))) * Decimal(qty_units)
    return total.quantize(Decimal("0.0001"))

def aggregate_costs(
    *,
    materials_total_usd,
    labor_total_usd,
    overhead_usd,
    setup_amortized_total_usd,
    other_total_usd
):
    from decimal import Decimal
    parts = [materials_total_usd, labor_total_usd, overhead_usd, setup_amortized_total_usd, other_total_usd]
    return sum([Decimal(p) for p in parts], Decimal("0")).quantize(Decimal("0.0001"))

def compute_cost_baseline_usd(
    *,
    sku_spec: Dict[str, Any],
    qty_units: int,
    region: str,
    bom: Dict[str, Any],
    material_price_lookup,
    labor_rate_usd_per_hour: float,
    overhead_pct_of_direct: float,
    setup_cost_usd: float,
    amortize_units: int,
    packaging_cost_per_unit_usd: float,
    qc_cost_per_unit_usd: float,
    inland_freight_per_unit_usd: float,
    duty_pct: float,
    logistics_cost_usd: float,
    fob_override_usd: float | None = None
) -> Dict[str, Any]:
    """
    Returns a detailed cost object with per-unit and total costs.
    """
    from decimal import Decimal

    # 1) Materials
    materials_total_usd, materials_breakdown = compute_material_cost_usd(
        bom=bom, material_price_lookup=material_price_lookup, region=region, qty_units=qty_units
    )

    # 2) Labor
    labor_total_usd = compute_labor_cost_usd(
        labor_std_hours_per_unit=bom.get("labor_std_hours", 0.0),
        labor_rate_usd_per_hour=labor_rate_usd_per_hour,
        qty_units=qty_units
    )

    direct_cost_usd = (materials_total_usd + labor_total_usd)

    # 3) Overheads
    overhead_usd = compute_overheads_usd(
        overhead_pct_of_direct=overhead_pct_of_direct,
        direct_cost_usd=float(direct_cost_usd)
    )

    # 4) Setup/Tooling amortization (spread across amortize_units, then scaled to qty)
    per_unit_setup = compute_tooling_setup_amortized_usd(setup_cost_usd=setup_cost_usd, amortize_units=amortize_units)
    setup_amortized_total_usd = (per_unit_setup * Decimal(qty_units)).quantize(Decimal("0.0001"))

    # 5) Packaging + QC + Inland Freight
    other_total_usd = compute_packaging_qc_inland_usd(
        packaging_cost_per_unit_usd=packaging_cost_per_unit_usd,
        qc_cost_per_unit_usd=qc_cost_per_unit_usd,
        inland_freight_per_unit_usd=inland_freight_per_unit_usd,
        qty_units=qty_units
    )

    # 6) Subtotal (Ex-Factory)
    ex_factory_total_usd = aggregate_costs(
        materials_total_usd=materials_total_usd,
        labor_total_usd=labor_total_usd,
        overhead_usd=overhead_usd,
        setup_amortized_total_usd=setup_amortized_total_usd,
        other_total_usd=other_total_usd
    )

    # 7) FOB: if supplier quote exists, you may compare; else use ex-factory as basis
    fob_usd = Decimal(str(fob_override_usd)) if fob_override_usd is not None else ex_factory_total_usd

    # 8) Duty & Logistics
    duty_usd = (Decimal(str(duty_pct)) * fob_usd).quantize(Decimal("0.0001"))
    logistics_usd = Decimal(str(logistics_cost_usd))

    landed_total_usd = (fob_usd + duty_usd + logistics_usd).quantize(Decimal("0.0001"))
    per_unit_landed_usd = (landed_total_usd / Decimal(qty_units)).quantize(Decimal("0.0001"))

    return {
        "qty_units": qty_units,
        "materials": materials_breakdown,
        "materials_total_usd": float(materials_total_usd),
        "labor_total_usd": float(labor_total_usd),
        "overhead_usd": float(overhead_usd),
        "setup_amortized_total_usd": float(setup_amortized_total_usd),
        "other_total_usd": float(other_total_usd),
        "ex_factory_total_usd": float(ex_factory_total_usd),
        "fob_basis_usd": float(fob_usd),
        "duty_usd": float(duty_usd),
        "logistics_usd": float(logistics_usd),
        "landed_total_usd": float(landed_total_usd),
        "per_unit_landed_usd": float(per_unit_landed_usd),
    }
