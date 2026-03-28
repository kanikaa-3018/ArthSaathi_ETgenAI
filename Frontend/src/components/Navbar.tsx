import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { supabase } from "@/lib/supabase";

export default function Navbar() {
  const navigate = useNavigate();
  const navRef = useRef<HTMLElement>(null);
  const wordmarkRef = useRef<HTMLSpanElement>(null);
  const centerRef = useRef<HTMLSpanElement>(null);
  const btnRef = useRef<HTMLAnchorElement>(null);
  const [loggedIn, setLoggedIn] = useState(false);

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

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

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

    const trigger = ScrollTrigger.create({
      start: "top -80px",
      onEnter: () => {
        gsap.to(nav, {
          backgroundColor: "hsla(220,25%,6%,0.88)",
          borderBottomColor: "hsl(220 10% 20%)",
          backdropFilter: "blur(14px) saturate(1.4)",
          duration: 0.5,
          ease: "cubic-bezier(0.16,1,0.3,1)",
        });
      },
      onLeaveBack: () => {
        gsap.to(nav, {
          backgroundColor: "transparent",
          borderBottomColor: "transparent",
          backdropFilter: "none",
          duration: 0.5,
        });
      },
    });

    return () => {
      trigger.kill();
      tl.kill();
    };
  }, []);

  return (
    <nav
      ref={navRef}
      className="fixed top-0 left-0 right-0 h-[52px] z-[100] flex items-center justify-between px-6 md:px-10"
      style={{
        background: "transparent",
        borderBottom: "1px solid transparent",
      }}
    >
      <span
        ref={wordmarkRef}
        className="font-fraunces text-text-primary text-sm cursor-pointer"
        style={{ fontVariationSettings: "'opsz' 72, 'wght' 700" }}
        onClick={() => navigate("/")}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            navigate("/");
          }
        }}
      >
        ArthSaathi
      </span>

      <span ref={centerRef} className="hidden md:flex items-center gap-6">
        <Link
          to="/analyze"
          className="font-syne text-[13px] text-text-muted hover:text-text-secondary transition-colors no-underline"
        >
          X-Ray
        </Link>
        <Link
          to="/tax"
          className="font-syne text-[13px] text-text-muted hover:text-text-secondary transition-colors no-underline"
        >
          Tax
        </Link>
        <Link
          to="/fire"
          className="font-syne text-[13px] text-text-muted hover:text-text-secondary transition-colors no-underline"
        >
          FIRE
        </Link>
        <Link
          to="/mentor"
          className="font-syne text-[13px] text-text-muted hover:text-text-secondary transition-colors no-underline"
        >
          Mentor
        </Link>
      </span>

      <div className="flex items-center gap-2">
        <Link
          ref={btnRef}
          to={loggedIn ? "/analyze" : "/login"}
          className="font-syne font-semibold text-[13px] bg-accent text-white h-[34px] px-4 rounded-[7px] transition-transform duration-150 hover:-translate-y-0.5 active:scale-[0.97] inline-flex items-center justify-center no-underline"
        >
          {loggedIn ? "Open App" : "Sign in"}
        </Link>
      </div>
    </nav>
  );
}
