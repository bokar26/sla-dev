import os
from functools import lru_cache
from pydantic import BaseModel, AnyHttpUrl

class AlibabaB2BConfig(BaseModel):
    auth_url: AnyHttpUrl
    token_url: AnyHttpUrl
    api_base: AnyHttpUrl
    client_id: str
    client_secret: str
    scope: str
    redirect_uri: AnyHttpUrl

@lru_cache()
def get_b2b_cfg() -> AlibabaB2BConfig:
    """Get Alibaba B2B Open Platform configuration with strict validation."""
    auth_url = os.getenv("ALIBABA_B2B_AUTH_URL")
    token_url = os.getenv("ALIBABA_B2B_TOKEN_URL")
    api_base = os.getenv("ALIBABA_B2B_API_BASE")
    client_id = os.getenv("ALIBABA_B2B_CLIENT_ID")
    client_secret = os.getenv("ALIBABA_B2B_CLIENT_SECRET")
    scope = os.getenv("ALIBABA_B2B_SCOPE", "read:orders read:logistics read:suppliers")
    redirect_uri = os.getenv("ALIBABA_B2B_REDIRECT_URI")
    
    # Validate required fields
    if not all([auth_url, token_url, api_base, client_id, client_secret, redirect_uri]):
        missing = []
        if not auth_url: missing.append("ALIBABA_B2B_AUTH_URL")
        if not token_url: missing.append("ALIBABA_B2B_TOKEN_URL")
        if not api_base: missing.append("ALIBABA_B2B_API_BASE")
        if not client_id: missing.append("ALIBABA_B2B_CLIENT_ID")
        if not client_secret: missing.append("ALIBABA_B2B_CLIENT_SECRET")
        if not redirect_uri: missing.append("ALIBABA_B2B_REDIRECT_URI")
        raise RuntimeError(f"Missing required Alibaba B2B environment variables: {', '.join(missing)}")
    
    # Hard block obvious placeholders
    if any(placeholder in client_id.lower() for placeholder in ["test", "mock", "12345", "your_", "placeholder"]):
        raise RuntimeError("Alibaba B2B client_id is a placeholder. Configure real app credentials from Alibaba Open Platform console.")
    
    if any(placeholder in client_secret.lower() for placeholder in ["test", "mock", "67890", "your_", "placeholder"]):
        raise RuntimeError("Alibaba B2B client_secret is a placeholder. Configure real app credentials from Alibaba Open Platform console.")
    
    try:
        cfg = AlibabaB2BConfig(
            auth_url=auth_url,
            token_url=token_url,
            api_base=api_base,
            client_id=client_id,
            client_secret=client_secret,
            scope=scope,
            redirect_uri=redirect_uri,
        )
        return cfg
    except Exception as e:
        raise RuntimeError(f"Invalid Alibaba B2B configuration: {e}")
