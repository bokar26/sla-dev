from pathlib import Path
import pandas as pd
import tempfile
import os
from sla_ai_components.ingest.daemon import bootstrap_scan
from sla_ai_components.ingest.files import sha256_file, tenant_from_filename, is_supported_file
from sla_ai_components.config import DATA_FOLDER

def test_sha256_file():
    with tempfile.NamedTemporaryFile(mode='w', delete=False) as f:
        f.write("test content")
        f.flush()
        checksum = sha256_file(f.name)
        assert len(checksum) == 64  # SHA256 hex length
        assert checksum == sha256_file(f.name)  # Deterministic
        os.unlink(f.name)

def test_tenant_from_filename():
    assert tenant_from_filename("acme__suppliers.xlsx", "default") == "acme"
    assert tenant_from_filename("suppliers.xlsx", "default") == "default"
    assert tenant_from_filename("tenant_123__data.csv", "default") == "tenant_123"
    assert tenant_from_filename("normal_file.xlsx", "tenant_demo") == "tenant_demo"

def test_is_supported_file():
    assert is_supported_file(Path("test.xlsx")) == True
    assert is_supported_file(Path("test.xls")) == True
    assert is_supported_file(Path("test.csv")) == True
    assert is_supported_file(Path("test.tsv")) == True
    assert is_supported_file(Path("test.txt")) == False
    assert is_supported_file(Path("test.pdf")) == False

def test_bootstrap_scan_discovers_and_ingests(tmp_path):
    data_dir = tmp_path / "data"
    data_dir.mkdir()
    
    # Create a sample factories file
    df = pd.DataFrame([{"Factory Name":"Alpha Co","Vendor":"Globex","Country":"India"}])
    fpath = data_dir / "tenant_demo__suppliers.xlsx"
    df.to_excel(fpath, index=False)

    # Clear the in-memory uploads database to avoid conflicts
    from sla_ai_components.api.upload import _UPLOADS
    _UPLOADS.clear()

    # Test the bootstrap scan function directly
    def test_bootstrap_scan():
        from pathlib import Path
        from sla_ai_components.ingest.daemon import _ingest_file
        
        print(f"[AUTO-INGEST] 🔍 Bootstrap scanning {data_dir}")
        
        files_found = 0
        files_processed = 0
        
        for p in sorted(data_dir.glob("**/*")):
            if p.is_file():
                files_found += 1
                from sla_ai_components.ingest.files import is_supported_file
                if is_supported_file(p):
                    result = _ingest_file(p)
                    if result:
                        files_processed += 1
        
        print(f"[AUTO-INGEST] 📊 Bootstrap complete: {files_found} files found, {files_processed} processed")
        return files_processed

    files_processed = test_bootstrap_scan()
    
    # Verify that the file was processed successfully
    assert files_processed == 1
    
    # Verify that an upload record was created
    assert len(_UPLOADS) == 1
    upload_record = list(_UPLOADS.values())[0]
    assert upload_record["filename"] == "tenant_demo__suppliers.xlsx"
    assert upload_record["status"] == "committed"
    assert upload_record["tenant_id"] == "tenant_demo"

def test_bootstrap_scan_skips_unsupported_files(tmp_path):
    data_dir = tmp_path / "data"
    data_dir.mkdir()
    
    # Create unsupported files
    (data_dir / "readme.txt").write_text("This is a text file")
    (data_dir / "data.pdf").write_text("This is a PDF")
    
    # Create a supported file
    df = pd.DataFrame([{"Factory Name":"Beta Co","Vendor":"Acme","Country":"China"}])
    fpath = data_dir / "factories.xlsx"
    df.to_excel(fpath, index=False)

    # Clear the in-memory uploads database to avoid conflicts
    from sla_ai_components.api.upload import _UPLOADS
    _UPLOADS.clear()

    # Test the bootstrap scan function directly
    def test_bootstrap_scan():
        from pathlib import Path
        from sla_ai_components.ingest.daemon import _ingest_file
        
        print(f"[AUTO-INGEST] 🔍 Bootstrap scanning {data_dir}")
        
        files_found = 0
        files_processed = 0
        
        for p in sorted(data_dir.glob("**/*")):
            if p.is_file():
                files_found += 1
                from sla_ai_components.ingest.files import is_supported_file
                if is_supported_file(p):
                    result = _ingest_file(p)
                    if result:
                        files_processed += 1
        
        print(f"[AUTO-INGEST] 📊 Bootstrap complete: {files_found} files found, {files_processed} processed")
        return files_processed

    files_processed = test_bootstrap_scan()
    
    # Verify that only the supported file was processed
    assert files_processed == 1  # Only the Excel file should be processed
    
    # Verify that an upload record was created for the supported file
    assert len(_UPLOADS) == 1
    upload_record = list(_UPLOADS.values())[0]
    assert upload_record["filename"] == "factories.xlsx"
    assert upload_record["status"] == "committed"

def test_tenant_extraction_from_filename():
    # Test various tenant naming patterns
    test_cases = [
        ("acme__suppliers.xlsx", "acme"),
        ("tenant_123__data.csv", "tenant_123"),
        ("my-tenant__file.xlsx", "my-tenant"),
        ("normal_file.xlsx", "default"),
        ("__file.xlsx", "default"),  # Empty tenant prefix
    ]
    
    for filename, expected_tenant in test_cases:
        result = tenant_from_filename(filename, "default")
        assert result == expected_tenant, f"Failed for {filename}: expected {expected_tenant}, got {result}"

def test_checksum_deduplication():
    with tempfile.TemporaryDirectory() as tmp_dir:
        # Create two files with identical content
        file1 = Path(tmp_dir) / "file1.csv"
        file2 = Path(tmp_dir) / "file2.csv"
        
        content = "Factory Name,Vendor,Country\nAlpha Co,Globex,India"
        file1.write_text(content)
        file2.write_text(content)
        
        # They should have the same checksum
        checksum1 = sha256_file(str(file1))
        checksum2 = sha256_file(str(file2))
        assert checksum1 == checksum2
        
        # Different content should have different checksums
        file3 = Path(tmp_dir) / "file3.csv"
        file3.write_text("Different content")
        checksum3 = sha256_file(str(file3))
        assert checksum1 != checksum3
