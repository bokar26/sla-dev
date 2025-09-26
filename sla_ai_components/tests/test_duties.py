from sla_ai_components.logistics.duties import estimate_duties_and_taxes

def test_duties_generic():
    res = estimate_duties_and_taxes(
        origin_country="IN", dest_country="US", hs_code="6110.20",
        customs_basis_fob_usd=10000.0, insurance_usd=0.0, freight_usd=0.0
    )
    assert res["total_border_charges_usd"] >= 0
