import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { gsap } from "gsap";
import { Button } from "@/components/ui/button";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { supabase } from "@/lib/supabase";
import { getAppLenis } from "@/lib/appLenis";

export default function Navbar() {
  const navigate = useNavigate();
  const navRef = useRef<HTMLElement>(null);
  const wordmarkRef = useRef<HTMLSpanElement | null>(null);
  const centerRef = useRef<HTMLSpanElement>(null);
  const btnRef = useRef<HTMLAnchorElement>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void supabase.auth.getSession().then(({ data }) => {
      if (!cancelled) setLoggedIn(Boolean(data.session?.access_token));
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(Boolean(session?.access_token));
    });
    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const ctx = gsap.context(() => {
      const refArray = [
        wordmarkRef.current,
        centerRef.current,
        btnRef.current,
      ].filter(Boolean);
      const tl = gsap.timeline({ delay: 0.1 });
      gsap.set(refArray, { opacity: 0, y: -8 });

      if (wordmarkRef.current) {
        tl.to(
          wordmarkRef.current,
          { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" },
          0.3,
        );
      }
      if (centerRef.current) {
        tl.to(
          centerRef.current,
          { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" },
          0.45,
        );
      }
      if (btnRef.current) {
        tl.to(
          btnRef.current,
          { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" },
          0.55,
        );
      }

      ScrollTrigger.create({
        start: "top -80px",
        onUpdate: (self) => {
          const el = navRef.current;
          if (!el) return;
          if (self.scroll() > 80) {
            el.style.background = "hsla(220,25%,6%,0.88)";
            el.style.borderBottomColor = "hsl(220 10% 20%)";
            el.style.backdropFilter = "blur(14px) saturate(1.4)";
          } else {
            el.style.background = "transparent";
            el.style.borderBottomColor = "transparent";
            el.style.backdropFilter = "none";
          }
        },
      });
    }, navRef);

    return () => ctx.revert();
  }, []);

  const scrollLandingToTop = () => {
    const lenis = getAppLenis();
    if (lenis) {
      lenis.scrollTo(0, { immediate: false });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const onWordmarkActivate = () => {
    if (loggedIn) {
      void navigate("/dashboard");
    } else {
      scrollLandingToTop();
    }
  };

  return (
    <nav
      ref={navRef}
      className="fixed top-0 left-0 right-0 z-[100] flex h-[52px] items-center px-6 md:px-10"
      style={{
        background: "transparent",
        borderBottom: "1px solid transparent",
      }}
    >
      <span
        ref={wordmarkRef}
        className="relative z-10 flex cursor-pointer items-center gap-2.5 md:gap-3 select-none"
        onClick={onWordmarkActivate}
        role="button"
        tabIndex={0}
        aria-label="ArthSaathi — home"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onWordmarkActivate();
          }
        }}
      >
        <picture className="pointer-events-none block h-7 w-7 shrink-0 md:h-8 md:w-8">
          <source type="image/webp" srcSet="/logo.webp" />
          <img
            src="/logo.png"
            alt=""
            width={32}
            height={32}
            className="h-full w-full object-contain object-center"
            decoding="async"
          />
        </picture>
        <span
          className="font-fraunces text-text-primary text-[0.95rem] md:text-[1.05rem] leading-none tracking-tight"
          style={{ fontVariationSettings: "'opsz' 72, 'wght' 700" }}
        >
          ArthSaathi
        </span>
      </span>

      <span
        ref={centerRef}
        className="pointer-events-auto absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 md:flex md:items-center md:gap-6"
      >
        <a
          href="#problem"
          className="font-syne text-[13px] text-text-muted hover:text-text-secondary transition-colors no-underline"
        >
          Problem
        </a>
        <a
          href="#how-it-works"
          className="font-syne text-[13px] text-text-muted hover:text-text-secondary transition-colors no-underline"
        >
          How It Works
        </a>
        <a
          href="#features"
          className="font-syne text-[13px] text-text-muted hover:text-text-secondary transition-colors no-underline"
        >
          Features
        </a>
        <a
          href="#impact"
          className="font-syne text-[13px] text-text-muted hover:text-text-secondary transition-colors no-underline"
        >
          Impact
        </a>
      </span>

      <div className="relative z-10 ml-auto flex items-center gap-2">
        <div className="hidden md:flex items-center gap-2">
          {!loggedIn ? (
            <Link
              to="/demo"
              className="font-syne text-[13px] text-text-secondary hover:text-text-primary h-[34px] px-4 rounded-[7px] border border-white/[0.06] hover:border-white/[0.12] transition-all inline-flex items-center justify-center no-underline"
            >
              View Demo
            </Link>
          ) : null}
          <Link
            ref={btnRef}
            to={loggedIn ? "/dashboard" : "/login"}
            className="font-syne font-semibold text-[13px] bg-accent text-white h-[34px] px-4 rounded-[7px] transition-transform duration-150 hover:-translate-y-0.5 active:scale-[0.97] inline-flex items-center justify-center no-underline"
          >
            {loggedIn ? "Open App" : "Sign in"}
          </Link>
        </div>

        <button
          type="button"
          className="md:hidden flex items-center justify-center h-9 w-9 rounded-lg text-text-muted hover:text-text-secondary"
          onClick={() => setMobileMenuOpen((o) => !o)}
          aria-expanded={mobileMenuOpen}
          aria-label={mobileMenuOpen ? "Close menu" : "Menu"}
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {mobileMenuOpen ? (
        <div
          className="md:hidden fixed top-[52px] left-0 right-0 z-[99] px-6 py-4 space-y-1"
          style={{
            background: "hsl(220 25% 6% / 0.96)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            backdropFilter: "blur(16px)",
          }}
        >
          <a
            href="#problem"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2.5 font-syne text-sm text-text-secondary hover:text-text-primary no-underline"
          >
            Problem
          </a>
          <a
            href="#how-it-works"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2.5 font-syne text-sm text-text-secondary hover:text-text-primary no-underline"
          >
            How It Works
          </a>
          <a
            href="#features"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2.5 font-syne text-sm text-text-secondary hover:text-text-primary no-underline"
          >
            Features
          </a>
          <a
            href="#impact"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2.5 font-syne text-sm text-text-secondary hover:text-text-primary no-underline"
          >
            Impact
          </a>
          <div className="pt-3 border-t border-white/[0.06] flex flex-col gap-2.5">
            {!loggedIn ? (
              <Button
                asChild
                variant="navOutline"
                size="default"
                className="w-full justify-center"
              >
                <Link
                  to="/demo"
                  onClick={() => setMobileMenuOpen(false)}
                  className="no-underline"
                >
                  View Demo
                </Link>
              </Button>
            ) : null}
            <Button
              asChild
              variant="navPrimary"
              size="default"
              className="w-full justify-center"
            >
              <Link
                to={loggedIn ? "/dashboard" : "/login"}
                onClick={() => setMobileMenuOpen(false)}
                className="no-underline"
              >
                {loggedIn ? "Open App" : "Sign in"}
              </Link>
            </Button>
          </div>
        </div>
      ) : null}
    </nav>
  );
}
