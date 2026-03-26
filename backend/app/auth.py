import json
import os
import hashlib
import hmac
import secrets
import time
from typing import Any, Dict, List, Optional

from app.config import settings

USERS_FILE = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "users.json"))

# In-memory active access tokens (expires in runtime)
_active_tokens: Dict[str, Dict[str, Any]] = {}


def _ensure_file_exists() -> None:
    if not os.path.exists(USERS_FILE):
        with open(USERS_FILE, "w", encoding="utf-8") as f:
            json.dump([], f)


def _load_users() -> List[Dict[str, Any]]:
    _ensure_file_exists()
    with open(USERS_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def _save_users(users: List[Dict[str, Any]]) -> None:
    with open(USERS_FILE, "w", encoding="utf-8") as f:
        json.dump(users, f, indent=2, ensure_ascii=False)


def _hash_password(password: str, salt: Optional[str] = None) -> Dict[str, str]:
    if salt is None:
        salt = secrets.token_hex(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 180000)
    return {"salt": salt, "hash": dk.hex()}


def _verify_password(password: str, salt: str, expected_hash: str) -> bool:
    candidate = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 180000).hex()
    return hmac.compare_digest(candidate, expected_hash)


def _find_user(username: str) -> Optional[Dict[str, Any]]:
    users = _load_users()
    for user in users:
        if user.get("username") == username:
            return user
    return None


def _find_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    users = _load_users()
    for user in users:
        if user.get("email") == email:
            return user
    return None


def register_user(username: str, email: str, password: str) -> Dict[str, Any]:
    username = username.strip().lower()
    email = email.strip().lower()

    if not username or not email or not password:
        raise ValueError("username, email, and password are required")

    if _find_user(username) is not None:
        raise ValueError("username already registered")

    if _find_user_by_email(email) is not None:
        raise ValueError("email already registered")

    if len(password) < 8:
        raise ValueError("password must be at least 8 characters")

    ph = _hash_password(password)
    user = {
        "username": username,
        "email": email,
        "password_hash": ph["hash"],
        "password_salt": ph["salt"],
        "created_at": int(time.time()),
    }

    users = _load_users()
    users.append(user)
    _save_users(users)

    return {"username": username, "email": email}


def authenticate_user(username: str, password: str) -> Optional[Dict[str, Any]]:
    username = username.strip().lower()
    user = _find_user(username)
    if user is None:
        return None
    if _verify_password(password, user.get("password_salt", ""), user.get("password_hash", "")):
        return user
    return None


def create_access_token(username: str) -> str:
    token = secrets.token_urlsafe(32)
    _active_tokens[token] = {
        "username": username.strip().lower(),
        "expires_at": int(time.time()) + settings.AUTH_TOKEN_TTL_SECONDS,
    }
    return token


def get_user_from_token(token: str) -> Optional[Dict[str, Any]]:
    data = _active_tokens.get(token)
    if not data:
        return None
    if data.get("expires_at", 0) < int(time.time()):
        del _active_tokens[token]
        return None
    return _find_user(data["username"])


def revoke_token(token: str) -> None:
    _active_tokens.pop(token, None)
