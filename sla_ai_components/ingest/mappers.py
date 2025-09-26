from __future__ import annotations
import yaml
import pandas as pd
from typing import Dict, Any

# Proposed default keys for 'factories' canonical schema
FACTORY_KEYS = [
  "factory_id","factory_name","vendor_name","address_raw",
  "city","state_province","country_iso2","category","employees"
]

def propose_mapping(df: pd.DataFrame, sheet_type: str) -> tuple[str, float, list[str]]:
    cols = [str(c) for c in df.columns]
    lower = {c.lower(): c for c in cols}
    mapping: Dict[str,str] = {"sheet_type": sheet_type}

    def pick(*cands):
        for c in cands:
            if c in lower: return lower[c]
        return None

    if sheet_type == "factories":
        mapping.update({
          "factory_id": pick("factory id","id"),
          "factory_name": pick("factory name","factory","facility name","name"),
          "vendor_name": pick("vendor","parent vendor","manufacturer","company"),
          "address_raw": pick("address","factory address","billing address","factory street address"),
          "city": pick("city","factory city"),
          "state_province": pick("state","province","state/province"),
          "country": pick("country","factory country"),
          "category": pick("product type","facility type","category"),
          "employees": pick("employees","number of workers"),
        })
    elif sheet_type == "materials":
        mapping.update({
          "material_id": pick("material id","id"),
          "name": pick("name","material"),
          "grade": pick("grade"),
          "unit": pick("unit"),
          "region": pick("region","market"),
          "date": pick("date"),
          "price_usd_per_unit": pick("price","price_usd_per_unit","usd price"),
          "source": pick("source"),
        })
    elif sheet_type == "lanes":
        mapping.update({
          "lane_id": pick("lane id"),
          "origin_port": pick("origin port"),
          "dest_port": pick("destination port","dest port"),
          "mode": pick("mode"),
        })
    elif sheet_type == "shipper_rates":
        mapping.update({
          "lane_id": pick("lane id"),
          "carrier": pick("carrier"),
          "date": pick("date"),
          "price_usd_per_unit": pick("rate","price_usd_per_unit"),
          "unit": pick("unit"),
          "transit_days_p50": pick("transit p50","transit_days_p50"),
          "transit_var": pick("transit var"),
          "on_time_rate": pick("on-time %","on_time_rate"),
        })
    else:
        mapping.update({})

    unmatched = [c for c in cols if c not in mapping.values()]
    # naive confidence: fraction of non-null mappings
    mapped_count = sum(1 for k,v in mapping.items() if k!="sheet_type" and v)
    need_count = 5 if sheet_type=="factories" else 3
    confidence = min(1.0, mapped_count / max(need_count,1))
    return yaml.safe_dump(mapping), confidence, unmatched
