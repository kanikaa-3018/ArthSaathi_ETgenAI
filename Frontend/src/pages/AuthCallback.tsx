import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

const FALLBACK_MS = 15_000;

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    let authSubscription: { unsubscribe: () => void } | null = null;
    let timeout: ReturnType<typeof setTimeout> | null = null;

    const clearFallback = () => {
      if (timeout !== null) {
        clearTimeout(timeout);
        timeout = null;
      }
    };

    const goAnalyze = () => {
      clearFallback();
      navigate("/analyze", { replace: true });
    };

    const goLogin = () => {
      clearFallback();
      navigate("/login", { replace: true });
    };

    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!isMounted) return;

      if (session) {
        goAnalyze();
        return;
      }

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        // Not only SIGNED_IN — INITIAL_SESSION / TOKEN_REFRESHED can carry the new session after OAuth.
        if (session?.access_token) goAnalyze();
      });

      authSubscription = subscription;

      timeout = setTimeout(() => {
        if (isMounted) goLogin();
      }, FALLBACK_MS);
    };

    void init();

    return () => {
      isMounted = false;
      clearFallback();
      authSubscription?.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "hsl(var(--bg-primary))" }}>
      <p className="font-syne text-sm" style={{ color: "hsl(var(--text-secondary))" }}>
        Signing you in...
      </p>
    </div>
  );
}
