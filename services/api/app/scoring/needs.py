from __future__ import annotations
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from ..llm.openai_client import respond, output_text
from ..core.settings import settings
import json

class Needs(BaseModel):
    productName: Optional[str] = None
    category: Optional[str] = None
    materials: List[str] = []
    processes: List[str] = []
    country: Optional[str] = None
    customization: Optional[bool] = None
    quantity: Optional[int] = None

def _trim(s: str, n=3000) -> str:
    s = s or ""
    return s[:n]

SYS = ("You are a sourcing assistant. Convert input into a compact JSON object "
       "with keys: productName, category, materials[], processes[], country, customization, quantity. "
       "Infer likely materials/processes if not provided (e.g., sweater→knit/wool/cotton). "
       "Return ONLY JSON, no commentary.")

async def from_text(text: str, country: Optional[str], product_type: Optional[str],
              customization: Optional[bool], quantity: Optional[int]) -> Needs:
    user = {
        "text": _trim(text),
        "country": country,
        "product_type": product_type,
        "customization": customization,
        "quantity": quantity
    }
    
    try:
        resp = await respond(settings.OPENAI_MODEL, [
            {"role":"system","content":SYS},
            {"role":"user","content":str(user)}
        ])
        text_output = output_text(resp)
        data = {}
        try:
            data = json.loads(text_output)
        except Exception:
            pass
        return Needs(**data)
    except Exception:
        return Needs()

def merge(a: Needs, b: Needs) -> Needs:
    # b overrides missing fields in a, arrays are unioned
    return Needs(
        productName = b.productName or a.productName,
        category = b.category or a.category,
        materials = sorted({*a.materials, *b.materials}),
        processes = sorted({*a.processes, *b.processes}),
        country = b.country or a.country,
        customization = b.customization if b.customization is not None else a.customization,
        quantity = b.quantity or a.quantity
    )
