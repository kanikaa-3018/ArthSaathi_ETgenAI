"""
ArthSaathi application settings sourced from environment variables / .env file.
"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Runtime
    ENV: str = "development"

    # CORS
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:8080,http://localhost:3000,http://localhost:80"

    # LLM providers (first set key wins)
    ANTHROPIC_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None
    GOOGLE_API_KEY: Optional[str] = None

    # NAV cache
    NAV_CACHE_TTL_HOURS: int = 6
    NAV_CACHE_DIR: str = "./cache"

    # Upload limits
    MAX_FILE_SIZE_MB: int = 10

    # App metadata
    APP_VERSION: str = "1.0.0"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()