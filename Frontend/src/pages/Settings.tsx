import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, AlertCircle, CheckCircle } from "lucide-react";
import {
  getAllSettings,
  updateUserProfile,
  changePassword,
  updateUserPreferences,
  UserSettings,
  UserProfile,
  UserPreferences,
} from "@/lib/settings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Settings data
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);

  // Form states
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [portfolioUpdates, setPortfolioUpdates] = useState(true);
  const [taxInsights, setTaxInsights] = useState(true);
  const [marketAlerts, setMarketAlerts] = useState(false);
  const [theme, setTheme] = useState("dark");
  const [currency, setCurrency] = useState("INR");
  /** False when GET /api/settings* all 404 — backend build without user-settings routes (e.g. plain `main` before merge). */
  const [settingsApiReachable, setSettingsApiReachable] = useState(true);

  // Load settings (retry briefly after OAuth redirect while Supabase hydrates the session)
  useEffect(() => {
    const loadSettings = async (attempt = 0): Promise<void> => {
      try {
        const { settings: data, apiReachable } = await getAllSettings();
        setSettingsApiReachable(apiReachable);
        setSettings(data);
        setProfile(data.profile);
        setPreferences(data.preferences);

        setFullName(data.profile.full_name || "");
        setAvatarUrl(data.profile.avatar_url || "");
        setEmailNotifications(data.preferences.email_notifications);
        setPortfolioUpdates(data.preferences.portfolio_updates);
        setTaxInsights(data.preferences.tax_insights);
        setMarketAlerts(data.preferences.market_alerts);
        setTheme(data.preferences.theme);
        setCurrency(data.preferences.currency);
        setLoading(false);
      } catch (err) {
        const message = err instanceof Error ? err.message : "";
        if (message.toLowerCase().includes("session expired")) {
          if (attempt < 4) {
            await new Promise((r) => window.setTimeout(r, 400 + attempt * 200));
            return loadSettings(attempt + 1);
          }
          navigate("/login", { replace: true, state: { from: "/settings" } });
          setLoading(false);
          return;
        }
        setMessage({
          type: "error",
          text: "Failed to load settings. Please refresh the page.",
        });
        setLoading(false);
      }
    };

    void loadSettings();
  }, [navigate]);

  const showPasswordTab = profile?.can_change_password === true;

  useEffect(() => {
    if (!showPasswordTab && activeTab === "password") {
      setActiveTab("profile");
    }
  }, [showPasswordTab, activeTab]);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await updateUserProfile({
        full_name: fullName,
        avatar_url: avatarUrl,
      });
      setProfile(updated);
      if (settings) {
        setSettings({ ...settings, profile: updated });
      }
      showMessage(
        "success",
        settingsApiReachable
          ? "Profile updated successfully"
          : "Profile saved in this browser only. Start the backend from the branch that includes /api/settings (merge your settings PR), then your name will sync to the server.",
      );
    } catch (err) {
      showMessage(
        "error",
        err instanceof Error ? err.message : "Failed to update profile"
      );
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      showMessage("error", "New passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      showMessage("error", "Password must be at least 8 characters");
      return;
    }

    setSaving(true);
    try {
      await changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showMessage("success", "Password changed successfully");
    } catch (err) {
      showMessage(
        "error",
        err instanceof Error ? err.message : "Failed to change password"
      );
    } finally {
      setSaving(false);
    }
  };

  const handlePreferencesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await updateUserPreferences({
        email_notifications: emailNotifications,
        portfolio_updates: portfolioUpdates,
        tax_insights: taxInsights,
        market_alerts: marketAlerts,
        theme: theme as "light" | "dark",
        currency,
      });
      setPreferences(updated);
      if (settings) {
        setSettings({ ...settings, preferences: updated });
      }
      showMessage(
        "success",
        settingsApiReachable
          ? "Preferences updated successfully"
          : "Preferences saved in this browser only until the API exposes /api/settings/preferences.",
      );
    } catch (err) {
      showMessage(
        "error",
        err instanceof Error ? err.message : "Failed to update preferences"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-text-muted">Loading settings...</p>
      </div>
    );
  }

  if (!settings || !profile || !preferences) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={32} className="mx-auto mb-4 text-negative" />
          <p className="text-text-primary mb-4">Could not load settings</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-4 py-2 rounded-lg bg-accent text-white hover:bg-accent/90"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-dvh pb-[max(1.25rem,env(safe-area-inset-bottom))]"
      style={{ background: "hsl(var(--bg-primary))" }}
    >
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-white/[0.08] bg-[hsl(var(--bg-primary))]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center gap-2 px-4 py-4 sm:gap-3 sm:px-6 sm:py-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="shrink-0 rounded-xl p-2.5 text-text-muted transition-colors hover:bg-white/[0.06] min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Go back"
          >
            <ChevronLeft size={22} />
          </button>
          <h1 className="min-w-0 truncate text-xl font-bold text-text-primary sm:text-3xl">
            Settings
          </h1>
        </div>
      </div>

      {!settingsApiReachable ? (
        <div className="mx-auto mb-4 max-w-4xl px-4 sm:mb-5 sm:px-6">
          <div className="rounded-xl border border-warning/35 bg-warning/10 px-4 py-3 font-syne text-sm leading-relaxed text-warning">
            Your backend returned <strong className="text-text-primary">404</strong> for{" "}
            <code className="rounded bg-black/20 px-1 py-0.5 text-xs text-text-secondary">
              /api/settings
            </code>
            . That usually means the API process is running an older{" "}
            <code className="text-xs">main.py</code> without user-settings routes.{" "}
            <strong className="text-text-primary">Restart uvicorn</strong> from the repo copy that
            includes <code className="text-xs">backend/app/settings.py</code> and the{" "}
            <code className="text-xs">/api/settings</code> handlers in{" "}
            <code className="text-xs">main.py</code>, or merge your settings branch into{" "}
            <code className="text-xs">main</code>. Until then, changes here persist only in{" "}
            <strong className="text-text-primary">localStorage</strong> for this browser.
          </div>
        </div>
      ) : null}

      {/* Message Alert */}
      {message && (
        <div className="mx-auto mb-4 max-w-4xl px-4 sm:mb-6 sm:px-6">
          <div
            className={`flex items-start gap-3 rounded-xl px-4 py-3 sm:items-center ${
              message.type === "success"
                ? "bg-positive/10 border border-positive/30 text-positive"
                : "bg-negative/10 border border-negative/30 text-negative"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle size={20} className="shrink-0" />
            ) : (
              <AlertCircle size={20} className="shrink-0" />
            )}
            <span className="text-sm font-syne">{message.text}</span>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="mx-auto max-w-4xl px-4 pb-10 sm:px-6 sm:pb-12">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList
            className={cn(
              "mb-6 flex h-auto w-full flex-nowrap gap-1 overflow-x-auto rounded-xl bg-white/[0.04] p-1.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:mb-8 sm:grid sm:overflow-visible [&::-webkit-scrollbar]:hidden",
              showPasswordTab ? "sm:grid-cols-4" : "sm:grid-cols-3",
            )}
          >
            <TabsTrigger
              value="profile"
              className="shrink-0 rounded-lg px-3 py-2.5 text-xs font-syne sm:px-3 sm:py-1.5 sm:text-sm"
            >
              Profile
            </TabsTrigger>
            {showPasswordTab ? (
              <TabsTrigger
                value="password"
                className="shrink-0 rounded-lg px-3 py-2.5 text-xs font-syne sm:px-3 sm:py-1.5 sm:text-sm"
              >
                Password
              </TabsTrigger>
            ) : null}
            <TabsTrigger
              value="preferences"
              className="shrink-0 rounded-lg px-3 py-2.5 text-xs font-syne sm:px-3 sm:py-1.5 sm:text-sm"
            >
              Prefs
            </TabsTrigger>
            <TabsTrigger
              value="account"
              className="shrink-0 rounded-lg px-3 py-2.5 text-xs font-syne sm:px-3 sm:py-1.5 sm:text-sm"
            >
              Account
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="mt-0 sm:mt-2">
            <div className="rounded-xl border border-white/[0.08] p-4 sm:p-6">
              <h2 className="mb-4 text-lg font-bold text-text-primary sm:text-xl">
                Profile Information
              </h2>
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                {/* Email (read-only) */}
                <div>
                  <label className="block text-sm font-syne text-text-muted mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    className="w-full px-4 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-text-secondary opacity-50 cursor-not-allowed"
                  />
                  <p className="text-xs text-text-muted mt-1">
                    Email cannot be changed
                  </p>
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-sm font-syne text-text-muted mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your full name"
                    maxLength={100}
                    className="w-full px-4 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-text-primary placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent/20 outline-none transition"
                  />
                </div>

                {/* Avatar URL */}
                <div>
                  <label className="block text-sm font-syne text-text-muted mb-2">
                    Avatar URL
                  </label>
                  <input
                    type="url"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                    maxLength={500}
                    className="w-full px-4 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-text-primary placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent/20 outline-none transition"
                  />
                  <p className="text-xs text-text-muted mt-1">
                    Direct link to an image file (PNG, JPG)
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="mt-6 w-full rounded-xl bg-accent px-6 py-3 font-syne text-sm font-semibold text-white transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:py-2.5"
                >
                  {saving ? "Saving..." : "Save Profile"}
                </button>
              </form>
            </div>
          </TabsContent>

          {showPasswordTab ? (
            <TabsContent value="password" className="mt-0 sm:mt-2">
              <div className="rounded-xl border border-white/[0.08] p-4 sm:p-6">
                <h2 className="mb-4 text-lg font-bold text-text-primary sm:text-xl">
                  Change Password
                </h2>
                <p className="mb-4 font-syne text-sm text-text-muted">
                  For accounts created via this app&apos;s legacy email registration (stored password
                  on the API). Google and Supabase email sign-in do not use this form.
                </p>
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div>
                    <label className="mb-2 block font-syne text-sm text-text-muted">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter your current password"
                      required
                      autoComplete="current-password"
                      className="min-h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-text-primary outline-none transition placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent/20"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block font-syne text-sm text-text-muted">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password (min 8 characters)"
                      required
                      minLength={8}
                      autoComplete="new-password"
                      className="min-h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-text-primary outline-none transition placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent/20"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block font-syne text-sm text-text-muted">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your new password"
                      required
                      minLength={8}
                      autoComplete="new-password"
                      className="min-h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-text-primary outline-none transition placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent/20"
                    />
                  </div>

                  <div className="mt-4 rounded-xl border border-warning/30 bg-warning/10 p-4">
                    <p className="font-syne text-xs text-warning">
                      Make sure your password is at least 8 characters long and combines uppercase,
                      lowercase, and numbers.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="mt-6 w-full rounded-xl bg-accent px-6 py-3 font-syne text-sm font-semibold text-white transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:py-2.5"
                  >
                    {saving ? "Updating..." : "Update Password"}
                  </button>
                </form>
              </div>
            </TabsContent>
          ) : null}

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="mt-0 sm:mt-2">
            <div className="rounded-xl border border-white/[0.08] p-4 sm:p-6">
              <h2 className="mb-5 text-lg font-bold text-text-primary sm:mb-6 sm:text-xl">
                Preferences
              </h2>
              <form onSubmit={handlePreferencesSubmit} className="space-y-6">
                {/* Notifications */}
                <div>
                  <h3 className="text-sm font-syne font-semibold text-text-primary mb-3">
                    Notifications
                  </h3>
                  <div className="space-y-3">
                    <label className="flex min-h-11 cursor-pointer items-center gap-3 py-1">
                      <input
                        type="checkbox"
                        checked={emailNotifications}
                        onChange={(e) =>
                          setEmailNotifications(e.target.checked)
                        }
                        className="h-4 w-4 shrink-0 rounded"
                      />
                      <span className="text-sm text-text-secondary">
                        Email Notifications
                      </span>
                    </label>
                    <label className="flex min-h-11 cursor-pointer items-center gap-3 py-1">
                      <input
                        type="checkbox"
                        checked={portfolioUpdates}
                        onChange={(e) => setPortfolioUpdates(e.target.checked)}
                        className="h-4 w-4 shrink-0 rounded"
                      />
                      <span className="text-sm text-text-secondary">
                        Portfolio Updates
                      </span>
                    </label>
                    <label className="flex min-h-11 cursor-pointer items-center gap-3 py-1">
                      <input
                        type="checkbox"
                        checked={taxInsights}
                        onChange={(e) => setTaxInsights(e.target.checked)}
                        className="h-4 w-4 shrink-0 rounded"
                      />
                      <span className="text-sm text-text-secondary">
                        Tax Insights & Tips
                      </span>
                    </label>
                    <label className="flex min-h-11 cursor-pointer items-center gap-3 py-1">
                      <input
                        type="checkbox"
                        checked={marketAlerts}
                        onChange={(e) => setMarketAlerts(e.target.checked)}
                        className="h-4 w-4 shrink-0 rounded"
                      />
                      <span className="text-sm text-text-secondary">
                        Market Alerts (Beta)
                      </span>
                    </label>
                  </div>
                </div>

                {/* Display Settings */}
                <div className="border-t border-white/[0.08] pt-6">
                  <h3 className="mb-3 font-syne text-sm font-semibold text-text-primary">
                    Display
                  </h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block font-syne text-sm text-text-muted">
                        Theme
                      </label>
                      <select
                        value={theme}
                        onChange={(e) => setTheme(e.target.value)}
                        className="min-h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-text-primary outline-none transition focus:border-accent focus:ring-1 focus:ring-accent/20"
                      >
                        <option value="dark">Dark</option>
                        <option value="light">Light</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block font-syne text-sm text-text-muted">
                        Currency
                      </label>
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="min-h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-text-primary outline-none transition focus:border-accent focus:ring-1 focus:ring-accent/20"
                      >
                        <option value="INR">INR (₹)</option>
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="mt-6 w-full rounded-xl bg-accent px-6 py-3 font-syne text-sm font-semibold text-white transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:py-2.5"
                >
                  {saving ? "Saving..." : "Save Preferences"}
                </button>
              </form>
            </div>
          </TabsContent>

          {/* Account Tab */}
          <TabsContent value="account" className="mt-0 sm:mt-2">
            <div className="rounded-xl border border-white/[0.08] p-4 sm:p-6">
              <h2 className="mb-5 text-lg font-bold text-text-primary sm:mb-6 sm:text-xl">
                Account Information
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-syne text-text-muted mb-1">
                    Username
                  </p>
                  <p className="text-text-primary font-mono text-sm">
                    {profile.username}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-syne text-text-muted mb-1">
                    Email
                  </p>
                  <p className="text-text-primary font-mono text-sm">
                    {profile.email}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-syne text-text-muted mb-1">
                    Account Created
                  </p>
                  <p className="text-text-primary font-mono text-sm">
                    {new Date(profile.created_at * 1000).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-syne text-text-muted mb-1">
                    Last Updated
                  </p>
                  <p className="text-text-primary font-mono text-sm">
                    {new Date(profile.updated_at * 1000).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    )}
                  </p>
                </div>

                <div className="bg-blue/10 border border-blue/30 rounded-lg p-4 mt-6">
                  <p className="text-xs text-text-secondary font-syne">
                    For account deletion or other account-related requests,
                    please contact our support team.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
