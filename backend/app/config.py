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
    # Model IDs are vendor-specific strings — override if your API account uses different names.
    ANTHROPIC_MODEL: str = "claude-sonnet-4-20250514"
    OPENAI_CHAT_MODEL: str = "gpt-4o"
    GEMINI_CHAT_MODEL: str = "gemini-2.0-flash"

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