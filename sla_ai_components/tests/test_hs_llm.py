from sla_ai_components.logistics.hs_llm import infer_hs_code

def test_infer_hs_code_mock():
    hs = infer_hs_code({"category":"hoodie","fabric":"cotton"})
    assert "primary_hs" in hs and isinstance(hs["alternates"], list)
