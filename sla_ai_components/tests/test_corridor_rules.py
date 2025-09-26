from sla_ai_components.logistics.corridor_rules import choose_rules

def test_choose_rules_prefers_regs_when_confident():
    regs = {"basis":"CIF","duty_rate_pct":0.12,"import_tax_rate_pct":0.19,"confidence":0.9}
    rules = choose_rules(origin_country="IN", dest_country="EU", hs_code="6110.20", regs=regs)
    assert rules["basis"] == "CIF"
    assert rules["duty_rate_pct"] == 0.12
