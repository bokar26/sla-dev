import os
from functools import lru_cache
from pydantic import BaseModel, AnyHttpUrl, ValidationError
from typing import Optional

class AlibabaOAuthConfig(BaseModel):
    client_id: str
    client_secret: str
    redirect_uri: Optional[AnyHttpUrl] = None
    auth_base: AnyHttpUrl = "https://signin.alibabacloud.com"
    token_base: AnyHttpUrl = "https://oauth.alibabacloud.com"
    scope: str = "openid"

@lru_cache()
def get_alibaba_oauth_config() -> AlibabaOAuthConfig:
    cid = os.getenv("ALIBABA_CLIENT_ID")
    csec = os.getenv("ALIBABA_CLIENT_SECRET")
    ruri = os.getenv("ALIBABA_REDIRECT_URI")  # may be None (we compute later for dev)
    auth_base = os.getenv("ALIBABA_AUTH_BASE", "https://signin.alibabacloud.com")
    token_base = os.getenv("ALIBABA_TOKEN_BASE", "https://oauth.alibabacloud.com")
    scope = os.getenv("ALIBABA_OAUTH_SCOPE", "openid")

    if not cid or not csec:
        raise RuntimeError("Missing ALIBABA_CLIENT_ID or ALIBABA_CLIENT_SECRET")

    try:
        return AlibabaOAuthConfig(
            client_id=cid,
            client_secret=csec,
            redirect_uri=ruri,
            auth_base=auth_base,
            token_base=token_base,
            scope=scope,
        )
    except ValidationError as e:
        # Usually invalid URL formatting
        raise RuntimeError(f"Alibaba OAuth config invalid: {e}")
