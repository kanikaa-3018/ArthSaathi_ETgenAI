"""
User settings and profile management.
"""
import time
from typing import Any, Dict, Optional

from pydantic import BaseModel, Field, EmailStr

from app.auth import (
    _verify_password,
    _hash_password,
    _load_users,
    _save_users,
)


def _default_preferences() -> Dict[str, Any]:
    return {
        "email_notifications": True,
        "portfolio_updates": True,
        "tax_insights": True,
        "market_alerts": False,
        "theme": "dark",
        "currency": "INR",
    }


def _find_user_record(users: list[Dict[str, Any]], username: str, email: str = "") -> Optional[Dict[str, Any]]:
    for user in users:
        if user.get("username") == username:
            return user
    if email:
        for user in users:
            if (user.get("email") or "").strip().lower() == email.strip().lower():
                return user
    return None


def _get_or_create_user_record(username: str, email: str = "") -> Dict[str, Any]:
    users = _load_users()
    user = _find_user_record(users, username, email)
    if user:
        return user

    now = int(time.time())
    safe_username = (username or (email.split("@")[0] if email and "@" in email else "user")).strip() or "user"
    safe_email = (email or "").strip()
    new_user = {
        "username": safe_username,
        "email": safe_email,
        "full_name": safe_username,
        "avatar_url": "",
        "created_at": now,
        "updated_at": now,
        "preferences": _default_preferences(),
    }
    users.append(new_user)
    _save_users(users)
    return new_user


class UserProfile(BaseModel):
    """User profile response."""

    username: str
    email: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: int
    updated_at: int


class UpdateProfileRequest(BaseModel):
    """Update user profile."""

    full_name: Optional[str] = Field(None, min_length=1, max_length=100)
    avatar_url: Optional[str] = Field(None, max_length=500)


class ChangePasswordRequest(BaseModel):
    """Change password."""

    current_password: str = Field(..., min_length=8, max_length=128)
    new_password: str = Field(..., min_length=8, max_length=128)
    confirm_password: str = Field(..., min_length=8, max_length=128)


class UpdatePreferencesRequest(BaseModel):
    """User preferences."""

    email_notifications: bool = True
    portfolio_updates: bool = True
    tax_insights: bool = True
    market_alerts: bool = False
    theme: str = Field("dark", pattern="^(light|dark)$")
    currency: str = Field("INR", pattern="^[A-Z]{3}$")


class UserPreferences(BaseModel):
    """User preferences response."""

    email_notifications: bool
    portfolio_updates: bool
    tax_insights: bool
    market_alerts: bool
    theme: str
    currency: str


class UserSettings(BaseModel):
    """Full user settings."""

    profile: UserProfile
    preferences: UserPreferences


def get_user_profile(username: str, email: str = "") -> UserProfile:
    """Get user profile by username."""
    user = _get_or_create_user_record(username, email)

    return UserProfile(
        username=user.get("username", ""),
        email=user.get("email", ""),
        full_name=user.get("full_name"),
        avatar_url=user.get("avatar_url"),
        created_at=user.get("created_at", int(time.time())),
        updated_at=user.get("updated_at", user.get("created_at", int(time.time()))),
    )


def update_user_profile(username: str, data: UpdateProfileRequest, email: str = "") -> UserProfile:
    """Update user profile."""
    users = _load_users()
    user = _find_user_record(users, username, email)

    if not user:
        now = int(time.time())
        safe_username = (username or (email.split("@")[0] if email and "@" in email else "user")).strip() or "user"
        safe_email = (email or "").strip()
        user = {
            "username": safe_username,
            "email": safe_email,
            "full_name": safe_username,
            "avatar_url": "",
            "created_at": now,
            "updated_at": now,
            "preferences": _default_preferences(),
        }
        users.append(user)

    if data.full_name is not None:
        user["full_name"] = data.full_name.strip()
    if data.avatar_url is not None:
        user["avatar_url"] = data.avatar_url.strip()

    user["updated_at"] = int(time.time())
    _save_users(users)

    return UserProfile(
        username=user.get("username", ""),
        email=user.get("email", ""),
        full_name=user.get("full_name"),
        avatar_url=user.get("avatar_url"),
        created_at=user.get("created_at", int(time.time())),
        updated_at=user.get("updated_at", int(time.time())),
    )


def change_password(username: str, current_password: str, new_password: str, email: str = "") -> bool:
    """Change user password."""
    users = _load_users()
    user = None

    user = _find_user_record(users, username, email)

    if not user:
        raise ValueError("User not found")

    if not user.get("password_hash") or not user.get("password_salt"):
        raise ValueError("Password change is only available for local accounts")

    # Verify current password
    if not _verify_password(
        current_password,
        user.get("password_salt", ""),
        user.get("password_hash", ""),
    ):
        raise ValueError("Current password is incorrect")

    # Hash new password
    pw_hash = _hash_password(new_password)
    user["password_hash"] = pw_hash["hash"]
    user["password_salt"] = pw_hash["salt"]
    user["updated_at"] = int(time.time())

    _save_users(users)
    return True


def get_user_preferences(username: str, email: str = "") -> UserPreferences:
    """Get user preferences."""
    user = _get_or_create_user_record(username, email)

    prefs = user.get("preferences", {})
    return UserPreferences(
        email_notifications=prefs.get("email_notifications", True),
        portfolio_updates=prefs.get("portfolio_updates", True),
        tax_insights=prefs.get("tax_insights", True),
        market_alerts=prefs.get("market_alerts", False),
        theme=prefs.get("theme", "dark"),
        currency=prefs.get("currency", "INR"),
    )


def update_user_preferences(
    username: str, data: UpdatePreferencesRequest, email: str = ""
) -> UserPreferences:
    """Update user preferences."""
    users = _load_users()
    user = None

    user = _find_user_record(users, username, email)

    if not user:
        now = int(time.time())
        safe_username = (username or (email.split("@")[0] if email and "@" in email else "user")).strip() or "user"
        safe_email = (email or "").strip()
        user = {
            "username": safe_username,
            "email": safe_email,
            "full_name": safe_username,
            "avatar_url": "",
            "created_at": now,
            "updated_at": now,
            "preferences": _default_preferences(),
        }
        users.append(user)

    user["preferences"] = {
        "email_notifications": data.email_notifications,
        "portfolio_updates": data.portfolio_updates,
        "tax_insights": data.tax_insights,
        "market_alerts": data.market_alerts,
        "theme": data.theme,
        "currency": data.currency,
    }
    user["updated_at"] = int(time.time())

    _save_users(users)

    return UserPreferences(
        email_notifications=data.email_notifications,
        portfolio_updates=data.portfolio_updates,
        tax_insights=data.tax_insights,
        market_alerts=data.market_alerts,
        theme=data.theme,
        currency=data.currency,
    )
