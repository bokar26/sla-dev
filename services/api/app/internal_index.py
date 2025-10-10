from __future__ import annotations
import os, json, glob, time
import pandas as pd
from rapidfuzz import fuzz, process
from typing import List, Dict, Any, Tuple, Iterable
import numpy as np
from functools import lru_cache
from .utils.url_utils import prefer_url
from .search.normalize import slug, tokens, expand_product_terms

_DATAF = None
_INDEX_READY = False
_CACHE_PATH = os.getenv("INDEX_CACHE_PATH", ".cache/internal_index.parquet")

# Category normalization mapping
CATEGORY_MAP = {
    # Apparel
    "t shirt": "apparel:t-shirt", "tee": "apparel:t-shirt", "tshirt": "apparel:t-shirt",
    "jeans": "apparel:jeans", "denim": "apparel:jeans",
    "sweater": "apparel:sweater", "knitwear": "apparel:sweater", "pullover": "apparel:sweater",
    "jacket": "apparel:jacket", "outerwear": "apparel:jacket", "coat": "apparel:jacket",
    "dress": "apparel:dress", "gown": "apparel:dress",
    "shirt": "apparel:shirt", "blouse": "apparel:shirt",
    "pants": "apparel:pants", "trousers": "apparel:pants",
    "shoes": "apparel:shoes", "footwear": "apparel:shoes", "sneakers": "apparel:shoes",
    "bag": "apparel:bag", "handbag": "apparel:bag", "backpack": "apparel:bag",
    
    # Electronics
    "led": "electronics:led", "lighting": "electronics:led", "bulb": "electronics:led",
    "cable": "electronics:cable", "wire": "electronics:cable", "charger": "electronics:cable",
    "phone": "electronics:phone", "smartphone": "electronics:phone",
    "headphones": "electronics:audio", "earphones": "electronics:audio",
    
    # Machinery
    "valve": "machinery:valve", "pump": "machinery:pump", "motor": "machinery:motor",
    "bearing": "machinery:bearing", "gear": "machinery:gear",
    
    # General
    "packaging": "general:packaging", "box": "general:packaging", "container": "general:packaging",
    "furniture": "general:furniture", "chair": "general:furniture", "table": "general:furniture",
}

TEXT_FIELDS = ["name","product_types","materials","tags","description","capabilities"]
DEFAULT_WEIGHTS = {
    "country": 0.28,
    "product": 0.32,
    "text": 0.28,
    "quantity": 0.06,
    "custom": 0.06,
}

def normalize_category(cat: str) -> str:
    """Normalize category using mapping"""
    if not cat:
        return "general"
    cat_lower = cat.lower().strip()
    return CATEGORY_MAP.get(cat_lower, f"general:{cat_lower}")

def load_internal_data(data_path: str) -> pd.DataFrame:
    """Load supplier data from various file formats with caching support"""
    print(f"Loading supplier data from: {data_path}")
    
    # Try to load from cache first
    if os.path.exists(_CACHE_PATH):
        try:
            print(f"Loading from cache: {_CACHE_PATH}")
            df = pd.read_parquet(_CACHE_PATH)
            print(f"Loaded {len(df)} suppliers from cache")
            return df
        except Exception as e:
            print(f"Cache load failed: {e}, loading from source")
    
    # Load from source files
    paths = []
    if os.path.isdir(data_path):
        paths = glob.glob(os.path.join(data_path, "**/*.*"), recursive=True)
        print(f"Found {len(paths)} files in directory")
    elif os.path.isfile(data_path):
        paths = [data_path]
        print(f"Loading single file: {data_path}")
    
    rows = []
    for p in paths:
        ext = os.path.splitext(p)[1].lower()
        try:
            if ext in (".parquet", ".pq"):
                df = pd.read_parquet(p)
                rows.append(df)
                print(f"Loaded {len(df)} rows from {p}")
            elif ext == ".csv":
                df = pd.read_csv(p)
                rows.append(df)
                print(f"Loaded {len(df)} rows from {p}")
            elif ext in (".jsonl", ".ndjson"):
                df = pd.read_json(p, lines=True)
                rows.append(df)
                print(f"Loaded {len(df)} rows from {p}")
            elif ext == ".json":
                with open(p, "r", encoding="utf-8") as f:
                    data = json.load(f)
                df = pd.DataFrame(data if isinstance(data, list) else [data])
                rows.append(df)
                print(f"Loaded {len(df)} rows from {p}")
        except Exception as e:
            print(f"Failed to load {p}: {e}")
            continue
    
    if not rows:
        print("No data files found or loaded")
        return pd.DataFrame()
    
    df = pd.concat(rows, ignore_index=True)
    print(f"Combined {len(df)} total rows")
    
    # normalize expected columns
    for col in ["id","name","country","region","product_types","materials","capabilities","min_moq","lead_time_days","url","source","description","tags","certs","export_markets","membership"]:
        if col not in df.columns:
            df[col] = None
    
    # normalize lists to strings
    def norm_list(v):
        if isinstance(v, list): return ", ".join([str(x) for x in v])
        return v
    df["product_types"] = df["product_types"].apply(norm_list)
    df["tags"] = df["tags"].apply(norm_list)
    df["source"] = df["source"].fillna("internal")
    
    # Save to cache
    try:
        os.makedirs(os.path.dirname(_CACHE_PATH), exist_ok=True)
        df.to_parquet(_CACHE_PATH, index=False)
        print(f"Cached {len(df)} suppliers to {_CACHE_PATH}")
    except Exception as e:
        print(f"Failed to cache data: {e}")
    
    return df

