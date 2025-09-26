from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_logistics_estimate_includes_regs():
    payload = {
        "sku_spec": {"category":"hoodie","customs_basis_fob_usd":12000.0},
        "qty_units": 400,
        "origin_country":"IN",
        "dest_country":"US",
        "transport_mode":"ocean",
        "freight_usd": 900.0,
        "insurance_usd": 50.0
    }
    r = client.post("/api/logistics/estimate", json=payload)
    assert r.status_code == 200
    data = r.json()
    assert "regulations" in data and "rules_used" in data and "duties" in data
