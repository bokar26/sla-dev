from __future__ import annotations
import pandas as pd

def ensure_dataframe(df):
    if df is None or not isinstance(df, pd.DataFrame):
        raise ValueError("Invalid DataFrame")

REQUIRED_BY_TYPE = {
    "factories": ["factory_name"],  # only require name
    "materials": ["material_id","date","region","price_usd_per_unit"],
    "lanes": ["lane_id","origin_port","dest_port","mode"],
    "shipper_rates": ["lane_id","carrier","date","price_usd_per_unit"],
}

def require_mapped_keys(mapping: dict):
    t = mapping.get("sheet_type","unknown")
    req = REQUIRED_BY_TYPE.get(t, [])
    missing = [k for k in req if not mapping.get(k)]
    if missing:
        raise ValueError(f"Missing required mapped keys for {t}: {missing}")
