from sla_ai_components.logistics.regulations_llm import get_regulations

def test_regs_cache_and_shape():
    data = get_regulations(origin_country="IN", dest_country="US", hs_code="6110.20")
    assert "basis" in data and "duty_rate_pct" in data and "documents" in data
    again = get_regulations(origin_country="IN", dest_country="US", hs_code="6110.20")
    assert again  # cache hit acceptable
