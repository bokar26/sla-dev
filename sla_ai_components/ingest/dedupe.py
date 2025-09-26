from __future__ import annotations
import pandas as pd
import re

COMMON_WORDS = re.compile(r"\b(ltd|limited|inc|co|company|factory|manuf|manufacturing)\b", re.I)

def norm_name(s: str) -> str:
    if not s: return ""
    s = re.sub(r"[^\w\s]", " ", str(s).lower())
    s = COMMON_WORDS.sub(" ", s)
    return re.sub(r"\s+", " ", s).strip()

def dedupe_factories(df: pd.DataFrame) -> pd.DataFrame:
    """
    Conservative dedupe: within (country_iso2, city), keep first of same normalized (name + vendor).
    """
    df = df.copy()
    
    # Handle missing columns gracefully
    country_col = df.get("country_iso2", pd.Series([""] * len(df), index=df.index))
    city_col = df.get("city", pd.Series([""] * len(df), index=df.index))
    factory_name_col = df.get("factory_name", pd.Series([""] * len(df), index=df.index))
    vendor_name_col = df.get("vendor_name", pd.Series([""] * len(df), index=df.index))
    
    df["__k"] = (
        country_col.astype(str) + "|" +
        city_col.astype(str).str.lower() + "|" +
        factory_name_col.astype(str).map(norm_name) + "|" +
        vendor_name_col.astype(str).map(norm_name)
    )
    return df.drop_duplicates("__k").drop(columns="__k", errors="ignore")
