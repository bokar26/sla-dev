from __future__ import annotations
from typing import Any, Dict, List, Optional, Tuple

# TODO: replace with your real LLM client/tool
def _mock_llm_completion(prompt: str) -> Dict[str, Any]:
    # Deterministic placeholder response for testing
    # Returns a generic BOM with dummy numbers and confidence.
    return {
        "materials": [
            {"material_id": "generic_primary", "name": "Primary Material", "qty": 1.0, "unit": "kg", "waste_factor": 0.05},
            {"material_id": "generic_secondary", "name": "Secondary Material", "qty": 0.2, "unit": "kg", "waste_factor": 0.08},
            {"material_id": "packaging", "name": "Packaging", "qty": 1.0, "unit": "set", "waste_factor": 0.02},
        ],
        "labor_std_hours": 0.25,
        "notes": "Mock BOM; replace with real LLM",
        "confidence": 0.65
    }

SYSTEM_PROMPT = """You are a manufacturing cost engineer. Given a product specification,
derive a minimal Bill of Materials (BOM) that lists each material with:
- name, material_id (generic if unknown), quantity per unit, unit (kg, m, pcs, set),
- waste_factor (0..0.2 default if not stated),
- and standardized labor hours for assembly/processing if relevant.
Return JSON: {materials: [{material_id,name,qty,unit,waste_factor}], labor_std_hours, notes, confidence (0..1)}.
If spec lacks details, infer reasonable defaults and lower confidence accordingly.
"""

def build_bom_prompt(sku_spec: Dict[str, Any]) -> str:
    return f"{SYSTEM_PROMPT}\nSPEC JSON:\n{sku_spec}"

def get_bom_from_llm(sku_spec: Dict[str, Any]) -> Dict[str, Any]:
    prompt = build_bom_prompt(sku_spec)
    # TODO: wire to real LLM; deterministic mock for now
    return _mock_llm_completion(prompt)
