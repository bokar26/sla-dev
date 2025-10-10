import asyncio, time
from typing import List, Dict, Any, Tuple
from .normalize import expand_product_terms
from ..internal_index import recall_internal_legacy, score_row, get_internal_corpus
from .live import web_recall

async def perform_unified_search(req) -> Tuple[List[Dict[str,Any]], Dict[str,Any]]:
    t0 = time.time()
    passes = []
    results: Dict[str,Dict[str,Any]] = {}
    target = 10
    hard_budget_ms = 12000
    thresholds = [req.min_score or 80, 75, 70, 65, 60, 55, 50]

    # Gather internal corpus once
    corpus = get_internal_corpus()

    async def keep(items: List[Dict[str,Any]], label: str):
        kept = 0
        for it in items:
            k = it["id"]
            if k not in results:
                results[k] = it
                kept += 1
        return kept

    for p, thr in enumerate(thresholds, start=1):
        # internal always runs
        # Convert req to structured query format for legacy function
        structured_query = {
            "product_title": req.q or "",
            "category": req.product_type or "",
            "country": req.country,
            "quantity": req.quantity,
            "customization": req.customization or "any",
            "query_terms": [req.q] if req.q else []
        }
        internal = recall_internal_legacy(structured_query, top_k=200)

        # web optionally
        web = await web_recall(req)

        # re-score web items by same logic (optional quick match: name vs terms)
        if web:
            q_terms = expand_product_terms(req.q or "", req.product_type)
            rescored=[]
            for w in web:
                # Simple scoring for web items
                w["score"] = 60.0  # Default score for web items
                rescored.append(w)
            web = rescored

        # apply threshold, sort
        cand = [x for x in (internal[:200] + (web or [])) if x["score"] >= thr]
        cand.sort(key=lambda x: x["score"], reverse=True)

        kept = await keep(cand, f"pass{p}")
        passes.append({"pass": p, "thr": thr, "candidates": len(cand), "kept": kept, "t": int((time.time()-t0)*1000)})
        if len(results) >= target: break
        if (time.time()-t0)*1000 >= hard_budget_ms: break

        # slight relaxation between passes (country softening)
        if p==2 and req.country:
            req.country = None  # relax country after first attempt

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
