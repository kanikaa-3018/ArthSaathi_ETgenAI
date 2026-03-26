import { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { gsap } from "gsap";
import { login as loginRequest, isAuthenticated } from "@/lib/auth";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from ?? "/analyze";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) navigate("/analyze", { replace: true });
  }, [navigate]);

  useEffect(() => {
    gsap.from(".auth-form-card", { opacity: 0, y: 16, duration: 0.5, ease: "power2.out", delay: 0.1 });
  }, []);

  const validate = () => {
    const errs: typeof errors = {};
    if (!email || !email.includes("@")) errs.email = "Enter a valid email address";
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
      // login() from auth.ts requires username — we use email as username for this
      const username = email.split("@")[0];
      await loginRequest(username, password);
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
  const inputFocusClass = "focus:border-accent focus:ring-1 focus:ring-accent/20";

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "hsl(var(--bg-primary))" }}>
      <div className="auth-form-card w-full max-w-[360px]">
        {/* Wordmark */}
        <div className="text-center mb-8">
          <h1
            className="font-fraunces text-[26px] text-text-primary"
            style={{ fontVariationSettings: "'opsz' 72, 'wght' 700" }}
          >
            ArthSaathi
          </h1>
          <p className="font-syne text-[13px] text-text-muted mt-1">(अर्थसाथी)</p>
          <div className="w-10 h-[2px] mx-auto mt-6 mb-8" style={{ background: "hsl(var(--accent))" }} />
        </div>

        {/* Form */}
        <p className="font-syne text-[15px] text-text-secondary font-medium mb-6">Sign in</p>

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
              <p className="font-syne text-xs text-negative mt-1">{errors.email}</p>
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
              <p className="font-syne text-xs text-negative mt-1">{errors.password}</p>
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
