from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from database import get_db
from models import AlgoOutput, RequestTypeEnum
from schemas import AlgoOutputCreate, AlgoOutputRead, AlgoOutputList, RequestType
from sqlalchemy import text
import uuid

router = APIRouter(tags=["algo-outputs"])

# Ingest from your services
@router.post("/telemetry/algo-output", response_model=AlgoOutputRead)
def ingest_algo_output(payload: AlgoOutputCreate, db: Session = Depends(get_db)):
    """Ingest algorithm output telemetry data"""
    row = AlgoOutput(**payload.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return row

# Admin list
@router.get("/admin/algo-outputs", response_model=AlgoOutputList)
def list_algo_outputs(
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=200),
    request_type: Optional[RequestType] = Query(None),
    user_id: Optional[str] = Query(None),
    from_ts: Optional[str] = Query(None, description="ISO datetime"),
    to_ts: Optional[str] = Query(None, description="ISO datetime"),
):
    """List algorithm outputs with filtering and pagination"""
    q = db.query(AlgoOutput)
    
    if request_type:
        # Convert string enum to database enum
        db_request_type = RequestTypeEnum(request_type.value)
        q = q.filter(AlgoOutput.request_type == db_request_type)
    if user_id:
        q = q.filter(AlgoOutput.user_id == user_id)
    if from_ts:
        q = q.filter(AlgoOutput.created_at >= text(f"'{from_ts}'::timestamptz"))
    if to_ts:
        q = q.filter(AlgoOutput.created_at <= text(f"'{to_ts}'::timestamptz"))

    total = q.count()
    items = (q
             .order_by(AlgoOutput.created_at.desc())
             .offset((page - 1) * page_size)
             .limit(page_size)
             .all())
    
    # Convert to response format
    items_data = []
    for item in items:
        item_dict = {
            "id": str(item.id),
            "created_at": item.created_at,
            "user_id": item.user_id,
            "tenant_id": item.tenant_id,
            "request_type": RequestType(item.request_type.value),
            "request_id": item.request_id,
            "model": item.model,
            "model_version": item.model_version,
            "num_matches_ge_80": item.num_matches_ge_80,
            "total_matches": item.total_matches,
            "top_match_score": item.top_match_score,
            "latency_ms": item.latency_ms,
            "status": item.status,
            "error_message": item.error_message,
            "input_payload": item.input_payload,
            "output_summary": item.output_summary,
            "reasoning": item.reasoning,
        }
        items_data.append(AlgoOutputRead(**item_dict))
    
    return AlgoOutputList(
        items=items_data,
        total=total,
        page=page,
        page_size=page_size
    )

# Admin detail
@router.get("/admin/algo-outputs/{output_id}", response_model=AlgoOutputRead)
def get_algo_output(output_id: str, db: Session = Depends(get_db)):
    """Get detailed algorithm output by ID"""
    try:
        output_uuid = uuid.UUID(output_id)
    except ValueError:
        raise HTTPException(400, "Invalid output ID format")
    
    row = db.query(AlgoOutput).filter(AlgoOutput.id == output_uuid).first()
    if not row:
        raise HTTPException(404, "Not found")
    
    # Convert to response format
    item_dict = {
        "id": str(row.id),
        "created_at": row.created_at,
        "user_id": row.user_id,
        "tenant_id": row.tenant_id,
        "request_type": RequestType(row.request_type.value),
        "request_id": row.request_id,
        "model": row.model,
        "model_version": row.model_version,
        "num_matches_ge_80": row.num_matches_ge_80,
        "total_matches": row.total_matches,
        "top_match_score": row.top_match_score,
        "latency_ms": row.latency_ms,
        "status": row.status,
        "error_message": row.error_message,
        "input_payload": row.input_payload,
        "output_summary": row.output_summary,
        "reasoning": row.reasoning,
    }
    
    return AlgoOutputRead(**item_dict)
