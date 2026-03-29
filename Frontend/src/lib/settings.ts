import type { User } from "@supabase/supabase-js";
import { getAccessToken, getUser } from "./auth";

const PROFILE_UPDATED = "arthsaathi:profile-updated";

function notifyProfileUpdated(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(PROFILE_UPDATED));
  }
}

/** Subscribe to profile changes (e.g. after Settings save). Returns unsubscribe. */
export function onProfileUpdated(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(PROFILE_UPDATED, callback);
  return () => window.removeEventListener(PROFILE_UPDATED, callback);
}

const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

function getApiBases(): string[] {
  return [API_BASE];
}

async function fetchSettingsPath(path: string, init: RequestInit): Promise<Response> {
  let lastResponse: Response | null = null;
  for (const base of getApiBases()) {
    const res = await fetch(`${base}${path}`, init);
    if (res.status !== 404) return res;
    lastResponse = res;
  }
  return lastResponse ?? new Response(null, { status: 404, statusText: "Not Found" });
}

async function getAuthMe(headers?: HeadersInit): Promise<{ username: string; email: string }> {
  const authHeaders = headers ?? (await getHeaders());
  const res = await fetchSettingsPath(`/api/auth/me`, { method: "GET", headers: authHeaders });
  if (!res.ok) throw new Error(`Failed to fetch user: ${res.statusText}`);
  return res.json();
}

function defaultPreferences(): UserPreferences {
  return {
    email_notifications: true,
    portfolio_updates: true,
    tax_insights: true,
    market_alerts: false,
    theme: "dark",
    currency: "INR",
  };
}

export interface UserProfile {
  username: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: number;
  updated_at: number;
  /** From API: false for OAuth-only accounts (no local password in backend). */
  can_change_password?: boolean;
}

export interface UserPreferences {
  email_notifications: boolean;
  portfolio_updates: boolean;
  tax_insights: boolean;
  market_alerts: boolean;
  theme: "light" | "dark";
  currency: string;
}

export interface UserSettings {
  profile: UserProfile;
  preferences: UserPreferences;
}

function storageKey(email: string): string {
  return `arthsaathi-settings-${email.toLowerCase()}`;
}

function readLocalSettings(email: string, username: string): UserSettings {
  const now = Math.floor(Date.now() / 1000);
  const defaults: UserSettings = {
    profile: {
      username,
      email,
      full_name: username,
      avatar_url: undefined,
      created_at: now,
      updated_at: now,
    },
    preferences: defaultPreferences(),
  };

  try {
    const raw = window.localStorage.getItem(storageKey(email));
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<UserSettings>;
    return {
      profile: {
        ...defaults.profile,
        ...(parsed.profile || {}),
      },
      preferences: {
        ...defaults.preferences,
        ...(parsed.preferences || {}),
      },
    };
  } catch {
    return defaults;
  }
}

function writeLocalSettings(email: string, settings: UserSettings): void {
  try {
    window.localStorage.setItem(storageKey(email), JSON.stringify(settings));
  } catch {
    // Ignore storage failures.
  }
}

async function getHeaders(): Promise<HeadersInit> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error("Session expired. Please sign in again.");
  }
  return { Authorization: `Bearer ${token}` };
}

async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.json() as { detail?: unknown; message?: unknown };
    if (typeof data.detail === "string" && data.detail.trim()) return data.detail;
    if (typeof data.message === "string" && data.message.trim()) return data.message;
    if (data.detail && typeof data.detail === "object") {
      return JSON.stringify(data.detail);
    }
  } catch {
    // Ignore JSON parse errors.
  }
  return fallback;
}

export async function getUserProfile(): Promise<UserProfile> {
  const headers = await getHeaders();
  const me = await getAuthMe(headers);
  const local = readLocalSettings(me.email, me.username);
  const res = await fetchSettingsPath(`/api/settings/profile`, {
    method: "GET",
    headers,
  });
  if (res.ok) {
    const profile = (await res.json()) as UserProfile;
    writeLocalSettings(me.email, { ...local, profile });
    return profile;
  }
  if (res.status === 404) {
    return local.profile;
  }
  throw new Error(`Failed to fetch profile: ${res.statusText}`);
}

