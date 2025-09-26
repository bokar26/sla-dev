from __future__ import annotations
import pandas as pd

COUNTRY_ALIAS = {
  "united states":"US","usa":"US","u.s.":"US",
  "india":"IN","china":"CN","thailand":"TH","vietnam":"VN",
  "bangladesh":"BD","indonesia":"ID","mexico":"MX","turkey":"TR","italy":"IT"
}

def normalize_country(val: str) -> str | None:
    if not val: return None
    s = str(val).strip().lower()
    return COUNTRY_ALIAS.get(s, s.upper() if len(s)==2 else s.title())

def apply_mapping(df: pd.DataFrame, mapping: dict) -> pd.DataFrame:
    out = {}
    for k,v in mapping.items():
        if k in ("sheet_type",) or not v: continue
        if v in df.columns:
            out[k] = df[v]
    res = pd.DataFrame(out)
    # location cleanup
    if "country" in res.columns and "country_iso2" not in res.columns:
        res["country_iso2"] = res["country"].apply(normalize_country)
    return res
