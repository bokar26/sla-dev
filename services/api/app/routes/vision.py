from __future__ import annotations
from fastapi import APIRouter, UploadFile, File, HTTPException
import base64
from ..core.settings import settings
from openai import OpenAI

router = APIRouter(prefix="/v1/vision", tags=["vision"])

# Initialize client only if API key is available
_openai_api_key = getattr(settings, 'OPENAI_API_KEY', None)
_client = OpenAI(api_key=_openai_api_key) if _openai_api_key else None

@router.post("/caption")
async def caption(file: UploadFile = File(...)):
    if not _client:
        raise HTTPException(503, "OpenAI API key not configured")
    
    data = await file.read()
    if len(data) > 15 * 1024 * 1024:
        raise HTTPException(413, "File too large (15MB)")
    b64 = base64.b64encode(data).decode("utf-8")
    mime = file.content_type or "image/png"

    prompt = "Identify the product in this image in 5-10 words. Focus on the main product type, materials, and key features. No punctuation."
    try:
        resp = _client.chat.completions.create(
            model=getattr(settings, 'OPENAI_MODEL', 'gpt-4o-mini'),
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:{mime};base64,{b64}"
                            }
                        }
                    ]
                }
            ],
            max_tokens=50,
            temperature=0.1
        )
        text = resp.choices[0].message.content.strip()
        return {"caption": text[:120]}
    except Exception as e:
        raise HTTPException(500, f"Vision processing error: {str(e)}")
