import { api } from "@/lib/api";

const ACCESS_TOKEN_KEY = "arthsaathi_access_token";

export function getToken(): string | null {
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setToken(token: string): void {
  window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function clearToken(): void {
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return Boolean(getToken());
}

export function authHeaders(): HeadersInit {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function register(
  username: string,
  email: string,
  password: string,
) {
  const response = await fetch(api.authRegister, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.detail || "Registration failed");
  }

  if (!payload.access_token) {
    throw new Error("Registration succeeded but no token received.");
  }

  setToken(payload.access_token);
  return payload;
}

export async function login(username: string, password: string) {
  const response = await fetch(api.authLogin, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.detail || "Login failed");
  }

  if (!payload.access_token) {
    throw new Error("Login succeeded but no token received.");
  }

  setToken(payload.access_token);
  return payload;
}

export async function fetchMe() {
  const response = await fetch(api.authMe, {
    headers: { ...authHeaders(), "Content-Type": "application/json" },
  });
  if (!response.ok) {
    throw new Error("Could not fetch user profile");
  }
  return response.json();
}
