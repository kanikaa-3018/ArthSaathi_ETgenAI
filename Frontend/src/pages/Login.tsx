import { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { gsap } from "gsap";
import {
  login as loginRequest,
  isAuthenticated,
  signInWithGoogle,
} from "@/lib/auth";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from ?? "/analyze";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    form?: string;
  }>({});
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) navigate("/analyze", { replace: true });
  }, [navigate]);

  useEffect(() => {
    gsap.from(".auth-form-card", {
      opacity: 0,
      y: 16,
      duration: 0.5,
      ease: "power2.out",
      delay: 0.1,
    });
  }, []);

  const validate = () => {
    const errs: typeof errors = {};
    if (!email || !email.includes("@"))
      errs.email = "Enter a valid email address";
    if (!password) errs.password = "Password is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    try {
      await loginRequest(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setErrors({ form: (err as Error).message || "Invalid credentials" });
    } finally {
      setLoading(false);
    }
  };

  const inputBase =
    "w-full rounded-lg h-11 px-3 font-syne text-sm text-text-primary placeholder:text-text-muted outline-none transition-all border";
  const inputStyle = {
    background: "hsl(220 20% 12%)",
    borderColor: "hsl(220 10% 20%)",
  };
  const inputFocusClass =
    "focus:border-accent focus:ring-1 focus:ring-accent/20";

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "hsl(var(--bg-primary))" }}
    >
      <div className="auth-form-card w-full max-w-[360px]">
        {/* Wordmark */}
        <div className="text-center mb-8">
          <h1
            className="font-fraunces text-[26px] text-text-primary"
            style={{ fontVariationSettings: "'opsz' 72, 'wght' 700" }}
          >
            ArthSaathi
          </h1>
          <p className="font-syne text-[13px] text-text-muted mt-1">
            (अर्थसाथी)
          </p>
          <div
            className="w-10 h-[2px] mx-auto mt-6 mb-8"
            style={{ background: "hsl(var(--accent))" }}
          />
        </div>

        {/* Form */}
        <p className="font-syne text-[15px] text-text-secondary font-medium mb-6">
          Sign in
        </p>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          {/* Email */}
          <div>
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`${inputBase} ${inputFocusClass}`}
              style={inputStyle}
              autoComplete="email"
            />
            {errors.email && (
              <p className="font-syne text-xs text-negative mt-1">
                {errors.email}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${inputBase} ${inputFocusClass}`}
              style={inputStyle}
              autoComplete="current-password"
            />
            {errors.password && (
              <p className="font-syne text-xs text-negative mt-1">
                {errors.password}
              </p>
            )}
          </div>

          {errors.form && (
            <p className="font-syne text-xs text-negative">{errors.form}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-lg font-syne font-semibold text-[14px] text-white transition-opacity disabled:opacity-60"
            style={{ background: "hsl(var(--accent))" }}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="flex items-center gap-3 my-6">
          <div
            className="flex-1 h-px"
            style={{ background: "hsl(220 10% 20%)" }}
          />
          <span
            className="font-syne text-[12px]"
            style={{ color: "hsl(var(--text-muted))" }}
          >
            or
          </span>
          <div
            className="flex-1 h-px"
            style={{ background: "hsl(220 10% 20%)" }}
          />
        </div>

        <button
          type="button"
          onClick={async () => {
            setOauthLoading(true);
            setErrors({});
            try {
              await signInWithGoogle();
            } catch (err) {
              setErrors({
                form:
                  err instanceof Error ? err.message : "Google sign-in failed",
              });
            } finally {
              setOauthLoading(false);
            }
          }}
          disabled={loading || oauthLoading}
          className="w-full h-11 rounded-lg font-syne font-semibold text-[14px] flex items-center justify-center gap-2 border transition-colors hover:border-white/20"
          style={{
            background: "hsl(220 20% 12%)",
            borderColor: "hsl(220 10% 20%)",
            color: "hsl(var(--text-secondary))",
          }}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {oauthLoading ? "Redirecting…" : "Continue with Google"}
        </button>

        <p className="font-syne text-[13px] text-text-muted text-center mt-6">
          No account yet?{" "}
          <Link to="/signup" className="text-accent hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
