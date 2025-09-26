from sla_ai_components.logistics.weight import estimate_unit_net_weight_kg, compute_weights, chargeable_air_weight_kg

def test_weight_basic():
    unit = estimate_unit_net_weight_kg({"category":"apparel"}, bom=None)
    w = compute_weights(qty_units=100, unit_net_kg=unit, packaging_kg_per_unit=0.05)
    assert w["gross_kg"] > 0

def test_volumetric_air():
    dims = {"x":40,"y":30,"z":10}
    cw = chargeable_air_weight_kg(dims, qty_units=50, gross_kg=80)
    assert cw >= 80
