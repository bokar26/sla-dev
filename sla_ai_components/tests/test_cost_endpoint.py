from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_cost_estimate_endpoint():
    payload = {"sku_spec":{"category":"widget","dimensions":{"x":10,"y":5,"z":3}},
               "qty_units":500, "region":"X", "use_llm_bom": True}
    resp = client.post("/api/cost/estimate", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "bom" in data and "cost" in data
    assert data["cost"]["landed_total_usd"] > 0
