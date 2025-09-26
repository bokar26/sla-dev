from fastapi.testclient import TestClient
from sla_ai_components.nlp.parse_spec import parse_query_to_spec
from sla_ai_components.nlp.crosscheck import enrich_spec_with_data

def test_parse_query_to_spec():
    """Test natural language query parsing"""
    
    # Test basic category extraction
    spec = parse_query_to_spec("400gsm cotton hoodies from IN to US, 1500 units")
    assert spec["category"] == "hoodie"
    assert spec["gsm"] == 400
    assert spec["origin_hint"] == "IN"
    assert spec["dest_hint"] == "US"
    assert spec["query_text"] == "400gsm cotton hoodies from IN to US, 1500 units"
    
    # Test blend extraction
    spec = parse_query_to_spec("80/20 cotton polyester t-shirt")
    assert spec["category"] == "t-shirt"
    assert spec["blend"] == [80, 20, "cotton"]
    
    # Test fabric detection
    spec = parse_query_to_spec("fleece hoodie with loop knit")
    assert spec["category"] == "hoodie"
    assert spec["fabric"] == "loop-knit"
    
    # Test quantity extraction
    spec = parse_query_to_spec("5000 pieces of denim jeans")
    assert spec["category"] == "denim"
    # Note: qty is not in the spec output, it's handled separately in the API
    
    # Test generic fallback
    spec = parse_query_to_spec("some random product")
    assert spec["category"] == "generic"

def test_enrich_spec_with_data():
    """Test spec enrichment with database data"""
    
    # Test with basic spec
    spec = {"category": "hoodie", "query_text": "test query"}
    enriched = enrich_spec_with_data(spec)
    
    # Should add candidate counts
    assert "candidate_counts" in enriched
    assert "factories" in enriched["candidate_counts"]
    assert "lanes" in enriched["candidate_counts"]
    
    # Should preserve original spec
    assert enriched["category"] == "hoodie"
    assert enriched["query_text"] == "test query"

def test_ai_search_basic():
    """Test the AI search endpoint with a basic query"""
    # Note: This test would require the full FastAPI app to be imported
    # For now, we'll test the individual components
    
    # Test the parsing and enrichment pipeline
    query = "400gsm cotton hoodies from IN to US, 1500 units"
    spec = parse_query_to_spec(query)
    enriched = enrich_spec_with_data(spec)
    
    # Verify the pipeline works
    assert spec["category"] == "hoodie"
    assert spec["gsm"] == 400
    assert spec["origin_hint"] == "IN"
    assert spec["dest_hint"] == "US"
    assert "candidate_counts" in enriched

def test_parse_edge_cases():
    """Test parsing with edge cases and variations"""
    
    # Test different country formats
    spec = parse_query_to_spec("hoodies from india to united states")
    assert spec["origin_hint"] == "IN"  # Should normalize
    assert spec["dest_hint"] == "US"    # Should normalize
    
    # Test different quantity formats
    spec = parse_query_to_spec("1000 pcs of t-shirts")
    # qty extraction works but isn't included in spec output
    
    # Test multiple categories (should pick first)
    spec = parse_query_to_spec("hoodie and t-shirt products")
    assert spec["category"] == "hoodie"  # First match
    
    # Test case insensitive
    spec = parse_query_to_spec("HOODIE PRODUCTS")
    assert spec["category"] == "hoodie"

def test_crosscheck_with_missing_data():
    """Test crosscheck behavior when database is empty or missing"""
    
    # Test with minimal spec
    spec = {"category": "test", "query_text": "test"}
    enriched = enrich_spec_with_data(spec)
    
    # Should still work and add candidate counts (even if 0)
    assert "candidate_counts" in enriched
    assert isinstance(enriched["candidate_counts"]["factories"], int)
    assert isinstance(enriched["candidate_counts"]["lanes"], int)
