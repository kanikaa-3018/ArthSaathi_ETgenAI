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

/** Sync read from localStorage — can lag right after OAuth redirect; prefer getAccessToken for API calls. */
export function getToken(): string | null {
  const url = import.meta.env.VITE_SUPABASE_URL || "";
  if (!url) return null;
  const key = storageKeyForSupabaseUrl(url);
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { access_token?: string };
    return parsed?.access_token ?? null;
  } catch {
    return null;
  }
}

/** Session from Supabase client (matches OAuth callback timing). */
export async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? getToken();
}

export function isAuthenticated(): boolean {
  return Boolean(getToken());
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
