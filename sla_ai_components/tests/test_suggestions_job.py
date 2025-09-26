from sla_ai_components.suggestions.scheduler import run_once_for_tenant, get_suggestions, update_suggestion_status
from sla_ai_components.suggestions.features import build_trend_features
from sla_ai_components.suggestions.generator import build_candidates_from_trends
from sla_ai_components.suggestions.evaluator import evaluate_route_suggestions, evaluate_supplier_suggestions
from sla_ai_components.suggestions.explainer import explain

def test_build_trend_features():
    """Test feature extraction from mock orders"""
    features = build_trend_features("tenant_demo")
    
    assert "orders" in features
    assert "corridors" in features
    assert "categories" in features
    
    # Should have some mock data
    assert len(features["orders"]) > 0
    assert len(features["corridors"]) > 0
    assert len(features["categories"]) > 0

def test_build_candidates_from_trends():
    """Test candidate generation from trends"""
    features = build_trend_features("tenant_demo")
    candidates = build_candidates_from_trends(features)
    
    assert len(candidates) > 0
    for candidate in candidates:
        assert "type" in candidate
        assert "spec" in candidate
        assert candidate["type"] in ["route", "supplier"]

def test_evaluate_route_suggestions():
    """Test route suggestion evaluation"""
    spec = {"category": "hoodie"}
    suggestions = evaluate_route_suggestions("tenant_demo", spec, "IN", "US")
    
    assert len(suggestions) > 0
    for suggestion in suggestions:
        assert suggestion["kind"] == "route"
        assert "title" in suggestion
        assert "impact_score" in suggestion
        assert "expected_savings_usd" in suggestion
        assert "confidence" in suggestion

def test_evaluate_supplier_suggestions():
    """Test supplier suggestion evaluation"""
    spec = {"category": "hoodie"}
    suggestions = evaluate_supplier_suggestions("tenant_demo", spec, "IN", "US")
    
    assert len(suggestions) > 0
    for suggestion in suggestions:
        assert suggestion["kind"] == "supplier"
        assert "title" in suggestion
        assert "impact_score" in suggestion
        assert "expected_savings_usd" in suggestion
        assert "confidence" in suggestion

def test_explain_suggestions():
    """Test suggestion explanation generation"""
    route_suggestion = {
        "kind": "route",
        "data_json": {
            "route": {
                "eta_days": 15.0,
                "on_time_rate": 0.95,
                "duties_taxes_usd": 150.0
            }
        }
    }
    
    supplier_suggestion = {
        "kind": "supplier",
        "data_json": {
            "supplier": {
                "factory_id": "F001",
                "country_iso2": "IN"
            }
        }
    }
    
    route_explanation = explain(route_suggestion)
    supplier_explanation = explain(supplier_suggestion)
    
    assert "ETA" in route_explanation
    assert "on-time" in route_explanation
    assert "duties" in route_explanation
    
    assert "Factory" in supplier_explanation
    assert "F001" in supplier_explanation

def test_run_once_for_tenant():
    """Test complete suggestion generation for a tenant"""
    # Clear any existing suggestions
    from sla_ai_components.suggestions.scheduler import _SUGGESTIONS
    _SUGGESTIONS.clear()
    
    run_once_for_tenant("tenant_demo")
    
    # Should have generated some suggestions
    suggestions = get_suggestions("tenant_demo")
    assert len(suggestions) > 0
    
    # Check suggestion structure
    for suggestion in suggestions:
        assert "id" in suggestion
        assert "tenant_id" in suggestion
        assert "kind" in suggestion
        assert "title" in suggestion
        assert "impact_score" in suggestion
        assert "status" in suggestion

def test_suggestion_status_updates():
    """Test suggestion status management"""
    # Clear any existing suggestions
    from sla_ai_components.suggestions.scheduler import _SUGGESTIONS
    _SUGGESTIONS.clear()
    
    # Generate suggestions
    run_once_for_tenant("tenant_demo")
    suggestions = get_suggestions("tenant_demo")
    
    if suggestions:
        suggestion_id = suggestions[0]["id"]
        
        # Test status updates
        assert update_suggestion_status("tenant_demo", suggestion_id, "accepted")
        assert update_suggestion_status("tenant_demo", suggestion_id, "dismissed")
        assert update_suggestion_status("tenant_demo", suggestion_id, "snoozed")
        
        # Test invalid suggestion ID
        assert not update_suggestion_status("tenant_demo", 99999, "accepted")

def test_suggestion_filtering():
    """Test suggestion filtering by status"""
    # Clear any existing suggestions
    from sla_ai_components.suggestions.scheduler import _SUGGESTIONS
    _SUGGESTIONS.clear()
    
    # Generate suggestions
    run_once_for_tenant("tenant_demo")
    
    # Test filtering
    all_suggestions = get_suggestions("tenant_demo")
    new_suggestions = get_suggestions("tenant_demo", status="new")
    
    assert len(all_suggestions) >= len(new_suggestions)
    
    # All new suggestions should have status "new"
    for suggestion in new_suggestions:
        assert suggestion["status"] == "new"
