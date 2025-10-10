import os
from typing import Optional
from openai import OpenAI

OPENAI_KEY = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=OPENAI_KEY) if OPENAI_KEY else None

async def summarize_image(path: str) -> str|None:
    try:
        from PIL import Image
        im = Image.open(path)
        im.thumbnail((1024,1024))
        im.save(path)  # overwrite smaller
    except Exception:
        pass
    try:
        if client:  # OpenAI available
            r = client.responses.create(
                model="gpt-4o-mini",
                input=[{"role":"user","content":[{"type":"input_text","text":"Briefly label this product in 8 words max."},{"type":"input_image","image_url": f"file://{path}"}]}],
                temperature=0
            )
            return (r.output_text or "").strip()[:120]
    except Exception:
        return None
    return None
