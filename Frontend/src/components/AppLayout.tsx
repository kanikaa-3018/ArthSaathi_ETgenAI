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

  const mainMarginLeft = isMobile ? 0 : sidebarExpanded ? 240 : 56;
  const isDemoRoute = location.pathname === "/demo";
  const demoGuest = isDemoRoute && !sessionLoading && !session;
  /** Sidebar MentorChat owns chat on /demo and /analyze/report — no duplicate floating widget. */
  const showFloatingChat =
    location.pathname !== "/mentor" &&
    location.pathname !== "/analyze/report" &&
    location.pathname !== "/demo";

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
        <button
          type="button"
          className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-lg border border-white/[0.08] bg-[hsl(var(--bg-secondary))] text-text-muted hover:bg-white/[0.04]"
          aria-label="Open menu"
          onClick={() => setMobileOpen(true)}
        >
          <Menu size={20} strokeWidth={1.5} />
        </button>
      ) : null}

      <main
        className={isMobile ? "min-h-screen pt-14 transition-[margin] duration-200" : "min-h-screen transition-[margin] duration-200"}
        style={{ marginLeft: mainMarginLeft }}
      >
        <div className="mx-auto max-w-[1200px] px-6 py-6">{children}</div>
      </main>

      {showFloatingChat ? <FloatingChat /> : null}
    </div>
  );
}
