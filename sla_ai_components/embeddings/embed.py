from __future__ import annotations
from typing import Any, List
import numpy as np
import hashlib
import json

def _hash_to_vec(s: str, dim: int = 4) -> List[float]:
    h = hashlib.sha256(s.encode()).digest()
    vals = [int.from_bytes(h[i:i+2], "big") % 1000 / 1000 for i in range(0, 2*dim, 2)]
    v = np.array(vals, dtype=float)
    v = v / (np.linalg.norm(v) + 1e-9)
    return v.tolist()

def embed_spec(sku_spec: Any) -> list:
    """Deterministic tiny embedding until real model is wired."""
    s = json.dumps(sku_spec, sort_keys=True)
    return _hash_to_vec(s, dim=4)
