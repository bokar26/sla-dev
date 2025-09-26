from __future__ import annotations
from fastapi import APIRouter, UploadFile, File, Form, BackgroundTasks, Depends, HTTPException
from typing import Optional
from pathlib import Path
import shutil, json
import pandas as pd

from sla_ai_components.ingest.excel_loader import load_any

router = APIRouter(prefix="/ingest", tags=["ingest"])

# Replace with your auth/tenant dependency
def get_tenant_id():
    return "tenant_demo"

# Simple in-memory storage for demo - replace with real DB
_UPLOADS = {}
_UPLOAD_COUNTER = 0

def _save_upload_row(tenant_id: str, filename: str, mime: str, status: str, file_path: str = None, file_sha256: str = None) -> int:
    global _UPLOAD_COUNTER
    _UPLOAD_COUNTER += 1
    upload_id = _UPLOAD_COUNTER
    _UPLOADS[upload_id] = {
        "id": upload_id,
        "tenant_id": tenant_id,
        "filename": filename,
        "mime": mime,
        "status": status,
        "sheet_names": None,
        "errors_json": None,
        "file_path": file_path,
        "file_sha256": file_sha256
    }
    return upload_id

def _set_upload_sheet_names(upload_id: int, sheet_names: list[str]):
    if upload_id in _UPLOADS:
        _UPLOADS[upload_id]["sheet_names"] = sheet_names

def _set_upload_status(upload_id: int, status: str):
    if upload_id in _UPLOADS:
        _UPLOADS[upload_id]["status"] = status

def _set_upload_error(upload_id: int, error: str):
    if upload_id in _UPLOADS:
        _UPLOADS[upload_id]["errors_json"] = {"error": error}
        _UPLOADS[upload_id]["status"] = "failed"

def _set_upload_path(upload_id: int, path: str):
    if upload_id in _UPLOADS:
        _UPLOADS[upload_id]["file_path"] = path

def _get_upload_row(upload_id: int):
    return _UPLOADS.get(upload_id)

def _get_upload_by_sha(file_sha256: str):
    for upload in _UPLOADS.values():
        if upload.get("file_sha256") == file_sha256:
            return upload
    return None

def _save_upload_mappings(upload_id: int, sheet_name: str, mapping_yaml: str, confidence: float):
    # Simple in-memory storage for mappings
    if upload_id not in _UPLOADS:
        _UPLOADS[upload_id]["mappings"] = {}
    if "mappings" not in _UPLOADS[upload_id]:
        _UPLOADS[upload_id]["mappings"] = {}
    _UPLOADS[upload_id]["mappings"][sheet_name] = {
        "mapping_yaml": mapping_yaml,
        "confidence": confidence
    }

def _save_ingest_report(upload_id: int, stats_json: dict):
    # Simple in-memory storage for ingest reports
    if upload_id in _UPLOADS:
        _UPLOADS[upload_id]["ingest_report"] = stats_json
        print(f"[_save_ingest_report] Saved ingest report for upload {upload_id}")

@router.post("/upload")
async def upload_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    mapping_profile_id: Optional[int] = Form(None),
    tenant_id: str = Depends(get_tenant_id),
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Missing filename")
    tmp_dir = Path("./.ingest_uploads")
    tmp_dir.mkdir(parents=True, exist_ok=True)
    dest = tmp_dir / file.filename
    with dest.open("wb") as f:
        shutil.copyfileobj(file.file, f)

    # Create uploads row (replace with real DB)
    upload_id = _save_upload_row(tenant_id, file.filename, file.content_type or "", status="received")
    _set_upload_path(upload_id, str(dest))

    # Background: parse sheet names & save
    def _prepare_preview():
        try:
            frames = load_any(str(dest))
            _set_upload_sheet_names(upload_id, list(frames.keys()))
            _set_upload_status(upload_id, "preview_ready")
        except Exception as e:
            _set_upload_error(upload_id, str(e))

    background_tasks.add_task(_prepare_preview)
    return {"upload_id": upload_id, "status": "received"}
