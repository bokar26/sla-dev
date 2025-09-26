import pandas as pd
from pathlib import Path
import tempfile
import os
from sla_ai_components.ingest.excel_loader import load_any
from sla_ai_components.ingest.preview import make_preview

def test_preview_makes_proposals():
    with tempfile.TemporaryDirectory() as tmp_dir:
        p = Path(tmp_dir) / "suppliers.xlsx"
        df = pd.DataFrame([
            {"Factory Name":"Alpha Co","Vendor":"Globex","Country":"India","Product Type":"Knitwear"},
            {"Factory Name":"Beta Ltd","Vendor":"Globex","Country":"India","Product Type":"Denim"}
        ])
        df.to_excel(p, index=False)
        frames = load_any(str(p))
        prev = make_preview(frames)
        assert len(prev) == 1
        m = prev[0]
        assert "proposed_mapping_yaml" in m and m["sheet_type"] in ("factories","unknown")
        assert "confidence" in m
        assert "sample_rows" in m

def test_load_csv():
    with tempfile.TemporaryDirectory() as tmp_dir:
        p = Path(tmp_dir) / "test.csv"
        df = pd.DataFrame([
            {"factory_name":"Test Co","country":"US","city":"NYC"}
        ])
        df.to_csv(p, index=False)
        frames = load_any(str(p))
        assert "Sheet1" in frames
        assert len(frames["Sheet1"]) == 1

def test_load_xlsx_multiple_sheets():
    with tempfile.TemporaryDirectory() as tmp_dir:
        p = Path(tmp_dir) / "multi.xlsx"
        with pd.ExcelWriter(p) as writer:
            pd.DataFrame([{"Factory":"A","Country":"US"}]).to_excel(writer, sheet_name="Factories", index=False)
            pd.DataFrame([{"Material":"Cotton","Price":2.5}]).to_excel(writer, sheet_name="Materials", index=False)
        
        frames = load_any(str(p))
        assert "Factories" in frames
        assert "Materials" in frames
        assert len(frames) == 2
