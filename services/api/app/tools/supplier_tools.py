from typing import Dict, Any

SUPPLIER_SEARCH_TOOL: Dict[str, Any] = {
    "type": "function",
    "name": "search_suppliers",
    "description": "Search external marketplace by keywords, materials, moq, certs, country",
    "parameters": {
        "type": "object",
        "properties": {
            "q": {"type":"string"},
            "materials": {"type":"array","items":{"type":"string"}},
            "country": {"type":"string"},
            "moq_max": {"type":"integer"},
            "certs": {"type":"array","items":{"type":"string"}}
        },
        "required": ["q"]
    }
}

def resolve_search_suppliers(args: Dict[str, Any]) -> Dict[str, Any]:
    # TODO: call your proxy/API and normalize results
    # Return shape: {"items":[{...}]}
    return {"items": []}
