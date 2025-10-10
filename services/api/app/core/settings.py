from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    OPENAI_API_KEY: str | None = Field(default=None)
    OPENAI_MODEL: str = Field(default="gpt-4o-mini")  # change to gpt-5 if your account has access

    TAVILY_API_KEY: str | None = Field(default=None)
    SERPER_API_KEY: str | None = Field(default=None)
    BING_SEARCH_KEY: str | None = Field(default=None)

    REQUEST_TIMEOUT_S: float = 22.0

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()