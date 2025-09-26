from __future__ import annotations
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta

from sla_ai_components.suggestions.scheduler import get_suggestions, update_suggestion_status, run_once_for_tenant

router = APIRouter(prefix="/ai/suggestions", tags=["ai"])

def get_tenant_id():
    return "tenant_demo"

class SuggestionOut(BaseModel):
    id: int
    kind: str
    title: str
    description: str
    impact_score: float
    expected_savings_usd: float
    expected_eta_days_delta: float
    confidence: float
    status: str
    data_json: Dict[str, Any]

class ListResponse(BaseModel):
    suggestions: List[SuggestionOut]

@router.get("", response_model=ListResponse)
def list_suggestions(status: Optional[str] = None, limit: int = 10, tenant_id: str = Depends(get_tenant_id)):
    items = get_suggestions(tenant_id, status=status, limit=limit)
    return {"suggestions": items}

class ActionBody(BaseModel):
    suggestion_id: int
    action: str           # 'accept' | 'dismiss' | 'snooze'
    days: Optional[int] = 7

@router.post("/action")
def suggestion_action(body: ActionBody, tenant_id: str = Depends(get_tenant_id)):
    snooze_until = None
    if body.action == "snooze":
        snooze_until = datetime.utcnow() + timedelta(days=body.days or 7)
    ok = update_suggestion_status(tenant_id, body.suggestion_id, 
                                   "accepted" if body.action=="accept" else ("dismissed" if body.action=="dismiss" else "snoozed"),
                                   snooze_until=snooze_until)
    if not ok: raise HTTPException(404, "Suggestion not found")
    return {"ok": True}

@router.post("/run")
def run_now(tenant_id: str = Depends(get_tenant_id)):
    run_once_for_tenant(tenant_id)
    return {"ok": True}
