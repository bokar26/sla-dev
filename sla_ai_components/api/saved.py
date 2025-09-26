from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from sla_ai_components.data.repos import save_factory_to_saved

router = APIRouter(prefix="/api/saved", tags=["saved"])

class SaveFactoryIn(BaseModel):
    factory_id: str

class SaveResp(BaseModel):
    ok: bool

@router.post("/factories", response_model=SaveResp)
def save_factory(payload: SaveFactoryIn):
    save_factory_to_saved(payload.factory_id)
    return {"ok": True}
