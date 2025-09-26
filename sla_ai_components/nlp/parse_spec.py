from __future__ import annotations
from typing import Dict, Any
import re, json

# TODO: replace with real LLM call; keep deterministic for now
def parse_query_to_spec(q: str) -> Dict[str, Any]:
    """
    Heuristic parser that extracts basic spec signals and turns them into sku_spec.
    Upgrade later with an LLM tool.
    """
    ql = q.lower()

    category = None
    for key in ["hoodie","t-shirt","tshirt","sweatshirt","denim","shoe","bottle","widget"]:
        if key in ql: category = key.replace("tshirt","t-shirt"); break

    gsm = None
    m = re.search(r"(\d{3,4})\s*gsm", ql)
    if m: gsm = int(m.group(1))

    blend = None
    m = re.search(r"(\d{2})\s*\/\s*(\d{2})\s*(cotton|poly|polyester|wool|nylon)", ql)
    if m:
        a,b,mat = int(m.group(1)), int(m.group(2)), m.group(3)
        blend = [a,b,mat]

    # origin/destination hints
    origin = None
    # Check for country codes first
    for c in ["IN","CN","VN","BD","TH","TR","MX","US","IT"]:
        if f" from {c.lower()}" in ql or f" origin {c.lower()}" in ql: origin = c
    
    # Check for country names
    country_mapping = {
        "india": "IN", "china": "CN", "vietnam": "VN", "bangladesh": "BD",
        "thailand": "TH", "turkey": "TR", "mexico": "MX", "united states": "US",
        "usa": "US", "italy": "IT", "united kingdom": "UK", "canada": "CA",
        "australia": "AU", "europe": "EU"
    }
    
    if not origin:
        for country_name, code in country_mapping.items():
            if f" from {country_name}" in ql or f" origin {country_name}" in ql:
                origin = code
                break
    
    dest = None
    # Check for destination country codes
    for c in ["US","EU","UK","CA","AU"]:
        if f" to {c.lower()}" in ql or f" deliver {c.lower()}" in ql: dest = c
    
    # Check for destination country names
    if not dest:
        for country_name, code in country_mapping.items():
            if f" to {country_name}" in ql or f" deliver {country_name}" in ql:
                dest = code
                break

    qty = None
    m = re.search(r"\b(\d{2,6})\s*(units|pcs|pieces)\b", ql)
    if m: qty = int(m.group(1))

    spec = {
        "category": category or "generic",
        "fabric": "loop-knit" if "loop" in ql or "fleece" in ql else None,
        "gsm": gsm,
        "blend": blend,               # e.g., [80,20,"cotton"]
        "origin_hint": origin,
        "dest_hint": dest,
        "query_text": q,
    }
    # prune None values
    return {k:v for k,v in spec.items() if v is not None}
