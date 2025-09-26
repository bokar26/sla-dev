from __future__ import annotations
import pandas as pd
from .detectors import detect_sheet_type
from .mappers import propose_mapping

def make_preview(frames: dict[str, pd.DataFrame]) -> list[dict]:
    out = []
    for name, df in frames.items():
        stype = detect_sheet_type(df)
        mapping_yaml, confidence, unmatched = propose_mapping(df, stype)
        sample = df.head(5).to_dict(orient="records")
        out.append({
          "sheet_name": name,
          "sheet_type": stype,
          "proposed_mapping_yaml": mapping_yaml,
          "confidence": confidence,
          "unmatched_columns": unmatched[:20],
          "sample_rows": sample
        })
    return out
