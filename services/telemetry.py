"""
Telemetry service for tracking SLA.ai algorithm outputs and reasoning.
"""
from sqlalchemy.orm import Session
from schemas import AlgoOutputCreate, RequestType
from routes.algo_outputs import ingest_algo_output
import time
from typing import Dict, Any, Optional, List


def record_algo_output(
    db: Session,
    *,
    user_id: str,
    request_type: RequestType,
    matches: list[dict] | None = None,  # NEW: pass raw matches here (each has id/name/score)
    num_matches_ge_80: int | None = None,  # optional for backward compatibility
    total_matches: int | None = None,
    top_match_score: float | None = None,
    top_matches: list[dict] | None = None,  # NEW: pre-computed top matches
    latency_ms: int | None = None,
    model: str | None = None,
    model_version: str | None = None,
    input_payload: dict | None = None,
    output_summary: str | None = None,
    reasoning: dict | None = None,
    status: str = "success",
    error_message: str | None = None,
    request_id: str | None = None,
    tenant_id: str | None = None,
):
    """
    Record algorithm output telemetry data.
    
    Args:
        db: Database session
        user_id: User who made the request
        request_type: Type of request (sourcing, quoting, shipping)
        matches: Raw matches array (each with id/name/score) - used to compute top_matches
        num_matches_ge_80: Number of matches with score >= 80% (computed from matches if not provided)
        total_matches: Total number of matches found (computed from matches if not provided)
        top_match_score: Score of the best match (0-1) (computed from matches if not provided)
        top_matches: Pre-computed top matches (if not provided, computed from matches)
        latency_ms: Processing time in milliseconds
        model: AI model used
        model_version: Version of the AI model
        input_payload: Sanitized input data (no secrets/PII)
        output_summary: Short text summary for list view
        reasoning: Full chain-of-reasoning/audit trail
        status: success/error
        error_message: Error details if status is error
        request_id: External trace ID if available
        tenant_id: Tenant ID for multi-tenancy
    """
    # Compute metrics from matches if not provided
    m = matches or []
    
    # Normalize scores to 0..1
    def normalize_score(x):
        v = x.get("score", 0) or 0
        return v / 100 if v > 1 else v
    
    # Sort matches by score (descending)
    sorted_matches = sorted(m, key=lambda x: normalize_score(x), reverse=True)
    
    # Compute top 5 matches
    if top_matches is None:
        top_matches = [
            {
                "id": x.get("id"),
                "name": x.get("name") or x.get("title") or x.get("factory_name"),
                "score": round(normalize_score(x), 6)
            }
            for x in sorted_matches[:5]
        ]
    
    # Compute other metrics if not provided
    if top_match_score is None:
        top_match_score = top_matches[0]["score"] if top_matches else None
    
    if total_matches is None:
        total_matches = len(m) if m else None
    
    if num_matches_ge_80 is None:
        num_matches_ge_80 = sum(1 for x in m if normalize_score(x) >= 0.8)
    
    payload = AlgoOutputCreate(
        user_id=user_id,
        tenant_id=tenant_id,
        request_type=request_type,
        request_id=request_id,
        model=model,
        model_version=model_version,
        num_matches_ge_80=num_matches_ge_80,
        total_matches=total_matches,
        top_match_score=top_match_score,
        top_matches=top_matches,
        latency_ms=latency_ms,
        status=status,
        error_message=error_message,
        input_payload=input_payload,
        output_summary=output_summary,
        reasoning=reasoning,
    )
    return ingest_algo_output(payload, db)