export async function updateUserProfile(data: {
  full_name?: string;
  avatar_url?: string;
}): Promise<UserProfile> {
  const headers = await getHeaders();
  const me = await getAuthMe(headers);
  const local = readLocalSettings(me.email, me.username);
  const payload: { full_name?: string; avatar_url?: string } = {};
  if (typeof data.full_name === "string") {
    const fullName = data.full_name.trim();
    if (fullName.length > 0) payload.full_name = fullName;
  }
  if (typeof data.avatar_url === "string") {
    const avatar = data.avatar_url.trim();
    if (avatar.length > 0) payload.avatar_url = avatar;
  }

  const res = await fetchSettingsPath(`/api/settings/profile`, {
    method: "PUT",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (res.ok) {
    const profile = (await res.json()) as UserProfile;
    writeLocalSettings(me.email, { ...local, profile });
    notifyProfileUpdated();
    return profile;
  }
  if (res.status === 404) {
    const profile: UserProfile = {
      ...local.profile,
      full_name:
        typeof data.full_name === "string"
          ? data.full_name.trim() || undefined
          : local.profile.full_name,
      avatar_url:
        typeof data.avatar_url === "string"
          ? data.avatar_url.trim() || undefined
          : local.profile.avatar_url,
      updated_at: Math.floor(Date.now() / 1000),
    };
    writeLocalSettings(me.email, { ...local, profile });
    notifyProfileUpdated();
    return profile;
  }
  throw new Error(await readErrorMessage(res, `Failed to update profile: ${res.statusText}`));
}

export async function getUserPreferences(): Promise<UserPreferences> {
  const headers = await getHeaders();
  const me = await getAuthMe(headers);
  const local = readLocalSettings(me.email, me.username);
  const res = await fetchSettingsPath(`/api/settings/preferences`, { method: "GET", headers });
  if (res.ok) {
    const preferences = (await res.json()) as UserPreferences;
    writeLocalSettings(me.email, { ...local, preferences });
    return preferences;
  }
  if (res.status === 404) {
    return local.preferences;
  }
  throw new Error(`Failed to fetch preferences: ${res.statusText}`);
}

export async function updateUserPreferences(
  data: Partial<UserPreferences>
): Promise<UserPreferences> {
  const headers = await getHeaders();
  const me = await getAuthMe(headers);
  const local = readLocalSettings(me.email, me.username);
  const payload: UserPreferences = {
    ...local.preferences,
    ...data,
  };
  const res = await fetchSettingsPath(`/api/settings/preferences`, {
    method: "PUT",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (res.ok) {
    const preferences = (await res.json()) as UserPreferences;
    writeLocalSettings(me.email, { ...local, preferences });
    return preferences;
  }
  if (res.status === 404) {
    const preferences: UserPreferences = {
      ...local.preferences,
      ...data,
    };
    writeLocalSettings(me.email, { ...local, preferences });
    return preferences;
  }
  throw new Error(await readErrorMessage(res, `Failed to update preferences: ${res.statusText}`));
}

export async function changePassword(data: {
  current_password: string;
  new_password: string;
  confirm_password: string;
}): Promise<{ message: string }> {
  const headers = await getHeaders();
  const res = await fetchSettingsPath(`/api/settings/password`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await readErrorMessage(res, `Failed to change password: ${res.statusText}`));
  return res.json();
}

/** Result of loading settings; `apiReachable` is false when the backend has no /api/settings routes (e.g. old `main` without merged PR). */
export type LoadedUserSettings = {
  settings: UserSettings;
  apiReachable: boolean;
};

export async function getAllSettings(): Promise<LoadedUserSettings> {
  const headers = await getHeaders();
  const me = await getAuthMe(headers);
  const local = readLocalSettings(me.email, me.username);

  const aggregateRes = await fetchSettingsPath(`/api/settings`, { method: "GET", headers });
  if (aggregateRes.ok) {
    const settings = (await aggregateRes.json()) as UserSettings;
    writeLocalSettings(me.email, settings);
    return { settings, apiReachable: true };
  }
  if (aggregateRes.status === 401) {
    throw new Error("Session expired. Please sign in again.");
  }
  if (aggregateRes.status !== 404) {
    throw new Error(
      await readErrorMessage(aggregateRes, `Failed to fetch settings: ${aggregateRes.statusText}`),
    );
  }

  const [profileRes, preferencesRes] = await Promise.all([
    fetchSettingsPath(`/api/settings/profile`, { method: "GET", headers }),
    fetchSettingsPath(`/api/settings/preferences`, { method: "GET", headers }),
  ]);

  if (profileRes.status === 401 || preferencesRes.status === 401) {
    throw new Error("Session expired. Please sign in again.");
  }

  if (!profileRes.ok && profileRes.status !== 404) {
    throw new Error(await readErrorMessage(profileRes, `Failed to fetch profile: ${profileRes.statusText}`));
  }
  if (!preferencesRes.ok && preferencesRes.status !== 404) {
    throw new Error(
      await readErrorMessage(preferencesRes, `Failed to fetch preferences: ${preferencesRes.statusText}`),
    );
  }

  const profile = profileRes.ok ? ((await profileRes.json()) as UserProfile) : local.profile;
  const preferences = preferencesRes.ok
    ? ((await preferencesRes.json()) as UserPreferences)
    : local.preferences;

  const settings = { profile, preferences };
  writeLocalSettings(me.email, settings);
  const apiReachable = profileRes.ok || preferencesRes.ok;
  return { settings, apiReachable };
}

/** Prefer backend profile `full_name` (Settings) over Supabase `user_metadata` — they are not synced automatically. */
async function displayNameFromSources(user: User): Promise<string> {
  const email = user.email || "";
  const fromMeta =
    (user.user_metadata?.full_name as string | undefined)?.trim() ||
    email.split("@")[0] ||
    "";
  try {
    const profile = await getUserProfile();
    if (profile.full_name?.trim()) return profile.full_name.trim();
    if (profile.username?.trim()) return profile.username.trim();
  } catch {
    // Offline or auth error — fall back to Supabase metadata.
  }
  return fromMeta;
}

/** Greeting / dashboard: uses `/api/settings/profile` when available. */
export async function resolveDisplayName(): Promise<string> {
  const user = await getUser();
  if (!user) return "";
  return displayNameFromSources(user);
}

/** Sidebar avatar initial + email: same source order as {@link resolveDisplayName}. */
export async function resolveSidebarIdentity(): Promise<{
  email: string;
  displayName: string;
  initial: string;
}> {
  const user = await getUser();
  if (!user) {
    return { email: "", displayName: "", initial: "?" };
  }
  const email = user.email || "";
  const displayName = await displayNameFromSources(user);
  const initial = (displayName || email || "U").trim().charAt(0).toUpperCase() || "?";
  return { email, displayName, initial };
}
