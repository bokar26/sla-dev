from __future__ import annotations
import pandas as pd

def detect_sheet_type(df: pd.DataFrame) -> str:
    cols = {c.strip().lower() for c in df.columns.map(str)}
    if {"lane id","origin port","destination port","mode"} & cols and "lane id" in cols:
        return "lanes"
    if {"carrier","rate","price_usd_per_unit"} & cols:
        return "shipper_rates"
    if {"material id","price","region","date"} & cols:
        return "materials"
    if {"factory","factory name","vendor","manufacturer","country"} & cols:
        return "factories"
    return "unknown"
