from __future__ import annotations
from pathlib import Path
import hashlib
import re

TENANT_PREFIX = re.compile(r"^([a-zA-Z0-9_\-]+)__")

def sha256_file(path: str) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()

def tenant_from_filename(filename: str, default_tenant: str) -> str:
    m = TENANT_PREFIX.match(Path(filename).name)
    return m.group(1) if m else default_tenant

def is_supported_file(path: Path) -> bool:
    return path.suffix.lower() in {".xlsx",".xls",".csv",".tsv"}