def init_index(data_path: str):
    global _DATAF, _INDEX_READY
    _DATAF = load_internal_data(data_path)
    _INDEX_READY = not _DATAF.empty

def internal_count() -> int:
    return 0 if _DATAF is None else len(_DATAF)

def by_country() -> Dict[str,int]:
    if _DATAF is None or _DATAF.empty: return {}
    return _DATAF["country"].fillna("Unknown").value_counts().to_dict()

def internal_health() -> Dict[str, Any]:
    """Return health status of internal index"""
    if _DATAF is None or _DATAF.empty:
        return {"count": 0, "by_country": {}}
    countries = {}
    for _, row in _DATAF.iterrows():
        cc = (row.get("country") or "unknown").lower()
        countries[cc] = countries.get(cc, 0) + 1
    return {"count": len(_DATAF), "by_country": countries}

@lru_cache(maxsize=128)
def get_internal_corpus() -> List[Dict[str, Any]]:
    """Get the internal corpus as a list of dictionaries (cached)"""
    if _DATAF is None or _DATAF.empty:
        return []
    return _DATAF.to_dict('records')

def data_path_info() -> Dict[str, Any]:
    """Return information about the data path and files"""
    data_path = os.getenv("SUPPLIERS_DATA")
    if not data_path:
        return {"path": None, "exists": False, "files": []}
    
    if os.path.isfile(data_path):
        return {
            "path": data_path,
            "exists": True,
            "type": "file",
            "size": os.path.getsize(data_path),
            "modified": os.path.getmtime(data_path)
        }
    elif os.path.isdir(data_path):
        files = []
        for root, dirs, filenames in os.walk(data_path):
            for filename in filenames:
                filepath = os.path.join(root, filename)
                files.append({
                    "path": filepath,
                    "size": os.path.getsize(filepath),
                    "modified": os.path.getmtime(filepath)
                })
        return {
            "path": data_path,
            "exists": True,
            "type": "directory",
            "file_count": len(files),
            "files": files[:10]  # First 10 files for brevity
        }
    else:
        return {"path": data_path, "exists": False, "files": []}

def index_meta() -> Dict[str, Any]:
    """Return metadata about the index"""
    cache_exists = os.path.exists(_CACHE_PATH)
    cache_info = {}
    if cache_exists:
        try:
            cache_info = {
                "size": os.path.getsize(_CACHE_PATH),
                "modified": os.path.getmtime(_CACHE_PATH)
            }
        except Exception:
            pass
    
    return {
        "cache_path": _CACHE_PATH,
        "cache_exists": cache_exists,
        "cache_info": cache_info,
        "index_ready": _INDEX_READY,
        "data_shape": _DATAF.shape if _DATAF is not None else None
    }

def _field_text(row: Dict[str,Any]) -> str:
    parts = []
    for f in TEXT_FIELDS:
        v = row.get(f)
        if isinstance(v, list): parts.extend([str(x) for x in v])
        elif v: parts.append(str(v))
    return " ".join(parts)

def score_row(row: Dict[str,Any], q_terms: set[str], req) -> tuple[float, Dict[str,Any]]:
    # product/text similarity
    row_text = _field_text(row)
    sim = fuzz.token_set_ratio(" ".join(q_terms), row_text) / 100.0  # 0..1

    # product type hint
    pt_hit = 0.0
    if row.get("product_types"):
        row_pts = " ".join([str(x) for x in (row["product_types"] if isinstance(row["product_types"],list) else [row["product_types"]])])
        pt_hit = fuzz.token_set_ratio(" ".join(q_terms), row_pts) / 100.0

    # country weight
    ctry = (row.get("country") or "").lower()
    country_w = 1.0 if req.country and ctry == req.country.lower() else 0.5 if req.country else 0.8

    # quantity fit (soft)
    qfit = 1.0
    moq = row.get("moq") or row.get("MOQ") or row.get("min_order_qty")
    if req.quantity and isinstance(moq,(int,float)):
        qfit = 1.0 if req.quantity >= moq else max(0.3, req.quantity / max(1, moq))

    # customization
    cfit = 1.0
    if req.customization and req.customization != "any":
        supports_custom = bool(row.get("customization") or row.get("oem") or row.get("odm"))
        cfit = 1.0 if (req.customization=="yes" and supports_custom) or (req.customization=="no" and not supports_custom) else 0.5

    W = DEFAULT_WEIGHTS
    score01 = (
        W["country"]*country_w +
        W["product"]*pt_hit +
        W["text"]*sim +
        W["quantity"]*qfit +
        W["custom"]*cfit
    ) / sum(W.values())

    debug = {
        "country": country_w, "product": pt_hit, "text": sim,
        "quantity": qfit, "custom": cfit
    }
    return score01*100.0, debug

