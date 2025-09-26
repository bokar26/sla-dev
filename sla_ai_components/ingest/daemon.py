from __future__ import annotations
from pathlib import Path
import time
from typing import Optional, Dict
from sla_ai_components.config import DATA_FOLDER, DEFAULT_TENANT_ID, WATCH_DATA_FOLDER, WATCH_INTERVAL_SECS, AUTO_COMMIT_FROM_DATA_FOLDER
from .files import sha256_file, tenant_from_filename, is_supported_file
from .excel_loader import load_any
from .preview import make_preview
from .commit import commit_sheet
import yaml

# Import DB helpers from upload API
from sla_ai_components.api.upload import (
    _save_upload_row, _get_upload_by_sha, _set_upload_status, 
    _save_upload_mappings, _save_ingest_report
)

def _proposed_to_mappings(previews: list[dict]) -> Dict[str,str]:
    # If a mapping profile exists, you can prioritize it. For now use proposed.
    return {p["sheet_name"]: p["proposed_mapping_yaml"] for p in previews if p["sheet_type"] != "unknown"}

def _ingest_file(path: Path):
    if not is_supported_file(path):
        return None

    checksum = sha256_file(str(path))
    if _get_upload_by_sha(checksum):
        # Already ingested this exact file
        print(f"[AUTO-INGEST] Skipping {path.name} - already processed (checksum: {checksum[:8]}...)")
        return None

    tenant_id = tenant_from_filename(path.name, DEFAULT_TENANT_ID)
    mime = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" if path.suffix.lower() in (".xlsx",".xls") else "text/csv"
    upload_id = _save_upload_row(tenant_id, path.name, mime, status="received", file_path=str(path), file_sha256=checksum)

    print(f"[AUTO-INGEST] Processing {path.name} for tenant {tenant_id} (upload_id: {upload_id})")

    try:
        frames = load_any(str(path))
        previews = make_preview(frames)
        for p in previews:
            _save_upload_mappings(upload_id, p["sheet_name"], p["proposed_mapping_yaml"], p["confidence"])
        _set_upload_status(upload_id, "preview_ready")

        # Auto-commit with proposed mappings if enabled
        if AUTO_COMMIT_FROM_DATA_FOLDER:
            mappings = _proposed_to_mappings(previews)
            stats = []
            for sheet_name, df in frames.items():
                mapping_yaml = mappings.get(sheet_name)
                if not mapping_yaml:
                    stats.append({"sheet": sheet_name, "skipped": len(df)})
                    continue
                s = commit_sheet(tenant_id, upload_id, sheet_name, df, mapping_yaml)
                stats.append(s)
            _save_ingest_report(upload_id, {"sheets": stats})
            _set_upload_status(upload_id, "committed")
            print(f"[AUTO-INGEST] ✅ Successfully committed {path.name} - {sum(s.get('rows_out', 0) for s in stats)} rows processed")
        else:
            print(f"[AUTO-INGEST] ⏳ {path.name} ready for manual review (preview_ready)")

    except Exception as e:
        _set_upload_status(upload_id, "failed")
        print(f"[AUTO-INGEST] ❌ Failed to process {path.name}: {e}")
        return upload_id

    return upload_id

def bootstrap_scan():
    """One-time scan of the data folder at startup"""
    data_dir = Path(DATA_FOLDER)
    data_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"[AUTO-INGEST] 🔍 Bootstrap scanning {data_dir}")
    
    files_found = 0
    files_processed = 0
    
    for p in sorted(data_dir.glob("**/*")):
        if p.is_file():
            files_found += 1
            if is_supported_file(p):
                result = _ingest_file(p)
                if result:
                    files_processed += 1
    
    print(f"[AUTO-INGEST] 📊 Bootstrap complete: {files_found} files found, {files_processed} processed")
    return files_processed

def watch_loop():
    """Continuous monitoring of the data folder"""
    if not WATCH_DATA_FOLDER:
        print("[AUTO-INGEST] ⏸️  File watching disabled")
        return
        
    seen: set[str] = set()
    data_dir = Path(DATA_FOLDER)
    data_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"[AUTO-INGEST] 👀 Starting file watcher for {data_dir} (interval: {WATCH_INTERVAL_SECS}s)")
    
    while True:
        try:
            for p in data_dir.glob("**/*"):
                if p.is_file() and is_supported_file(p):
                    key = str(p.resolve())
                    if key not in seen:
                        print(f"[AUTO-INGEST] 🆕 New file detected: {p.name}")
                        _ingest_file(p)
                        seen.add(key)
            time.sleep(WATCH_INTERVAL_SECS)
        except Exception as e:
            print(f"[AUTO-INGEST] ❌ Watcher error: {e}")
            time.sleep(WATCH_INTERVAL_SECS)
