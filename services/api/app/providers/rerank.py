from ..llm.openai_client import respond, output_text
from ..core.settings import settings

async def rerank_with_llm(query: str, candidates: list[dict], quantity: int | None, customization: bool | None, top_k: int = 200):
    # Build a compact prompt with JSON-safe candidates (cap length upstream as needed)
    sys = "You are a sourcing ranking assistant. Score 0-100. Higher is better. Return JSON with id, score, reasons."
    user = {
      "task": "score_suppliers",
      "query": query,
      "quantity": quantity,
      "customization": customization,
      "candidates": [
        {
          "id": c.get("id"),
          "name": c.get("name"),
          "country": c.get("country"),
          "product_types": c.get("product_types"),
          "certs": c.get("certs"),
          "moq": c.get("moq"),
          "lead_days": c.get("lead_days"),
          "url": c.get("url"),
          "source": c.get("source"),
        } for c in candidates[:top_k]
      ]
    }
    resp = await respond(settings.OPENAI_MODEL, [{"role":"system","content":sys},{"role":"user","content":str(user)}])
    text = output_text(resp)

    # Parse and map back (expecting a JSON-ish array; be defensive)
    import json
    try:
        data = json.loads(text)
    except Exception:
        # fallback: no JSON -> return empty scores with a generic reason
        data = []

    scores = {}
    for item in (data if isinstance(data, list) else []):
        sid = item.get("id")
        sc  = float(item.get("score", 0))
        rsn = item.get("reasons") or "Ranked by OpenAI LLM."
        if sid is not None:
            scores[sid] = {"score": sc, "reasons": rsn}

    # Attach scores to candidates
    out = []
    for c in candidates[:top_k]:
        s = scores.get(c.get("id"), {"score": 0, "reasons": "No extra reasoning available."})
        c2 = {**c, "score": s["score"], "reasoning": s["reasons"]}
        out.append(c2)

    # sort by score desc
    out.sort(key=lambda x: x.get("score", 0), reverse=True)
    return out
