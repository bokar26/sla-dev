from __future__ import annotations
import asyncio
from openai import OpenAI
from ..core.settings import settings

# Initialize client only if API key is available
_openai_api_key = getattr(settings, 'OPENAI_API_KEY', None)
_client = OpenAI(api_key=_openai_api_key) if _openai_api_key else None

def _respond_sync(model: str, messages_or_input):
    if not _client:
        raise Exception("OpenAI API key not configured")
    # Prefer the Responses API (input = list of role/content objects or plain string)
    return _client.responses.create(model=model, input=messages_or_input)

async def respond(model: str, messages_or_input):
    if not _client:
        raise Exception("OpenAI API key not configured")
    return await asyncio.to_thread(_respond_sync, model, messages_or_input)

def output_text(resp) -> str:
    return getattr(resp, "output_text", str(resp))