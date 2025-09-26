from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_logistics_estimate_endpoint():
    payload = {
        "sku_spec": {"category":"hoodie","dimensions":{"x":30,"y":25,"z":8},"customs_basis_fob_usd":15000.0},
        "qty_units": 500,
        "origin_country":"IN",
        "dest_country":"US",
        "transport_mode":"air",
        "freight_usd": 1200.0,
        "insurance_usd": 60.0
    }
    resp = client.post("/api/logistics/estimate", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "hs" in data and "weights" in data and "duties" in data
