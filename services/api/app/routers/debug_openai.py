from fastapi import APIRouter
import os
from openai import OpenAI

router = APIRouter()

@router.get("/v1/debug/openai")
def debug_openai():
    key_set = bool(os.getenv("OPENAI_API_KEY"))
    model = os.getenv("OPENAI_MODEL_SEARCH", "gpt-5")
    info = {"key_present": key_set, "model": model}
    if not key_set:
        return {"ok": False, "info": info, "reason": "OPENAI_API_KEY missing"}
    try:
        client = OpenAI()
        # Light-touch call: list 1 model to confirm credentials
        _ = client.models.list()
        return {"ok": True, "info": info}
    except Exception as e:
        return {"ok": False, "info": info, "error": str(e)}
