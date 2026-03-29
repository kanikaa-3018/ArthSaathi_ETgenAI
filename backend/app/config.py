"""
ArthSaathi application settings sourced from environment variables / .env file.
"""
from pathlib import Path
from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict

# Always load backend/.env even if uvicorn is started from the repo root.
_BACKEND_ROOT = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(_BACKEND_ROOT / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

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

    # Auth
    AUTH_TOKEN_TTL_SECONDS: int = 7 * 24 * 60 * 60  # 1 week
    # Supabase — same project URL as frontend (VITE_SUPABASE_URL); required for ECC (ES256) JWT verification
    SUPABASE_URL: Optional[str] = None
    # Supabase anon key — used for /auth/v1/user fallback token validation.
    SUPABASE_ANON_KEY: Optional[str] = None
    # Legacy HS256 — Dashboard → API → JWT signing / shared secret (NOT the anon key)
    SUPABASE_JWT_SECRET: Optional[str] = None

    def validate_auth_config(self) -> str:
        """Return warning/help message if auth not properly configured."""
        if not self.SUPABASE_URL and not self.SUPABASE_JWT_SECRET:
            return (
                "⚠️  AUTH CONFIG: Neither SUPABASE_URL nor SUPABASE_JWT_SECRET set. "
                "Google OAuth and manual register/login will not validate Supabase JWTs. "
                "Set SUPABASE_URL (from Supabase dashboard) and optionally SUPABASE_JWT_SECRET."
            )
        if self.SUPABASE_URL and not self.SUPABASE_JWT_SECRET:
            return (
                "ℹ️  AUTH CONFIG: Using ES256 (JWKS from SUPABASE_URL). "
                "If you need HS256 support, also set SUPABASE_JWT_SECRET."
            )
        return ""


settings = Settings()
