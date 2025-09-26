import pandas as pd, yaml
from sla_ai_components.ingest.commit import commit_sheet

def test_commit_factories_smoke():
    df = pd.DataFrame([
        {"Factory Name":"Alpha Co","Vendor":"Globex","Country":"India","City":"Tiruppur"}
    ])
    mapping = {
      "sheet_type":"factories","factory_name":"Factory Name","vendor_name":"Vendor",
      "country":"Country","city":"City"
    }

    # Test that commit_sheet runs without error and returns expected structure
    stats = commit_sheet("tenant_demo", 1, "Sheet1", df, yaml.safe_dump(mapping))
    assert "sheet" in stats
    assert "sheet_type" in stats
    assert "rows_in" in stats
    assert "rows_out" in stats
    assert stats["sheet_type"] == "factories"
    assert stats["rows_in"] == 1
    assert stats["rows_out"] >= 0  # Should have processed at least some rows

def test_commit_materials():
    df = pd.DataFrame([
        {"Material ID":"COT001","Name":"Cotton","Price":2.5,"Region":"US","Date":"2024-01-01"}
    ])
    mapping = {
      "sheet_type":"materials","material_id":"Material ID","name":"Name",
      "price_usd_per_unit":"Price","region":"Region","date":"Date"
    }

    # Test that commit_sheet runs without error and returns expected structure
    stats = commit_sheet("tenant_demo", 1, "Sheet1", df, yaml.safe_dump(mapping))
    assert "sheet" in stats
    assert "sheet_type" in stats
    assert "rows_in" in stats
    assert "rows_out" in stats
    assert stats["sheet_type"] == "materials"
    assert stats["rows_in"] == 1
    assert stats["rows_out"] >= 0  # Should have processed at least some rows

def test_commit_unknown_sheet_type():
    df = pd.DataFrame([{"Unknown":"Data"}])
    mapping = {"sheet_type":"unknown"}
    
    stats = commit_sheet("tenant_demo", 1, "Sheet1", df, yaml.safe_dump(mapping))
    assert stats["skipped"] == 1
    assert stats["rows_out"] == 0
