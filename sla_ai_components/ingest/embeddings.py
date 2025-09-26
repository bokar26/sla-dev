from __future__ import annotations
import json
import numpy as np
from sla_ai_components.embeddings.embed import embed_spec

def build_factory_text(row: dict) -> dict:
    parts = [
      str(row.get("category","")),
      str(row.get("factory_name","")),
      str(row.get("vendor_name","")),
      str(row.get("city","")), str(row.get("country_iso2",""))
    ]
    return {"text": " | ".join([p for p in parts if p])}

def embed_factory_row(row: dict) -> list[float]:
    text = build_factory_text(row)["text"]
    v = np.array(embed_spec({"t":text}), dtype=float)
    return v.tolist()
