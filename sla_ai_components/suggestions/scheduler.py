from __future__ import annotations
from typing import List, Dict, Any
from datetime import datetime, timedelta
from threading import Thread
import time
import json

from sla_ai_components.suggestions.features import build_trend_features
from sla_ai_components.suggestions.generator import build_candidates_from_trends
from sla_ai_components.suggestions.evaluator import evaluate_route_suggestions, evaluate_supplier_suggestions
from sla_ai_components.suggestions.explainer import explain

# Mock DB helpers - replace with real DB calls
_SUGGESTION_RUNS = {}
_SUGGESTIONS = {}
_RUN_COUNTER = 0
_SUGGESTION_COUNTER = 0

def _list_tenants() -> List[str]:
    """Return list of tenant IDs"""
    return ["tenant_demo"]

def _insert_run(tenant_id: str, stats_json: Dict[str, Any]) -> int:
    """Insert a suggestion run record and return run_id"""
    global _RUN_COUNTER
    _RUN_COUNTER += 1
    run_id = _RUN_COUNTER
    _SUGGESTION_RUNS[run_id] = {
        "id": run_id,
        "tenant_id": tenant_id,
        "ran_at": datetime.now().isoformat(),
        "stats_json": json.dumps(stats_json)
    }
    return run_id

def _insert_suggestion(row_dict: Dict[str, Any]) -> int:
    """Insert a suggestion record and return suggestion_id"""
    global _SUGGESTION_COUNTER
    _SUGGESTION_COUNTER += 1
    suggestion_id = _SUGGESTION_COUNTER
    _SUGGESTIONS[suggestion_id] = {
        "id": suggestion_id,
        "tenant_id": row_dict["tenant_id"],
        "run_id": row_dict["run_id"],
        "kind": row_dict["kind"],
        "title": row_dict["title"],
        "description": row_dict["description"],
        "data_json": json.dumps(row_dict["data_json"]),
        "impact_score": row_dict["impact_score"],
        "expected_savings_usd": row_dict["expected_savings_usd"],
        "expected_eta_days_delta": row_dict["expected_eta_days_delta"],
        "confidence": row_dict["confidence"],
        "status": "new",
        "created_at": datetime.now().isoformat(),
        "snooze_until": None
    }
    return suggestion_id

def run_once_for_tenant(tenant_id: str):
    """Run suggestion generation for a single tenant"""
    try:
        feats = build_trend_features(tenant_id)
        cands = build_candidates_from_trends(feats)
        run_id = _insert_run(tenant_id, {"cand_count": len(cands)})

        suggestions = []
        for c in cands:
            if c["type"] == "route":
                suggestions += evaluate_route_suggestions(tenant_id, c["spec"], c.get("origin"), c.get("dest"))
            elif c["type"] == "supplier":
                suggestions += evaluate_supplier_suggestions(tenant_id, c["spec"], c.get("origin"), c.get("dest"))

        # finalize rows
        for s in suggestions:
            s["tenant_id"] = tenant_id
            s["run_id"] = run_id
            s["description"] = s.get("description") or explain(s)
            _insert_suggestion(s)
        
        print(f"[SUGGESTIONS] Generated {len(suggestions)} suggestions for tenant {tenant_id}")
    except Exception as e:
        print(f"[SUGGESTIONS] Error generating suggestions for tenant {tenant_id}: {e}")

def daily_loop(sleep_secs: int = 86400):
    """Main daily loop for suggestion generation"""
    while True:
        try:
            for t in _list_tenants():
                run_once_for_tenant(t)
        except Exception as e:
            print(f"[SUGGESTIONS] Error in daily loop: {e}")
        time.sleep(sleep_secs)

def start_scheduler():
    """Start the background scheduler"""
    Thread(target=daily_loop, args=(86400,), daemon=True).start()
    print("[SUGGESTIONS] Background scheduler started")

# Export the mock DB for API access
def get_suggestions(tenant_id: str, status: str = None, limit: int = 20) -> List[Dict[str, Any]]:
    """Get suggestions for a tenant"""
    results = []
    for suggestion in _SUGGESTIONS.values():
        if suggestion["tenant_id"] == tenant_id:
            if status is None or suggestion["status"] == status:
                # Parse JSON fields
                suggestion_copy = suggestion.copy()
                suggestion_copy["data_json"] = json.loads(suggestion["data_json"])
                results.append(suggestion_copy)
    
    # Sort by created_at descending and limit
    results.sort(key=lambda x: x["created_at"], reverse=True)
    return results[:limit]

def update_suggestion_status(tenant_id: str, suggestion_id: int, status: str, snooze_until=None):
    """Update suggestion status"""
    if suggestion_id in _SUGGESTIONS and _SUGGESTIONS[suggestion_id]["tenant_id"] == tenant_id:
        _SUGGESTIONS[suggestion_id]["status"] = status
        if snooze_until:
            _SUGGESTIONS[suggestion_id]["snooze_until"] = snooze_until.isoformat()
        return True
    return False
