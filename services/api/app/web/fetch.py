from __future__ import annotations
import asyncio
import httpx
from typing import List, Dict, Any, Optional
import trafilatura
from urllib.parse import urljoin, urlparse

async def fetch_url_content(url: str, timeout: float = 10.0) -> Optional[str]:
    """Fetch and extract readable text from a URL"""
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.get(url, follow_redirects=True)
            response.raise_for_status()
            
            # Extract readable text using trafilatura
            text = trafilatura.extract(response.text, url=url)
            return text if text else None
            
    except Exception as e:
        print(f"Failed to fetch {url}: {e}")
        return None

async def fetch_multiple_urls(urls: List[str], max_concurrent: int = 5) -> Dict[str, Optional[str]]:
    """Fetch multiple URLs concurrently with rate limiting"""
    semaphore = asyncio.Semaphore(max_concurrent)
    
    async def fetch_with_semaphore(url: str) -> tuple[str, Optional[str]]:
        async with semaphore:
            content = await fetch_url_content(url)
            return url, content
    
    tasks = [fetch_with_semaphore(url) for url in urls]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    url_contents = {}
    for result in results:
        if isinstance(result, tuple) and len(result) == 2:
            url, content = result
            url_contents[url] = content
        else:
            print(f"Fetch error: {result}")
    
    return url_contents

def fetch_readable(url: str, timeout: float = 10.0) -> Optional[str]:
    """Fetch and extract readable text from a URL (single URL version)"""
    try:
        async def _fetch():
            return await fetch_url_content(url, timeout)
        
        import asyncio
        return asyncio.run(_fetch())
    except Exception as e:
        print(f"Failed to fetch {url}: {e}")
        return None

def extract_supplier_info(text: str, url: str) -> Dict[str, Any]:
    """Extract supplier information from text content"""
    if not text:
        return {}
    
    # Simple extraction based on common patterns
    info = {
        "url": url,
        "content_length": len(text),
        "has_contact": any(keyword in text.lower() for keyword in ["contact", "email", "phone", "tel"]),
        "has_products": any(keyword in text.lower() for keyword in ["product", "manufacture", "factory", "supplier"]),
        "has_certifications": any(keyword in text.lower() for keyword in ["iso", "certified", "certification", "quality"]),
        "has_customization": any(keyword in text.lower() for keyword in ["oem", "odm", "custom", "private label"]),
    }
    
    # Try to extract company name from URL or text
    domain = urlparse(url).netloc
    if domain:
        info["domain"] = domain
        # Remove common prefixes
        name = domain.replace("www.", "").replace(".com", "").replace(".cn", "").replace(".net", "")
        info["potential_name"] = name.title()
    
    return info
