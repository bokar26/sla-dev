from __future__ import annotations
from typing import Any, Dict, List

# TODO: replace with your real LLM client
def _mock_llm(prompt: str) -> Dict[str, Any]:
    # Deterministic placeholder: produce a likely HS and two alternates
    return {
        "primary_hs": "6110.20",  # example (knit cotton sweaters/hoodies)
        "alternates": ["6109.10", "6110.30"],
        "confidence": 0.62,
        "notes": "Mock HS; replace with real LLM + rules."
    }

SYSTEM_HS_PROMPT = """You are a customs classification specialist.
Given a product spec, propose the most likely HS code (6-digit) plus two reasonable alternates.
Explain briefly any decisive attributes (material, construction, function).
Return JSON: {primary_hs, alternates, confidence (0..1), notes}."""

def build_hs_prompt(sku_spec: Dict[str, Any]) -> str:
    return f"{SYSTEM_HS_PROMPT}\nSPEC JSON:\n{sku_spec}"

def infer_hs_code(sku_spec: Dict[str, Any]) -> Dict[str, Any]:
    return _mock_llm(build_hs_prompt(sku_spec))
