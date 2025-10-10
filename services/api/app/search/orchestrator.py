import asyncio, time
from typing import List, Dict, Any, Tuple
from ..internal_loader import get_corpus
from .normalize import expand_product_terms
from rapidfuzz import fuzz

async def perform_unified_search(req) -> Tuple[List[Dict[str,Any]], Dict[str,Any]]:
    t0 = time.time()
    passes = []
    results: Dict[str,Dict[str,Any]] = {}
    target = 10
    hard_budget_ms = 12000
    thresholds = [req.min_score or 80, 75, 70, 65, 60, 55, 50]

    # Gather internal corpus once
    corpus = await get_corpus()

    async def keep(items: List[Dict[str,Any]], label: str):
        kept = 0
        for it in items:
            k = it["id"]
            if k not in results:
                results[k] = it
                kept += 1
        return kept

    for p, thr in enumerate(thresholds, start=1):
        # Internal search
        internal = await search_internal(corpus, req)

        # Web search (optional)
        web = await search_web(req)

        # Apply threshold, sort
        cand = [x for x in (internal[:200] + (web or [])) if x["score"] >= thr]
        cand.sort(key=lambda x: x["score"], reverse=True)

        kept = await keep(cand, f"pass{p}")
        passes.append({"pass": p, "thr": thr, "candidates": len(cand), "kept": kept, "t": int((time.time()-t0)*1000)})
        if len(results) >= target: break
        if (time.time()-t0)*1000 >= hard_budget_ms: break

        # Relax country after first pass
        if p==2 and req.country:
            req.country = None

    final = sorted(results.values(), key=lambda x: x["score"], reverse=True)[:target]
    meta = {
        "elapsed_ms": int((time.time()-t0)*1000),
        "passes": passes,
        "providers_used": {"openai_web": bool(web)},
        "threshold_start": thresholds[0],
        "threshold_final": thresholds[min(len(passes)-1, len(thresholds)-1)],
        "note": "Returned best-available even if < requested threshold." if not final or (final and final[0]["score"] < thresholds[0]) else None
    }
    return final, meta

async def search_internal(corpus: List[Dict[str,Any]], req) -> List[Dict[str,Any]]:
    """Search internal corpus with weighted scoring"""
    q_terms = expand_product_terms(req.q or "", req.product_type)
    out = []
    
    for row in corpus:
        score = score_row(row, q_terms, req)
        if score > 0:  # Only include items with some score
            row_id = row.get("id") or row.get("_id") or row.get("supplier_id")
            url = row.get("url") or row.get("website") or row.get("alibaba_url") or None
            out.append({
                "id": f"int_{row_id}",
                "name": row.get("name") or "Unknown",
                "country": row.get("country"),
                "score": round(score, 2),
                "materials": row.get("materials"),
                "moq": row.get("moq") or row.get("MOQ"),
                "lead_time": row.get("lead_time"),
                "source": {"type":"internal", "url": url},
                "reasoning": {"internal": True},
                "raw": row
            })
    
    # Sort by score desc
    out.sort(key=lambda x: x["score"], reverse=True)
    return out

def score_row(row: Dict[str,Any], q_terms: set[str], req) -> float:
    """Score a single row using weighted criteria"""
    # Extract row data
    name = str(row.get("name", "")).lower()
    product_types = str(row.get("product_types", "")).lower()
    materials = str(row.get("materials", "")).lower()
    tags = str(row.get("tags", "")).lower()
    description = str(row.get("description", "")).lower()
    capabilities = str(row.get("capabilities", "")).lower()
    
    # Combine all text fields
    text_blob = f"{name} {product_types} {materials} {tags} {description} {capabilities}"
    
    # 1. Country score (0.35)
    country_score = 0.0
    row_country = str(row.get("country", "")).lower()
    if req.country:
        if row_country == req.country.lower():
            country_score = 100.0
        else:
            country_score = 20.0  # Penalty for wrong country
    else:
        country_score = 70.0  # Neutral if no country preference
    
    # 2. Product/category score (0.30)
    product_score = 0.0
    if q_terms:
        # Check if any query terms match product types
        for term in q_terms:
            if term in product_types:
                product_score = max(product_score, 100.0)
            elif term in text_blob:
                product_score = max(product_score, 80.0)
    else:
        product_score = 30.0
    
    # 3. Text similarity (0.20)
    text_score = 0.0
    if q_terms:
        query_text = " ".join(q_terms)
        text_score = fuzz.token_set_ratio(query_text, text_blob)
    else:
        text_score = 50.0
    
    # 4. Customization (0.10)
    cust_score = 0.0
    if req.customization == "yes":
        has_custom = any(keyword in capabilities for keyword in ["oem", "odm", "custom", "yes", "true"])
        cust_score = 100.0 if has_custom else 0.0
    elif req.customization == "any":
        cust_score = 50.0
    else:
        cust_score = 50.0
    
    # 5. Quantity/MOQ (0.05)
    qty_score = 0.0
    if req.quantity and row.get("moq"):
        try:
            moq = float(row.get("moq"))
            if req.quantity >= moq:
                qty_score = 100.0
            else:
                qty_score = max(20.0, 100.0 * (req.quantity / moq))
        except Exception:
            qty_score = 50.0
    else:
        qty_score = 50.0
    
    # Weighted final score
    final_score = (
        0.35 * country_score +
        0.30 * product_score +
        0.20 * text_score +
        0.10 * cust_score +
        0.05 * qty_score
    )
    
    return final_score

async def search_web(req) -> List[Dict[str,Any]]:
    """Search web using OpenAI (optional)"""
    import os
    from openai import OpenAI
    
    OPENAI_KEY = os.getenv("OPENAI_API_KEY")
    if not OPENAI_KEY:
        return []
    
    client = OpenAI(api_key=OPENAI_KEY)
    
    q = req.q or ""
    if req.product_type: q += f" (category: {req.product_type})"
    if req.country: q += f" manufacturer in {req.country}"
    
    prompt = f"""Return up to 12 suppliers with website URLs for: "{q}".
    Only return JSON list of objects: name, country(if obvious), url."""
    
    try:
        r = client.responses.create(model="gpt-4o-mini", input=prompt, temperature=0)
        txt = (r.output_text or "").strip()
        import re
        json_str = re.search(r'\[.*\]', txt, re.S).group(0)
        data = json.loads(json_str)
        items=[]
        for i in data[:12]:
            items.append({
                "id": f"web_{i.get('url')}",
                "name": i.get("name") or "Supplier",
                "country": i.get("country"),
                "score": 60.0,  # Default web score
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
