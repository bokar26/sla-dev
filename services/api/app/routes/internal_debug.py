from fastapi import APIRouter
from ..internal_index import internal_health

router = APIRouter(prefix="/v1/debug", tags=["debug"])

@router.get("/internal-health")
def _internal_health():
    return internal_health()
