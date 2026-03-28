import { useEffect, useState, type CSSProperties } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  LogIn,
  LogOut,
  MessageCircle,
  Play,
  Scale,
  Search,
  Target,
  ToggleRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { compactINR } from "@/lib/format";
import { fetchMe, signOut } from "@/lib/auth";
import { useAnalysis } from "@/context/analysis-context";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function healthBadgeStyle(grade: string): CSSProperties {
  const g = (grade || "").toUpperCase();
  let color = "hsl(var(--text-secondary))";
  if (g === "A") color = "hsl(var(--positive))";
  else if (g === "B") color = "hsl(var(--chart-2))";
  else if (g === "C") color = "hsl(var(--warning))";
  else if (g === "D" || g === "F") color = "hsl(var(--negative))";
  return { color, borderColor: `${color}40` };
}

export interface AppSidebarProps {
  expanded: boolean;
  onToggleExpanded: () => void;
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
  isMobile: boolean;
  /** Public /demo without session: hide sign-out, show sign-in CTA instead. */
  guestMode?: boolean;
}

function NavItem({
  to,
  end,
  icon: Icon,
  label,
  expanded: ex,
  disabled,
  onAfterNavigate,
  activateOnPathnames,
}: {
  to: string;
  end?: boolean;
  icon: typeof LayoutDashboard;
  label: string;
  expanded: boolean;
  disabled?: boolean;
  onAfterNavigate?: () => void;
  /** Treat NavLink as active on these paths (e.g. /demo → highlight Analyze). */
  activateOnPathnames?: string[];
}) {
  const location = useLocation();
  const body = ({ isActive }: { isActive: boolean }) => {
    const alsoActive = activateOnPathnames?.includes(location.pathname) ?? false;
    const active = isActive || alsoActive;
    return cn(
      "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-xs font-syne font-medium",
      !ex && "justify-center",
      disabled && "pointer-events-none opacity-40",
      !disabled &&
        (active
          ? "bg-white/[0.06] text-[hsl(var(--text-primary))] border-l-2 border-[hsl(var(--accent))]"
          : "text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-secondary))] hover:bg-white/[0.03] border-l-2 border-transparent"),
    );
  };

  const inner = (
    <>
      <Icon size={18} strokeWidth={1.5} className="shrink-0" />
      {ex ? <span>{label}</span> : null}
    </>
  );

  if (disabled) {
    return (
      <div className={body({ isActive: false })} title={label}>
        {inner}
      </div>
    );
  }

  const link = (
    <NavLink
      to={to}
      end={end}
      className={body}
      onClick={() => onAfterNavigate?.()}
    >
      {inner}
    </NavLink>
  );

  if (!ex) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right" className="font-syne text-xs">
          {label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return link;
}

export function AppSidebar({
  expanded,
  onToggleExpanded,
  mobileOpen,
  onMobileOpenChange,
  isMobile,
  guestMode = false,
}: AppSidebarProps) {
  const navigate = useNavigate();
  const { state } = useAnalysis();
  const hasResult = Boolean(state.result);
  const [email, setEmail] = useState("");
  const [initial, setInitial] = useState("");

  useEffect(() => {
    if (guestMode) {
      setEmail("");
      setInitial("?");
      return;
    }
    fetchMe()
      .then((u) => {
        const e = u.email || "";
        setEmail(e);
        const d = (u.username || e || "U").trim();
        setInitial(d.charAt(0).toUpperCase());
      })
      .catch(() => {
        setEmail("");
        setInitial("?");
      });
  }, [guestMode]);

  const handleSignOut = async () => {
    await signOut();
    onMobileOpenChange(false);
    navigate("/login");
  };

  const showExpanded = isMobile ? true : expanded;
  const widthClass = isMobile ? "w-60" : expanded ? "w-60" : "w-14";

  if (isMobile && !mobileOpen) {
    return null;
  }

  const aside = (
    <aside
      className={cn(
        "fixed left-0 top-0 z-[60] flex h-screen flex-col border-r border-white/[0.06] transition-all duration-200",
        widthClass,
        isMobile && "shadow-2xl",
      )}
      style={{ background: "hsl(var(--sidebar-background))" }}
    >
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/[0.06] px-2 py-3">
        <Link
          to="/dashboard"
          className="min-w-0 flex-1 no-underline text-left"
          onClick={() => isMobile && onMobileOpenChange(false)}
        >
          <span
            className="font-fraunces text-sm text-[hsl(var(--text-primary))] block truncate"
            style={{ fontVariationSettings: "'opsz' 72, 'wght' 700" }}
          >
            ArthSaathi
          </span>
          {showExpanded ? (
            <span className="font-syne text-xs text-text-muted">(अर्थसाथी)</span>
          ) : null}
        </Link>
        {!isMobile ? (
          <button
            type="button"
            onClick={onToggleExpanded}
            className="rounded-md p-1.5 text-text-muted hover:bg-white/[0.06] hover:text-text-secondary"
            aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
          >
            {expanded ? (
              <ChevronLeft size={18} strokeWidth={1.5} />
            ) : (
              <ChevronRight size={18} strokeWidth={1.5} />
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onMobileOpenChange(false)}
            className="rounded-md p-1.5 text-text-muted hover:bg-white/[0.06]"
            aria-label="Close menu"
          >
            <ChevronLeft size={18} strokeWidth={1.5} />
          </button>
        )}
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-2 py-4">
        <p
          className={cn(
            "font-mono text-xs text-text-muted uppercase tracking-[2px] px-3 mb-1",
            !showExpanded && "sr-only",
          )}
        >
          Analyze
        </p>
        <div className="space-y-0.5 mb-6">
          <NavItem
            to="/dashboard"
            end
            icon={LayoutDashboard}
            label="Dashboard"
            expanded={showExpanded}
            onAfterNavigate={() => isMobile && onMobileOpenChange(false)}
          />
          <NavItem
            to="/analyze"
            icon={Search}
            label="Portfolio X-Ray"
            expanded={showExpanded}
            activateOnPathnames={["/demo"]}
            onAfterNavigate={() => isMobile && onMobileOpenChange(false)}
          />
          <NavItem
            to="/analyze/report"
            icon={ToggleRight}
            label="What-If"
            expanded={showExpanded}
            disabled={!hasResult}
            onAfterNavigate={() => isMobile && onMobileOpenChange(false)}
          />
        </div>

        <p
          className={cn(
            "font-mono text-xs text-text-muted uppercase tracking-[2px] px-3 mb-1",
            !showExpanded && "sr-only",
          )}
        >
          Tools
        </p>
        <div className="space-y-0.5 mb-6">
          <NavItem
            to="/tax"
            icon={Scale}
            label="Tax Calculator"
            expanded={showExpanded}
            onAfterNavigate={() => isMobile && onMobileOpenChange(false)}
          />
          <NavItem
            to="/fire"
            icon={Target}
            label="FIRE Planner"
            expanded={showExpanded}
            onAfterNavigate={() => isMobile && onMobileOpenChange(false)}
          />
          <NavItem
            to="/mentor"
            icon={MessageCircle}
            label="AI Mentor"
            expanded={showExpanded}
            onAfterNavigate={() => isMobile && onMobileOpenChange(false)}
          />
        </div>

        <p
          className={cn(
            "font-mono text-xs text-text-muted uppercase tracking-[2px] px-3 mb-1",
            !showExpanded && "sr-only",
          )}
        >
          Other
        </p>
        <div className="space-y-0.5">
          <NavItem
            to="/demo"
            icon={Play}
            label="Try Demo"
            expanded={showExpanded}
            onAfterNavigate={() => isMobile && onMobileOpenChange(false)}
          />
        </div>
      </nav>

      <div className="mt-auto shrink-0 border-t border-white/[0.06] p-2 space-y-2">
        {!guestMode && hasResult && state.result ? (
          <div
            className={cn(
              "rounded-lg border border-white/[0.06] bg-white/[0.03] p-2",
              !showExpanded && "hidden",
            )}
          >
            <p className="font-syne text-xs text-text-muted mb-1">Last analysis</p>
            <p className="font-mono text-xs text-text-secondary">
              {state.result.portfolio_summary.total_funds} funds ·{" "}
              {compactINR(state.result.portfolio_summary.total_current_value)}
            </p>
            <span
              className="mt-1 inline-block rounded border px-1.5 py-0.5 font-mono text-xs"
              style={healthBadgeStyle(state.result.health_score.grade)}
            >
              {state.result.health_score.grade} · {state.result.health_score.score}
            </span>
          </div>
        ) : null}

        {guestMode ? (
          <div
            className={cn(
              "flex items-center gap-2 px-1",
              !showExpanded && "flex-col gap-2",
            )}
          >
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.08] font-syne text-xs font-medium text-text-muted"
              title="Guest"
            >
              ?
            </div>
            {showExpanded ? (
              <Link
                to="/login"
                className="min-w-0 flex-1 rounded-md border border-white/[0.08] px-2 py-1.5 text-center font-syne text-xs font-semibold text-accent hover:bg-white/[0.04] no-underline"
                onClick={() => isMobile && onMobileOpenChange(false)}
              >
                Sign in
              </Link>
            ) : (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Link
                    to="/login"
                    className="rounded-md p-2 text-accent hover:bg-white/[0.04] no-underline inline-flex"
                    aria-label="Sign in"
                    onClick={() => isMobile && onMobileOpenChange(false)}
                  >
                    <LogIn size={18} strokeWidth={1.5} />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">Sign in</TooltipContent>
              </Tooltip>
            )}
          </div>
        ) : (
          <div
            className={cn(
              "flex items-center gap-2 px-1",
              !showExpanded && "flex-col gap-2",
            )}
          >
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.08] font-syne text-xs font-medium text-text-primary"
              title={email}
            >
              {initial}
            </div>
            {showExpanded ? (
              <span className="min-w-0 flex-1 truncate font-syne text-xs text-text-muted">
                {email || "—"}
              </span>
            ) : null}
            {!showExpanded ? (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => void handleSignOut()}
                    className="rounded-md p-2 text-text-muted hover:text-[hsl(var(--negative))]"
                    aria-label="Sign out"
                  >
                    <LogOut size={18} strokeWidth={1.5} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">Sign out</TooltipContent>
              </Tooltip>
            ) : (
              <button
                type="button"
                onClick={() => void handleSignOut()}
                className="shrink-0 rounded-md p-2 text-text-muted hover:text-[hsl(var(--negative))]"
                aria-label="Sign out"
              >
                <LogOut size={18} strokeWidth={1.5} />
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
  );

  if (isMobile) {
    return (
      <>
        <button
          type="button"
          className="fixed inset-0 z-[55] bg-black/50 backdrop-blur-sm"
          aria-label="Close menu"
          onClick={() => onMobileOpenChange(false)}
        />
        {aside}
      </>
    );
  }

  return aside;
}
