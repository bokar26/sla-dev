from __future__ import annotations
import pandas as pd, yaml
from typing import Dict, Any
from .normalizers import apply_mapping
from .validators import require_mapped_keys
from .dedupe import dedupe_factories
from .embeddings import embed_factory_row
from .upsert import upsert_factories, upsert_material_prices, upsert_lanes, upsert_shipper_rates
from ..config import DISABLE_FACTORY_DEDUPE

def commit_sheet(tenant_id: str, upload_id: int, sheet_name: str, df: pd.DataFrame, mapping_yaml: str) -> dict:
    mapping = yaml.safe_load(mapping_yaml) or {}
    t = mapping.get("sheet_type","unknown")
    
    # Initialize stats before mapping
    stats = {"sheet": sheet_name, "sheet_type": t, "rows_in": int(len(df)), "rows_out": 0, "deduped": 0, "skipped": 0}
    
    # When requiring mapped keys, allow factories to pass
    try:
        require_mapped_keys(mapping)
    except Exception:
        if t != "factories":
            stats["skipped"] = int(len(df))
            return stats
        # factories: proceed with minimal fields

    mapped = apply_mapping(df, mapping)
    
    # After apply_mapping, if factories result is empty but source has a name column, carry through
    if t == "factories" and mapped.empty:
        name_col = mapping.get("factory_name")
        if name_col and name_col in df.columns:
            mapped = pd.DataFrame({"factory_name": df[name_col]})

    if t == "factories":
        mapped["tenant_id"] = tenant_id
        mapped["source_upload_id"] = upload_id
        
        # Respect the dedupe off-switch
        if not DISABLE_FACTORY_DEDUPE:
            mapped = dedupe_factories(mapped)
            stats["deduped"] = int(len(df) - len(mapped))
        
        # embed vector
        mapped["factory_vec"] = mapped.to_dict(orient="records")
        mapped["factory_vec"] = mapped["factory_vec"].apply(embed_factory_row)
        upsert_factories(mapped)
        stats["rows_out"] = int(len(mapped))
        return stats

    if t == "materials":
        upsert_material_prices(mapped); stats["rows_out"] = int(len(mapped)); return stats
    if t == "lanes":
        upsert_lanes(mapped); stats["rows_out"] = int(len(mapped)); return stats
    if t == "shipper_rates":
        upsert_shipper_rates(mapped); stats["rows_out"] = int(len(mapped)); return stats

    # unknown -> skip but report
    stats["skipped"] = int(len(df))
    return stats
