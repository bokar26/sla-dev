from typing import Protocol, List, Dict, Any, TypedDict, Optional

class ChatResult(TypedDict, total=False):
    text: str
    model_used: str
    request_id: str | None
    usage: dict | None
    raw: Any

class LLM(Protocol):
    def chat(self,
             messages: List[Dict[str, str]],
             *,
             temperature: float = 0.2,
             tools: Optional[List[Dict[str, Any]]] = None) -> ChatResult: ...
