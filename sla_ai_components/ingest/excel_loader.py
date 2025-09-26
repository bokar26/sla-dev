from __future__ import annotations
import pandas as pd
from pathlib import Path

def load_any(path: str) -> dict[str, pd.DataFrame]:
    p = Path(path)
    if p.suffix.lower() in (".xlsx", ".xls"):
        xl = pd.ExcelFile(p)
        return {name: xl.parse(name) for name in xl.sheet_names}
    if p.suffix.lower() in (".csv", ".tsv"):
        sep = "," if p.suffix.lower()==".csv" else "\t"
        df = pd.read_csv(p, sep=sep)
        return {"Sheet1": df}
    raise ValueError(f"Unsupported file type: {p.suffix}")
