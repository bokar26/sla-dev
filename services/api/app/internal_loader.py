import os, json, csv, glob
from typing import Dict, Any, Iterable, List

DATA_DIR = os.getenv("SUPPLIERS_DATA", "data/suppliers")

def _load_json(path: str) -> List[Dict[str,Any]]:
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        return data if isinstance(data, list) else [data]

def _load_ndjson(path: str) -> List[Dict[str,Any]]:
    out=[]
    with open(path, 'r', encoding='utf-8') as f:
        for line in f:
            line=line.strip()
            if not line: continue
            out.append(json.loads(line))
    return out

def _load_csv(path: str) -> List[Dict[str,Any]]:
    out=[]
    with open(path, newline='', encoding='utf-8') as f:
        for row in csv.DictReader(f):
            out.append(row)
    return out

def _files() -> List[str]:
    pats = ["*.json","*.ndjson","*.csv"]
    files=[]
    for p in pats:
        files += glob.glob(os.path.join(DATA_DIR, p))
    return files

_CACHE: List[Dict[str,Any]]|None = None

async def get_corpus() -> List[Dict[str,Any]]:
    global _CACHE
    if _CACHE is not None: return _CACHE
    files = _files()
    out=[]
    for p in files:
        if p.endswith(".json"):   out += _load_json(p)
        elif p.endswith(".ndjson"): out += _load_ndjson(p)
        elif p.endswith(".csv"):    out += _load_csv(p)
    # normalize common fields (url/website, moq numeric)
    for r in out:
        if "website" not in r: r["website"] = r.get("url") or r.get("alibaba_url")
        try:
            if "moq" in r and isinstance(r["moq"], str) and r["moq"].isdigit():
                r["moq"] = int(r["moq"])
        except: pass
    _CACHE = out
    return _CACHE
