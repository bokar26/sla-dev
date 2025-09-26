from fastapi.testclient import TestClient
from api_server import app

client = TestClient(app)

def test_rank_endpoint_basic():
    payload = {
        "sku_spec": {"fabric": "loop-knit", "gsm": 400, "blend": [80,20], "category": "hoodie"},
        "qty": 1500,
        "hs_code": "6110.20",
        "duty_pct": 0.165,
        "usage_per_unit": 0.42,
        "unit_volume_or_weight": 0.014,
        "seasonal_penalty": 0.03
    }
    resp = client.post("/rank", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) > 0
    for c in data:
        assert "factory_id" in c and "lane_id" in c and "total" in c
