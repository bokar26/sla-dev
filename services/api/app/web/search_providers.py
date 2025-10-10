from __future__ import annotations
import os
import asyncio
from typing import List, Dict, Any, Optional
from duckduckgo_search import DDGS
import httpx
from ..core.settings import settings

async def duckduckgo_search(query: str, max_results: int = 20) -> List[Dict[str, Any]]:
    """Search using DuckDuckGo (free, no API key required)"""
    try:
        with DDGS() as ddgs:
            results = []
            for result in ddgs.text(query, max_results=max_results):
                results.append({
                    "title": result.get("title", ""),
                    "url": result.get("href", ""),
                    "snippet": result.get("body", ""),
                    "source": "duckduckgo"
                })
            return results
    except Exception as e:
        print(f"DuckDuckGo search error: {e}")
        return []

async def bing_search(query: str, max_results: int = 20) -> List[Dict[str, Any]]:
    """Search using Bing Search API (requires API key)"""
    api_key = getattr(settings, 'BING_SEARCH_KEY', None)
    if not api_key:
        return []
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                "https://api.bing.microsoft.com/v7.0/search",
                headers={"Ocp-Apim-Subscription-Key": api_key},
                params={"q": query, "count": min(max_results, 50)}
            )
            response.raise_for_status()
            data = response.json()
            
            results = []
            for item in data.get("webPages", {}).get("value", []):
                results.append({
                    "title": item.get("name", ""),
                    "url": item.get("url", ""),
                    "snippet": item.get("snippet", ""),
                    "source": "bing"
                })
            return results
    except Exception as e:
        print(f"Bing search error: {e}")
        return []

async def serper_search(query: str, max_results: int = 20) -> List[Dict[str, Any]]:
    """Search using Serper API (requires API key)"""
    api_key = getattr(settings, 'SERPER_API_KEY', None)
    if not api_key:
        return []
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                "https://google.serper.dev/search",
                headers={"X-API-KEY": api_key, "Content-Type": "application/json"},
                json={"q": query, "num": min(max_results, 20)}
            )
            response.raise_for_status()
            data = response.json()
            
            results = []
            for item in data.get("organic", []):
                results.append({
                    "title": item.get("title", ""),
                    "url": item.get("link", ""),
                    "snippet": item.get("snippet", ""),
                    "source": "serper"
                })
            return results
    except Exception as e:
        print(f"Serper search error: {e}")
        return []

async def search_all_providers(query: str, max_results_per_provider: int = 20) -> List[Dict[str, Any]]:
    """Search all available providers concurrently"""
    tasks = [
        duckduckgo_search(query, max_results_per_provider),
        bing_search(query, max_results_per_provider),
        serper_search(query, max_results_per_provider)
    ]
    
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    all_results = []
    for result in results:
        if isinstance(result, list):
            all_results.extend(result)
        else:
            print(f"Search provider error: {result}")
    
    # Deduplicate by URL
    seen_urls = set()
    deduped = []
    for item in all_results:
        url = item.get("url", "")
        if url and url not in seen_urls:
            seen_urls.add(url)
            deduped.append(item)
    
    return deduped