async def recall_internal(corpus: Iterable[Dict[str,Any]], req) -> list[Dict[str,Any]]:
    q_terms = expand_product_terms(req.q or "", req.product_type)
    out = []
    for row in corpus:  # full scan (fast enough with RF). If huge, shard or pre-index.
        s, dbg = score_row(row, q_terms, req)
        row_id = row.get("id") or row.get("_id") or row.get("supplier_id")
        url = row.get("url") or row.get("website") or row.get("alibaba_url") or None
        out.append({
            "id": f"int_{row_id}",
            "name": row.get("name") or "Unknown",
            "country": row.get("country"),
            "score": round(s,2),
            "materials": row.get("materials"),
            "moq": row.get("moq") or row.get("MOQ"),
            "lead_time": row.get("lead_time"),
            "source": {"type":"internal", "url": url},
            "reasoning": dbg,
            "raw": row
        })
    # sort by score desc
    out.sort(key=lambda x: x["score"], reverse=True)
    return out

# Legacy compatibility functions
def recall_internal_legacy(structured_query: Dict[str, Any], top_k: int = 200) -> List[Dict[str, Any]]:
    """Legacy function for backward compatibility - synchronous version"""
    if _DATAF is None or _DATAF.empty:
        return []
    
    # Extract query parameters
    q = structured_query.get("product_title", "") or structured_query.get("query_terms", [""])[0]
    country = structured_query.get("country")
    category = structured_query.get("category", "")
    materials = structured_query.get("materials", [])
    customization = structured_query.get("customization", "any")
    quantity = structured_query.get("quantity")
    
    # Filter by country if specified
    df = _DATAF
    if country and country.lower() != "any":
        df = df[df["country"].fillna("").str.lower().eq(country.lower())]
    
    # Score candidates using simple scoring
    def score_row(row):
        # Country score
        s_country = 100.0 if (country and str(row.get("country","")).lower()==country.lower()) else (50.0 if country else 70.0)
        
        # Product/category score
        product_types = str(row.get("product_types","")).lower()
        s_product = 0.0
        if category and category in product_types:
            s_product = 100.0
        elif q and q.lower() in product_types:
            s_product = 80.0
        else:
            s_product = 30.0
        
        # Text match score
        text_blob = " ".join([
            str(row.get("name","")), str(row.get("product_types","")), 
            str(row.get("description","")), str(row.get("tags",""))
        ])
        s_text = fuzz.token_set_ratio(q, text_blob) if q else 0.0
        
        # Materials score
        s_materials = 0.0
        if materials:
            row_materials = str(row.get("materials","")).lower()
            s_materials = 100.0 if any(m.lower() in row_materials for m in materials) else 20.0
        else:
            s_materials = 50.0
        
        # Customization score
        s_cust = 0.0
        if customization == "yes":
            has_cust = str(row.get("capabilities","")).lower() in ("true","1","yes","y","oem","odm") or row.get("capabilities") is True
            s_cust = 100.0 if has_cust else 0.0
        elif customization == "any":
            s_cust = 50.0
        else:
            s_cust = 50.0
        
        # Quantity/MOQ score
        s_qty = 0.0
        if quantity and row.get("min_moq"):
            try:
                moq = float(row.get("min_moq"))
                s_qty = 100.0 if quantity >= moq else max(20.0, 100.0 * (quantity / max(moq,1)))
            except Exception:
                s_qty = 50.0
        else:
            s_qty = 50.0
        
        # Weighted score
        score = (
            0.35 * s_country +
            0.30 * s_product +
            0.20 * s_text +
            0.10 * s_cust +
            0.05 * s_qty
        )
        return score
    
    df = df.copy()
    df["_score"] = df.apply(score_row, axis=1)
    df = df.sort_values("_score", ascending=False).head(top_k)
    
    # Convert to normalized format
    out = []
    for _, r in df.iterrows():
        out.append({
            "id": r.get("id") or f"int_{_}",
            "name": r.get("name"),
            "country": r.get("country"),
            "region": r.get("region"),
            "product_types": r.get("product_types"),
            "materials": r.get("materials", []),
            "capabilities": r.get("capabilities", []),
            "min_moq": r.get("min_moq"),
            "lead_time_days": r.get("lead_time_days"),
            "url": prefer_url(r.to_dict()),
            "source": "internal",
            "score": round(score_row(r), 2),
            "raw": r.to_dict()
        })
    return out