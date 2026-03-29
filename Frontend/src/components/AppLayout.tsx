import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import { AppSidebar } from "@/components/AppSidebar";
import { FloatingChat } from "@/components/FloatingChat";
import { useSession } from "@/context/session-context";

const SIDEBAR_KEY = "arthsaathi_sidebar";
const MOBILE_BREAKPOINT = 768;

export function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { session, loading: sessionLoading } = useSession();
  const [sidebarExpanded, setSidebarExpanded] = useState(() => {
    if (typeof window === "undefined") return true;
    const stored = localStorage.getItem(SIDEBAR_KEY);
    if (stored !== null) return stored === "true";
    return window.innerWidth >= 1024;
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < MOBILE_BREAKPOINT : false,
  );

  useEffect(() => {
    const onResize = () => {
      const m = window.innerWidth < MOBILE_BREAKPOINT;
      setIsMobile(m);
      if (m) setMobileOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_KEY, String(sidebarExpanded));
  }, [sidebarExpanded]);

  const toggleExpanded = useCallback(() => {
    setSidebarExpanded((e) => !e);
  }, []);

  /** Match AppSidebar: w-64 expanded (256px), w-16 collapsed (64px). */
  const mainMarginLeft = isMobile ? 0 : sidebarExpanded ? 256 : 64;
  const isDemoRoute = location.pathname === "/demo";
  const demoGuest = isDemoRoute && !sessionLoading && !session;
  /** Full-page mentor has its own UI; demo guests have no session for chat. */
  const showFloatingChat =
    location.pathname !== "/mentor" && !(isDemoRoute && demoGuest);

  /** Tighter shell padding so upload / processing don’t stack past 100vh and bounce-scroll. */
  const analyzeShell =
    location.pathname === "/analyze" || location.pathname === "/analyze/processing";

  return (
    <div className="min-h-screen" style={{ background: "hsl(var(--bg-primary))" }}>
      <AppSidebar
        expanded={sidebarExpanded}
        onToggleExpanded={toggleExpanded}
        mobileOpen={mobileOpen}
        onMobileOpenChange={setMobileOpen}
        isMobile={isMobile}
        guestMode={demoGuest}
      />

      {isMobile ? (
        <header
          className="fixed top-0 left-0 right-0 z-50 h-12 flex items-center justify-between px-4"
          style={{
            background: "hsl(var(--bg-primary))",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-text-muted hover:text-text-secondary hover:bg-white/[0.04]"
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={20} strokeWidth={1.5} />
          </button>

          <span
            className="font-fraunces text-sm text-text-primary"
            style={{ fontVariationSettings: "'opsz' 72, 'wght' 700" }}
          >
            ArthSaathi
          </span>

          <div className="w-9" aria-hidden />
        </header>
      ) : null}

      <main
        className={isMobile ? "min-h-screen pt-14 transition-[margin] duration-200" : "min-h-screen transition-[margin] duration-200"}
        style={{ marginLeft: mainMarginLeft }}
      >
        <div
          className={`mx-auto max-w-[1200px] px-6 ${analyzeShell ? "py-3 md:py-5" : "py-6"}`}
        >
          {children}
        </div>
      </main>

      {showFloatingChat ? <FloatingChat /> : null}
    </div>
  );
}
