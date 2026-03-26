import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { gsap } from "gsap";
import { register as registerRequest, isAuthenticated } from "@/lib/auth";

export default function Signup() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pan, setPan] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; form?: string }>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) navigate("/analyze", { replace: true });
  }, [navigate]);

  useEffect(() => {
    gsap.from(".auth-form-card", { opacity: 0, y: 16, duration: 0.5, ease: "power2.out", delay: 0.1 });
  }, []);

  const validate = () => {
    const errs: typeof errors = {};
    if (!name.trim()) errs.name = "Name is required";
    if (!email || !email.includes("@")) errs.email = "Enter a valid email address";
    if (!password || password.length < 6) errs.password = "Password must be at least 6 characters";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    try {
      // register(username, email, password) — use name as username
      await registerRequest(name.trim().split(" ")[0].toLowerCase(), email, password);
      navigate("/analyze", { replace: true });
    } catch (err) {
      setErrors({ form: (err as Error).message || "Registration failed" });
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
    <div className="min-h-screen flex items-center justify-center px-4 py-8" style={{ background: "hsl(var(--bg-primary))" }}>
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

        <p className="font-syne text-[15px] text-text-secondary font-medium mb-6">Create account</p>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          {/* Name */}
          <div>
            <input
              type="text"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`${inputBase} ${inputFocusClass}`}
              style={inputStyle}
              autoComplete="name"
            />
            {errors.name && <p className="font-syne text-xs text-negative mt-1">{errors.name}</p>}
          </div>

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
            {errors.email && <p className="font-syne text-xs text-negative mt-1">{errors.email}</p>}
          </div>

          {/* PAN (optional) */}
          <div>
            <input
              type="text"
              placeholder="PAN (optional)"
              value={pan}
              onChange={(e) => setPan(e.target.value.toUpperCase())}
              className={`${inputBase} ${inputFocusClass}`}
              style={inputStyle}
              autoComplete="off"
              maxLength={10}
            />
            <p className="font-syne text-[12px] text-text-muted mt-1">
              CAS statements use PAN as the PDF password
            </p>
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
              autoComplete="new-password"
            />
            {errors.password && <p className="font-syne text-xs text-negative mt-1">{errors.password}</p>}
          </div>

          {errors.form && <p className="font-syne text-xs text-negative">{errors.form}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-lg font-syne font-semibold text-[14px] text-white transition-opacity disabled:opacity-60"
            style={{ background: "hsl(var(--accent))" }}
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="font-syne text-[13px] text-text-muted text-center mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-accent hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
