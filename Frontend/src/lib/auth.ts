/**
 * API auth: send the Supabase session access_token as Bearer; the FastAPI app validates it
 * (HS256 + SUPABASE_JWT_SECRET and/or ES256 JWKS + SUPABASE_URL — see backend/app/auth.py).
 */
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

function storageKeyForSupabaseUrl(url: string): string {
  try {
    const host = new URL(url).hostname.split(".")[0];
    return `sb-${host}-auth-token`;
  } catch {
    const projectRef = url.replace(/^https?:\/\//, "").split(".")[0];
    return `sb-${projectRef}-auth-token`;
  }
}

function extractAccessToken(raw: string): string | null {
  try {
    const parsed = JSON.parse(raw) as
      | { access_token?: string; currentSession?: { access_token?: string } }
      | Array<{ access_token?: string; currentSession?: { access_token?: string } }>
      | null;

    if (!parsed) return null;
    if (Array.isArray(parsed)) {
      for (const item of parsed) {
        const token =
          item?.access_token || item?.currentSession?.access_token || null;
        if (token) return token;
      }
      return null;
    }
    return parsed.access_token || parsed.currentSession?.access_token || null;
  } catch {
    return null;
  }
}

function isJwtExpired(token: string): boolean {
  const parts = token.split(".");
  if (parts.length !== 3) return false; // Opaque tokens: cannot decode expiry here.
  try {
    const payload = JSON.parse(atob(parts[1])) as { exp?: number };
    if (!payload.exp) return false;
    const now = Math.floor(Date.now() / 1000);
    return payload.exp <= now;
  } catch {
    return false;
  }
}

/** Sync read from localStorage — can lag right after OAuth redirect; prefer getAccessToken for API calls. */
export function getToken(): string | null {
  const url = import.meta.env.VITE_SUPABASE_URL || "";
  if (!url) return null;
  const key = storageKeyForSupabaseUrl(url);
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return extractAccessToken(raw);
  } catch {
    return null;
  }
}

/** Session from Supabase client (matches OAuth callback timing). */
export async function getAccessToken(): Promise<string | null> {
  // Prefer Supabase session APIs so refresh logic can run before we trust storage.
  const { data } = await supabase.auth.getSession();
  if (data.session?.access_token) return data.session.access_token;

  const { data: refreshed } = await supabase.auth.refreshSession();
  if (refreshed.session?.access_token) return refreshed.session.access_token;

  const fallback = getToken();
  if (fallback && !isJwtExpired(fallback)) return fallback;

  // OAuth/session hydration can be slightly delayed on first load.
  for (let i = 0; i < 5; i += 1) {
    await new Promise((resolve) => window.setTimeout(resolve, 250));
    const retryToken = getToken();
    if (retryToken && !isJwtExpired(retryToken)) return retryToken;
    const { data: retryData } = await supabase.auth.getSession();
    if (retryData.session?.access_token) return retryData.session.access_token;
  }

  return null;
}

export function isAuthenticated(): boolean {
  const token = getToken();
  if (!token) return false;
  return !isJwtExpired(token);
}

export function authHeaders(): HeadersInit {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function register(email: string, password: string, name?: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: name || email.split("@")[0] } },
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function login(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw new Error(error.message);
  if (!data.session?.access_token) {
    throw new Error("Login succeeded but no session was created. Please verify your email and try again.");
  }
  return data;
}

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${window.location.origin}/auth/callback` },
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function getUser(): Promise<User | null> {
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export async function fetchMe() {
  const user = await getUser();
  if (!user) throw new Error("Not authenticated");
  return {
    email: user.email || "",
    username:
      (user.user_metadata?.full_name as string | undefined) ||
      user.email?.split("@")[0] ||
      "",
    id: user.id,
  };
}

export async function signOut() {
  await supabase.auth.signOut();
}

export function clearToken() {
  void supabase.auth.signOut();
}

export function setToken(_token: string) {
  // No-op: Supabase manages tokens internally via localStorage
}
