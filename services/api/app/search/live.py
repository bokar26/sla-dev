import os, asyncio
from typing import List, Dict, Any
from openai import OpenAI
from .normalize import expand_product_terms

OPENAI_KEY = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=OPENAI_KEY) if OPENAI_KEY else None

async def web_recall(req) -> List[Dict[str,Any]]:
    if not client:
        return []
    q = req.q or ""
    if req.product_type: q += f" (category: {req.product_type})"
    if req.country: q += f" manufacturer in {req.country}"
    # Use a lightweight model just to get vendor names + URLs
    prompt = f"""Return up to 12 suppliers with website URLs for: "{q}".
    Only return JSON list of objects: name, country(if obvious), url."""
    try:
        r = client.responses.create(model="gpt-4o-mini",
            input=prompt, temperature=0)
        # naive parse
        txt = (r.output_text or "").strip()
        import json, re
        json_str = re.search(r'\[.*\]', txt, re.S).group(0)
        data = json.loads(json_str)
        items=[]
        for i in data[:12]:
            items.append({
                "id": f"web_{i.get('url')}",
                "name": i.get("name") or "Supplier",
                "country": i.get("country"),
                "score": 0,  # will be re-scored below by the same scoring function, if wanted
                "materials": None,
                "moq": None,
                "lead_time": None,
                "source": {"type":"web", "url": i.get("url")},
                "reasoning": {"web": True},
                "raw": i
            })
        return items
    except Exception:
        return []
