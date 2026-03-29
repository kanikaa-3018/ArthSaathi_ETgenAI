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

  // Load settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await getAllSettings();
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
      } catch (err) {
        const message = err instanceof Error ? err.message : "";
        if (message.toLowerCase().includes("session expired")) {
          navigate("/login", { replace: true, state: { from: "/settings" } });
          return;
        }
        setMessage({
          type: "error",
          text: "Failed to load settings. Please refresh the page.",
        });
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [navigate]);

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
      showMessage("success", "Profile updated successfully");
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
      showMessage("success", "Preferences updated successfully");
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
    <div className="min-h-screen" style={{ background: "hsl(var(--bg-primary))" }}>
      {/* Header */}
      <div className="border-b border-white/[0.06] mb-8">
        <div className="max-w-4xl mx-auto px-6 py-6 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-white/[0.06] text-text-muted"
            aria-label="Go back"
          >
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-3xl font-bold text-text-primary">Settings</h1>
        </div>
      </div>

      {/* Message Alert */}
      {message && (
        <div className="max-w-4xl mx-auto px-6 mb-6">
          <div
            className={`flex items-center gap-3 rounded-lg px-4 py-3 ${
              message.type === "success"
                ? "bg-positive/10 border border-positive/30 text-positive"
                : "bg-negative/10 border border-negative/30 text-negative"
            }`}
          >
            <CheckCircle size={20} />
            <span className="text-sm font-syne">{message.text}</span>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 pb-12">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="password">Password</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <div className="rounded-lg border border-white/[0.06] p-6">
              <h2 className="text-xl font-bold text-text-primary mb-4">
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
                  className="mt-6 px-6 py-2 rounded-lg bg-accent text-white font-syne text-sm font-semibold hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {saving ? "Saving..." : "Save Profile"}
                </button>
              </form>
            </div>
          </TabsContent>

          {/* Password Tab */}
          <TabsContent value="password">
            <div className="rounded-lg border border-white/[0.06] p-6">
              <h2 className="text-xl font-bold text-text-primary mb-4">
                Change Password
              </h2>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                {/* Current Password */}
                <div>
                  <label className="block text-sm font-syne text-text-muted mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter your current password"
                    required
                    className="w-full px-4 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-text-primary placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent/20 outline-none transition"
                  />
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-sm font-syne text-text-muted mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min 8 characters)"
                    required
                    minLength={8}
                    className="w-full px-4 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-text-primary placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent/20 outline-none transition"
                  />
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-syne text-text-muted mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your new password"
                    required
                    minLength={8}
                    className="w-full px-4 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-text-primary placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent/20 outline-none transition"
                  />
                </div>

                <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 mt-4">
                  <p className="text-xs text-warning font-syne">
                    Make sure your password is at least 8 characters long and
                    combines uppercase, lowercase, and numbers.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="mt-6 px-6 py-2 rounded-lg bg-accent text-white font-syne text-sm font-semibold hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {saving ? "Updating..." : "Update Password"}
                </button>
              </form>
            </div>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences">
            <div className="rounded-lg border border-white/[0.06] p-6">
              <h2 className="text-xl font-bold text-text-primary mb-6">
                Preferences
              </h2>
              <form onSubmit={handlePreferencesSubmit} className="space-y-6">
                {/* Notifications */}
                <div>
                  <h3 className="text-sm font-syne font-semibold text-text-primary mb-3">
                    Notifications
                  </h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={emailNotifications}
                        onChange={(e) =>
                          setEmailNotifications(e.target.checked)
                        }
                        className="w-4 h-4 rounded"
                      />
                      <span className="text-sm text-text-secondary">
                        Email Notifications
                      </span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={portfolioUpdates}
                        onChange={(e) => setPortfolioUpdates(e.target.checked)}
                        className="w-4 h-4 rounded"
                      />
                      <span className="text-sm text-text-secondary">
                        Portfolio Updates
                      </span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={taxInsights}
                        onChange={(e) => setTaxInsights(e.target.checked)}
                        className="w-4 h-4 rounded"
                      />
                      <span className="text-sm text-text-secondary">
                        Tax Insights & Tips
                      </span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={marketAlerts}
                        onChange={(e) => setMarketAlerts(e.target.checked)}
                        className="w-4 h-4 rounded"
                      />
                      <span className="text-sm text-text-secondary">
                        Market Alerts (Beta)
                      </span>
                    </label>
                  </div>
                </div>

                {/* Display Settings */}
                <div className="border-t border-white/[0.06] pt-6">
                  <h3 className="text-sm font-syne font-semibold text-text-primary mb-3">
                    Display
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-syne text-text-muted mb-2">
                        Theme
                      </label>
                      <select
                        value={theme}
                        onChange={(e) => setTheme(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-text-primary focus:border-accent focus:ring-1 focus:ring-accent/20 outline-none transition"
                      >
                        <option value="dark">Dark</option>
                        <option value="light">Light</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-syne text-text-muted mb-2">
                        Currency
                      </label>
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-text-primary focus:border-accent focus:ring-1 focus:ring-accent/20 outline-none transition"
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
                  className="mt-6 px-6 py-2 rounded-lg bg-accent text-white font-syne text-sm font-semibold hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {saving ? "Saving..." : "Save Preferences"}
                </button>
              </form>
            </div>
          </TabsContent>

          {/* Account Tab */}
          <TabsContent value="account">
            <div className="rounded-lg border border-white/[0.06] p-6">
              <h2 className="text-xl font-bold text-text-primary mb-6">
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
