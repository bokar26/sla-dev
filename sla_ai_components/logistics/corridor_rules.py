from __future__ import annotations
from typing import Dict, Any
from .duties import CORRIDOR_CONFIG

def choose_rules(
    *,
    origin_country: str,
    dest_country: str,
    hs_code: str,
    regs: Dict[str, Any] | None
) -> Dict[str, Any]:
    """
    Merge precedence:
    1) Regulations (LLM/DB) if confidence >= 0.5 (tunable)
    2) Corridor defaults from CORRIDOR_CONFIG
    3) Safe fallbacks (FOB, 0% rates)
    """
    # Base defaults
    rules = {"basis":"FOB", "duty_rate_pct": 0.0, "import_tax_rate_pct": 0.0}

    # Corridor defaults
    corr = CORRIDOR_CONFIG.get((origin_country, dest_country))
    if corr:
        rules.update(corr)

    # Regulations override if decent confidence
    if regs and float(regs.get("confidence", 0.0)) >= 0.5:
        if "basis" in regs: rules["basis"] = regs["basis"]
        if "duty_rate_pct" in regs: rules["duty_rate_pct"] = regs["duty_rate_pct"]
        if "import_tax_rate_pct" in regs: rules["import_tax_rate_pct"] = regs["import_tax_rate_pct"]

    return rules
