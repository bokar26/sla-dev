from typing import Dict, List, Set
import re

DENIM_SYNS = {"denim", "jeans", "jean", "jeanwear", "5-pocket", "selvedge"}
APPAREL_SYNS = {
    "t shirt": {"t-shirt","tee","tees","shirt","crewneck"},
    "sweater": {"sweater","knit","pullover","jumper"},
    "hoodie": {"hoodie","hooded","fleece"},
    "activewear": {"activewear","sportswear","athleisure"},
    "outerwear": {"outerwear","jacket","coat","parka","shell"},
}
CATEGORY_SYNS = {"denim": DENIM_SYNS, **APPAREL_SYNS}

def slug(s: str) -> str:
    return re.sub(r"[^a-z0-9]+"," ", (s or "").lower()).strip()

def tokens(s: str) -> Set[str]:
    return set(slug(s).split())

def expand_product_terms(q: str, product_type: str|None) -> Set[str]:
    t = tokens(q)
    if product_type:
        t |= tokens(product_type)
    # expand synonyms
    for k, syns in CATEGORY_SYNS.items():
        if k in t or (t & syns):
            t |= {k} | set(syns)
    return t
