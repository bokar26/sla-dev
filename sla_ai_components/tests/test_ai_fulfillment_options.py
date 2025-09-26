from fastapi.testclient import TestClient
from sla_ai_components.ai_ops.freight_calc import cbm_per_unit, ocean_freight_usd, air_chargeable_weight_kg, air_freight_usd
from sla_ai_components.ai_ops.route_scorer import score_routes, PROFILES

def test_cbm_per_unit():
    """Test CBM calculation per unit"""
    # Test with valid dimensions
    dims = {"x": 30, "y": 25, "z": 8}  # 30cm x 25cm x 8cm
    cbm = cbm_per_unit(dims)
    expected = (30/100.0) * (25/100.0) * (8/100.0)  # 0.006 CBM
    assert abs(cbm - expected) < 0.0001
    
    # Test with empty dimensions
    assert cbm_per_unit({}) == 0.0
    
    # Test with zero dimensions
    assert cbm_per_unit({"x": 0, "y": 25, "z": 8}) == 0.0

def test_ocean_freight_usd():
    """Test ocean freight calculation"""
    rate_per_cbm = 150.0
    qty_units = 1000
    unit_cbm = 0.006
    
    freight = ocean_freight_usd(rate_per_cbm, qty_units, unit_cbm)
    expected = 150.0 * 0.006 * 1000  # 900.0
    assert freight == expected

def test_air_chargeable_weight_kg():
    """Test air chargeable weight calculation"""
    dims = {"x": 30, "y": 25, "z": 8}  # 30cm x 25cm x 8cm
    qty_units = 1000
    gross_kg = 500.0
    
    # Volumetric weight = (30*25*8)/6000 * 1000 = 1000 kg
    # Chargeable weight = max(500, 1000) = 1000 kg
    chargeable = air_chargeable_weight_kg(dims, qty_units, gross_kg)
    expected = 1000.0
    assert chargeable == expected
    
    # Test when gross weight is higher
    gross_kg_heavy = 1500.0
    chargeable_heavy = air_chargeable_weight_kg(dims, qty_units, gross_kg_heavy)
    assert chargeable_heavy == 1500.0  # Gross weight wins

def test_air_freight_usd():
    """Test air freight calculation"""
    rate_per_kg = 5.0
    chargeable_kg = 1000.0
    
    freight = air_freight_usd(rate_per_kg, chargeable_kg)
    expected = 5.0 * 1000.0  # 5000.0
    assert freight == expected

def test_route_scorer_profiles():
    """Test route scoring profiles"""
    assert "balanced" in PROFILES
    assert "cost" in PROFILES
    assert "speed" in PROFILES
    
    # Test profile weights sum to reasonable values
    for profile_name, weights in PROFILES.items():
        total_weight = sum(weights.values())
        assert 0.9 <= total_weight <= 1.1  # Should be close to 1.0

def test_score_routes():
    """Test route scoring and sorting"""
    routes = [
        {
            "lane_id": "route1",
            "landed_total_usd": 1000.0,
            "eta_days": 10.0,
            "on_time_rate": 0.95,
            "risk": 0.1
        },
        {
            "lane_id": "route2", 
            "landed_total_usd": 1200.0,
            "eta_days": 8.0,
            "on_time_rate": 0.90,
            "risk": 0.2
        },
        {
            "lane_id": "route3",
            "landed_total_usd": 800.0,
            "eta_days": 15.0,
            "on_time_rate": 0.85,
            "risk": 0.05
        }
    ]
    
    # Test balanced profile
    scored = score_routes(routes, "balanced")
    assert len(scored) == 3
    assert all("score" in route for route in scored)
    assert all("cost_norm" in route for route in scored)
    assert all("eta_norm" in route for route in scored)
    
    # Should be sorted by score (highest first)
    scores = [route["score"] for route in scored]
    assert scores == sorted(scores, reverse=True)
    
    # Test cost profile (should favor cheaper routes)
    cost_scored = score_routes(routes, "cost")
    cost_scores = [route["score"] for route in cost_scored]
    assert cost_scores == sorted(cost_scores, reverse=True)
    
    # Test speed profile (should favor faster routes)
    speed_scored = score_routes(routes, "speed")
    speed_scores = [route["score"] for route in speed_scored]
    assert speed_scores == sorted(speed_scores, reverse=True)

def test_score_routes_empty():
    """Test route scoring with empty input"""
    assert score_routes([], "balanced") == []
    assert score_routes(None, "balanced") == []

def test_score_routes_invalid_profile():
    """Test route scoring with invalid profile falls back to balanced"""
    routes = [{
        "lane_id": "route1",
        "landed_total_usd": 1000.0,
        "eta_days": 10.0,
        "on_time_rate": 0.95,
        "risk": 0.1
    }]
    
    scored = score_routes(routes, "invalid_profile")
    assert len(scored) == 1
    assert "score" in scored[0]

def test_fulfillment_options_smoke():
    """Test the fulfillment options endpoint with mock data"""
    # This test would require the full FastAPI app to be imported
    # For now, we'll test the individual components
    
    # Test the freight calculation pipeline
    dims = {"x": 30, "y": 25, "z": 8}
    qty = 1000
    
    # Test ocean freight
    unit_cbm = cbm_per_unit(dims)
    ocean_freight = ocean_freight_usd(150.0, qty, unit_cbm)
    assert ocean_freight > 0
    
    # Test air freight
    gross_kg = 500.0
    chargeable_kg = air_chargeable_weight_kg(dims, qty, gross_kg)
    air_freight = air_freight_usd(5.0, chargeable_kg)
    assert air_freight > 0
    
    # Test route scoring
    mock_routes = [
        {
            "lane_id": "ocean1",
            "landed_total_usd": ocean_freight + 1000.0,  # Add duties
            "eta_days": 20.0,
            "on_time_rate": 0.95,
            "risk": 0.1
        },
        {
            "lane_id": "air1", 
            "landed_total_usd": air_freight + 1000.0,  # Add duties
            "eta_days": 5.0,
            "on_time_rate": 0.90,
            "risk": 0.2
        }
    ]
    
    scored = score_routes(mock_routes, "balanced")
    assert len(scored) == 2
    assert scored[0]["score"] >= scored[1]["score"]  # Should be sorted
