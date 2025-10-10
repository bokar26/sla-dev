from __future__ import annotations
import hashlib, os, json, time
from typing import Dict, Any
from PIL import Image
from io import BytesIO
from ..llm.openai_client import respond, output_text
from ..core.settings import settings

CACHE_DIR = os.getenv("VISION_CACHE_DIR", ".cache/vision")
os.makedirs(CACHE_DIR, exist_ok=True)

def _sha1(b: bytes) -> str:
    return hashlib.sha1(b).hexdigest()

def _load_cache(k: str) -> dict|None:
    p = os.path.join(CACHE_DIR, f"{k}.json")
    if os.path.exists(p):
        try:
            return json.load(open(p, "r", encoding="utf-8"))
        except Exception:
            return None
    return None

def _save_cache(k: str, d: dict):
    p = os.path.join(CACHE_DIR, f"{k}.json")
    try:
        json.dump(d, open(p, "w", encoding="utf-8"), ensure_ascii=False)
    except Exception:
        pass

PROMPT = ("You see a product photo related to manufacturing. "
          "Return JSON with keys: productName, category, materials[], processes[]. "
          "Be brief and specific (e.g., 'cotton knit sweater', category 'knitwear').")

def downscale_jpeg(data: bytes, max_px=1024, quality=80) -> bytes:
    img = Image.open(BytesIO(data)).convert("RGB")
    w, h = img.size
    scale = min(1.0, max_px/max(w,h))
    if scale < 1.0:
        img = img.resize((int(w*scale), int(h*scale)))
    out = BytesIO()
    img.save(out, format="JPEG", optimize=True, quality=quality)
    return out.getvalue()

async def extract_needs_from_image(data: bytes) -> dict:
    key = _sha1(data)
    cached = _load_cache(key)
    if cached:
        return cached

    img = downscale_jpeg(data)

    # simple retry/backoff for 429
    delay = 1.5
    for attempt in range(4):
        try:
            # Convert to base64 for OpenAI vision
            import base64
            img_b64 = base64.b64encode(img).decode('utf-8')
            
            resp = await respond(settings.OPENAI_MODEL, [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": PROMPT},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{img_b64}"
                            }
                        }
                    ]
                }
            ])
            
            text_output = output_text(resp)
            data = {}
            try:
                data = json.loads(text_output)
            except Exception:
                pass
            
            if data:
                _save_cache(key, data)
            return data or {}
        except Exception as e:
            msg = str(e)
            if "rate limit" in msg.lower() or "429" in msg:
                time.sleep(delay)
                delay *= 2
                continue
            return {"_error": msg}
    return {"_error":"vision_rate_limited"}
