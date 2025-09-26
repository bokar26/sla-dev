from sla_ai_components.costing.cost_models import compute_cost_baseline_usd

def _dummy_lookup(material_id, name, unit, region):
    if unit.lower() == "kg": return 2.5, "dummy_index"
    if unit.lower() in ("pcs","set"): return 0.1, "dummy_index"
    return 1.0, "dummy_index"

def test_cost_baseline_multimaterial():
    bom = {
        "materials": [
            {"material_id":"m1","name":"Primary","qty":1.0,"unit":"kg","waste_factor":0.05},
            {"material_id":"pkg","name":"Packaging","qty":1.0,"unit":"set","waste_factor":0.02}
        ],
        "labor_std_hours": 0.2
    }
    res = compute_cost_baseline_usd(
        sku_spec={"category":"generic"},
        qty_units=1000,
        region="X",
        bom=bom,
        material_price_lookup=_dummy_lookup,
        labor_rate_usd_per_hour=4.0,
        overhead_pct_of_direct=0.2,
        setup_cost_usd=200.0,
        amortize_units=10000,
        packaging_cost_per_unit_usd=0.08,
        qc_cost_per_unit_usd=0.05,
        inland_freight_per_unit_usd=0.03,
        duty_pct=0.1,
        logistics_cost_usd=500.0,
        fob_override_usd=None
    )
    assert res["landed_total_usd"] > 0
    assert res["per_unit_landed_usd"] > 0
