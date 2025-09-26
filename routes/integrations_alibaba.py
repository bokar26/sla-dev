from fastapi import APIRouter, HTTPException, Query, Response, Depends, Request
from pydantic import BaseModel
import os, secrets, urllib.parse
from typing import Optional

router = APIRouter(tags=["integrations:alibaba"])

# ----- helpers (env) -----
def _env(name: str, default: str | None = None) -> str:
    val = os.environ.get(name, default or "")
    return val

def _must(name: str) -> str:
    val = os.environ.get(name)
    if not val:
        raise RuntimeError(f"{name} not set")
    return val

def _api_prefix() -> str:
    p = _env("API_PREFIX", "/api").rstrip("/")
    return p if p else ""

def _public_api_base() -> str:
    return _env("PUBLIC_API_BASE_URL", "http://localhost:8000").rstrip("/")

def _public_web_base() -> str:
    return _env("PUBLIC_WEB_BASE_URL", "http://localhost:5173").rstrip("/")

def _auth_base() -> str:
    # Put your real Alibaba authorize URL here via env
    return _env("ALIBABA_AUTHORIZE_URL", "https://example.alibaba.com/oauth/authorize").rstrip("/")

def _redirect_uri() -> str:
    # must match provider config
    return _env("ALIBABA_REDIRECT_URI", f"{_public_api_base()}{_api_prefix()}/integrations/alibaba/callback")

# ----- schemas -----
class Status(BaseModel):
    connected: bool
    account_name: Optional[str] = None
    updated_at: Optional[str] = None

class ProviderConfig(BaseModel):
    authorize_base: str
    client_id_public: Optional[str] = None
    redirect_uri: str
    scope: str

class OAuthUrlResponse(BaseModel):
    url: str
    state: str

# ----- endpoints -----
@router.get("/integrations/alibaba/status", response_model=Status)
def alibaba_status():
    # TODO: return real status from DB; stubbed OK to stop 404s
    return {"connected": False, "account_name": None, "updated_at": None}

@router.get("/integrations/alibaba/provider-config", response_model=ProviderConfig)
def alibaba_provider_config():
    return {
        "authorize_base": _auth_base(),
        "client_id_public": _env("ALIBABA_CLIENT_ID", ""),
        "redirect_uri": _redirect_uri(),
        "scope": _env("ALIBABA_SCOPE", "read"),
    }

@router.get("/integrations/alibaba/oauth-url", response_model=OAuthUrlResponse)
def alibaba_oauth_url(state: Optional[str] = Query(default=None)):
    try:
        client_id = _must("ALIBABA_CLIENT_ID")
        scope = _env("ALIBABA_SCOPE", "read")
        redirect = _redirect_uri()
        st = state or "ali_" + secrets.token_urlsafe(24)
        qs = {
            "client_id": client_id,
            "redirect_uri": redirect,
            "response_type": "code",
            "scope": scope,
            "state": st,
        }
        url = f"{_auth_base()}?{urllib.parse.urlencode(qs)}"
        return {"url": url, "state": st}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"oauth-url error: {e}")

@router.get("/integrations/alibaba/callback")
def alibaba_callback(request: Request, code: Optional[str] = None, state: Optional[str] = None):
    # TODO: exchange code->token & persist
    from fastapi.responses import RedirectResponse
    # on success/failure redirect back to web
    if not code:
        return RedirectResponse(f"{_public_web_base()}/integrations?alibaba=error")
    return RedirectResponse(f"{_public_web_base()}/integrations?alibaba=connected")

@router.get("/integrations/ping")
def integrations_ping():
    return {"ok": True, "provider": "alibaba"}