def sanitize_input_payload(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Sanitize input payload to remove sensitive information.
    
    Args:
        payload: Raw input payload
        
    Returns:
        Sanitized payload safe for storage
    """
    # Remove common sensitive fields
    sensitive_fields = {
        'password', 'token', 'secret', 'key', 'api_key', 'access_token',
        'refresh_token', 'private_key', 'credit_card', 'ssn', 'social_security'
    }
    
    def sanitize_dict(obj):
        if isinstance(obj, dict):
            return {
                k: sanitize_dict(v) 
                for k, v in obj.items() 
                if k.lower() not in sensitive_fields
            }
        elif isinstance(obj, list):
            return [sanitize_dict(item) for item in obj]
        else:
            return obj
    
    return sanitize_dict(payload)


def create_reasoning_trail(
    steps: List[Dict[str, Any]],
    tool_calls: List[Dict[str, Any]] = None,
    scores: List[float] = None,
    metadata: Dict[str, Any] = None
) -> Dict[str, Any]:
    """
    Create a structured reasoning trail for algorithm outputs.
    
    Args:
        steps: List of reasoning steps
        tool_calls: List of tool calls made
        scores: List of scores for each step
        metadata: Additional metadata
        
    Returns:
        Structured reasoning trail
    """
    return {
        "steps": steps,
        "tool_calls": tool_calls or [],
        "scores": scores or [],
        "metadata": metadata or {},
        "timestamp": time.time(),
        "version": "1.0"
    }


# Example usage functions for different request types

def record_search_output(
    db: Session,
    user_id: str,
    query: str,
    filters: Dict[str, Any],
    matches: List[Dict[str, Any]],
    reasoning_steps: List[Dict[str, Any]],
    model: str = "gpt-4",
    model_version: str = "latest",
    latency_ms: int = None,
    tenant_id: str = None
):
    """Record search algorithm output."""
    sanitized_input = sanitize_input_payload({
        "query": query,
        "filters": filters,
        "timestamp": time.time()
    })
    
    reasoning = create_reasoning_trail(
        steps=reasoning_steps,
        scores=[m.get("score", 0) for m in matches],
        metadata={"query_type": "search", "num_filters": len(filters)}
    )
    
    # Compute top score for summary
    top_score = max((m.get("score") or 0) for m in matches) if matches else None
    
    return record_algo_output(
        db=db,
        user_id=user_id,
        request_type=RequestType.sourcing,
        matches=matches,  # Pass raw matches to compute top_matches
        latency_ms=latency_ms,
        model=model,
        model_version=model_version,
        input_payload=sanitized_input,
        output_summary=f"{len(matches)} matches; top {round((top_score or 0)*100)}%",
        reasoning=reasoning,
        tenant_id=tenant_id
    )


def record_quote_output(
    db: Session,
    user_id: str,
    quote_request: Dict[str, Any],
    quote_result: Dict[str, Any],
    reasoning_steps: List[Dict[str, Any]],
    model: str = "gpt-4",
    model_version: str = "latest",
    latency_ms: int = None,
    tenant_id: str = None
):
    """Record quote algorithm output."""
    sanitized_input = sanitize_input_payload(quote_request)
    
    reasoning = create_reasoning_trail(
        steps=reasoning_steps,
        metadata={"quote_type": "pricing", "currency": quote_result.get("currency", "USD")}
    )
    
    # Create a single "match" for quote results
    quote_match = {
        "id": "quote_result",
        "name": f"Quote for {quote_request.get('product', 'product')}",
        "score": 1.0 if quote_result.get("success") else 0.0
    }
    
    return record_algo_output(
        db=db,
        user_id=user_id,
        request_type=RequestType.quoting,
        matches=[quote_match],  # Pass as single match
        latency_ms=latency_ms,
        model=model,
        model_version=model_version,
        input_payload=sanitized_input,
        output_summary=f"Quote: {quote_result.get('total_cost', 'N/A')} {quote_result.get('currency', 'USD')}",
        reasoning=reasoning,
        tenant_id=tenant_id
    )


def record_logistics_output(
    db: Session,
    user_id: str,
    route_request: Dict[str, Any],
    route_result: Dict[str, Any],
    reasoning_steps: List[Dict[str, Any]],
    model: str = "gpt-4",
    model_version: str = "latest",
    latency_ms: int = None,
    tenant_id: str = None
):
    """Record logistics algorithm output."""
    sanitized_input = sanitize_input_payload(route_request)
    
    reasoning = create_reasoning_trail(
        steps=reasoning_steps,
        metadata={"route_type": "shipping", "distance_km": route_result.get("distance_km")}
    )
    
    # Create a single "match" for route results
    route_match = {
        "id": "route_result",
        "name": f"Route from {route_request.get('origin', 'origin')} to {route_request.get('destination', 'destination')}",
        "score": 1.0 if route_result.get("success") else 0.0
    }
    
    return record_algo_output(
        db=db,
        user_id=user_id,
        request_type=RequestType.shipping,
        matches=[route_match],  # Pass as single match
        latency_ms=latency_ms,
        model=model,
        model_version=model_version,
        input_payload=sanitized_input,
        output_summary=f"Route: {route_result.get('duration_days', 'N/A')} days, {route_result.get('cost', 'N/A')}",
        reasoning=reasoning,
        tenant_id=tenant_id
    )
