from functools import lru_cache
from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str
    DATABASE_URL: str

    GITHUB_CLIENT_ID: str
    GITHUB_CLIENT_SECRET: str
    GITHUB_WEBHOOK_SECRET: str
    GITHUB_APP_ID: str
    GITHUB_APP_SLUG: str = "veltro-dev"
    GITHUB_PRIVATE_KEY: str

    CLAUDE_API_KEY: str
    SECRET_KEY: str
    ENCRYPTION_KEY: str
    GEMINI_API_KEY: Optional[str] = None

    JWT_ALGORITHM: str
    ENVIRONMENT: str
    FRONTEND_URL: str

    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    COOKIE_PATH_PREFIX: str = "/api"

    model_config = {
        "env_file": ".env",
        "extra": "ignore"
    }


@lru_cache
def get_settings():
    return Settings()