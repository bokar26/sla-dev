from __future__ import annotations
import json, time, os
from typing import Optional, List, Dict, Any
from .llm.openai_client import respond, output_text
from .core.settings import settings

def normalize_url(url: str) -> str:
    """Normalize URL with scheme fix and trimming"""
    if not url:
        return ""
    url = url.strip()
    if url.startswith("//"):
        return "https:" + url
    if not url.startswith(("http://", "https://")):
        return "https://" + url
    return url

async def retry_openai(fn, max_attempts: int = 3, base_delay: float = 1.0):
    """Retry OpenAI calls with exponential backoff"""
    for attempt in range(max_attempts):
        try:
            return await fn()
        except Exception as e:
            if "rate limit" in str(e).lower() or "429" in str(e):
                if attempt < max_attempts - 1:
                    delay = base_delay * (2 ** attempt)
                    time.sleep(delay)
                    continue
            raise e
    return None

async def llm_structured_query(q: str, image_bytes: Optional[bytes] = None, filename: Optional[str] = None) -> Dict[str, Any]:
    """Extract structured query from text and optional image"""
    
    system_prompt = """You are a sourcing assistant. Convert the user's query into a structured format for supplier search.

Return ONLY a JSON object with these keys:
- product_title: Brief product name (e.g., "men's cotton t-shirt")
- category: Normalized category (e.g., "apparel:t-shirt", "electronics:led", "machinery:valve")
- materials: List of materials mentioned or inferred
- country: Country preference if mentioned
- quantity: Quantity if mentioned
- customization: "yes", "no", or "any"
- query_terms: List of search terms/synonyms for matching
- image_summary: Brief description if image provided

Be specific and accurate. Infer materials and processes from product types."""

    user_content = f"Query: {q}"
    
    # If image provided, add to the message
    if image_bytes:
        import base64
        img_b64 = base64.b64encode(image_bytes).decode('utf-8')
        user_content = [
            {"type": "text", "text": f"Query: {q}"},
            {
                "type": "image_url", 
                "image_url": {"url": f"data:image/jpeg;base64,{img_b64}"}
            }
        ]
    
    try:
        async def _call():
            return await respond(settings.OPENAI_MODEL, [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content}
            ])
        
        resp = await retry_openai(_call)
        text_output = output_text(resp)
        
        try:
            data = json.loads(text_output)
            return data
        except Exception:
            # Fallback to basic structure
            return {
                "product_title": q,
                "category": "general",
                "materials": [],
                "country": None,
                "quantity": None,
                "customization": "any",
                "query_terms": [q],
                "image_summary": None
            }
    except Exception as e:
        print(f"LLM structured query error: {e}")
        return {
            "product_title": q,
            "category": "general", 
            "materials": [],
            "country": None,
            "quantity": None,
            "customization": "any",
            "query_terms": [q],
            "image_summary": None
        }

async def web_collect_vendors(structured_query: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Collect vendors from web using OpenAI web search"""
    
    # Check if web search is enabled
    if not os.getenv("OPENAI_USE_WEB", "0") == "1":
        return []
    
    try:
        system_prompt = """You are a sourcing assistant. Use web search to find real manufacturers and suppliers.

Search for actual manufacturer/factory websites, not reseller ads. Focus on:
- Alibaba.com supplier pages
- Made-in-China.com factory listings  
- Direct manufacturer websites
- B2B supplier directories

Return a JSON array of suppliers with: name, url, country, product_types[], materials[], min_moq, description"""

        user_prompt = f"""Find suppliers for: {structured_query.get('product_title', '')}
Category: {structured_query.get('category', '')}
Materials: {structured_query.get('materials', [])}
Country preference: {structured_query.get('country', 'any')}

Return up to 20 real suppliers with their actual websites."""

        async def _call():
            return await respond(settings.OPENAI_MODEL, [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ])
        
        resp = await retry_openai(_call)
        text_output = output_text(resp)
        
        try:
            data = json.loads(text_output)
            if isinstance(data, list):
                # Normalize web results
                vendors = []
                for item in data[:20]:
                    if isinstance(item, dict):
                        vendor = {
                            "id": None,
                            "name": item.get("name", "Unknown Supplier"),
                            "country": item.get("country"),
                            "product_types": item.get("product_types", []),
                            "materials": item.get("materials", []),
                            "min_moq": item.get("min_moq"),
                            "lead_time_days": item.get("lead_time_days"),
                            "url": normalize_url(item.get("url", "")),
                            "source": "web",
                            "description": item.get("description", "")
                        }
                        vendors.append(vendor)
                return vendors
        except Exception:
            pass
        
        return []
    except Exception as e:
        print(f"Web search error: {e}")
        return []
