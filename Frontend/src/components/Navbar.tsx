import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { isAuthenticated, clearToken } from '@/lib/auth';

export default function Navbar() {
  const navigate = useNavigate();
  const navRef = useRef<HTMLElement>(null);
  const [counter, setCounter] = useState(28538);
  const [loggedIn, setLoggedIn] = useState(isAuthenticated());
  const counterRef = useRef<HTMLSpanElement>(null);
  const wordmarkRef = useRef<HTMLSpanElement>(null);
  const centerRef = useRef<HTMLSpanElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    // Entrance animation - filter out null refs
    const refArray = [wordmarkRef.current, centerRef.current, btnRef.current].filter(Boolean);
    const tl = gsap.timeline({ delay: 0.1 });
    gsap.set(refArray, { opacity: 0, y: -8 });
    
    if (wordmarkRef.current) {
      tl.to(wordmarkRef.current, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, 0.3);
    }
    if (centerRef.current) {
      tl.to(centerRef.current, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, 0.45);
    }
    if (btnRef.current) {
      tl.to(btnRef.current, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, 0.55);
    }

    const trigger = ScrollTrigger.create({
      start: 'top -80px',
      onEnter: () => {
        gsap.to(nav, {
          backgroundColor: 'hsla(220,25%,6%,0.88)',
          borderBottomColor: 'hsl(220 10% 20%)',
          backdropFilter: 'blur(14px) saturate(1.4)',
          duration: 0.5,
          ease: 'cubic-bezier(0.16,1,0.3,1)',
        });
      },
      onLeaveBack: () => {
        gsap.to(nav, {
          backgroundColor: 'transparent',
          borderBottomColor: 'transparent',
          backdropFilter: 'none',
          duration: 0.5,
        });
      },
    });

    return () => {
      trigger.kill();
      tl.kill();
    };
  }, []);

  useEffect(() => {
    const increment = 28538 / 60;
    const interval = setInterval(() => {
      setCounter(prev => prev + increment);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const displayNum = Math.floor(counter).toLocaleString('en-IN');

  return (
    <nav
      ref={navRef}
      className="fixed top-0 left-0 right-0 h-[52px] z-[100] flex items-center justify-between px-6 md:px-10"
      style={{
        background: 'transparent',
        borderBottom: '1px solid transparent',
      }}
    >
      <span
        ref={wordmarkRef}
        className="font-fraunces text-text-primary text-sm cursor-pointer"
        style={{ fontVariationSettings: "'opsz' 72, 'wght' 700" }}
        onClick={() => window.location.assign('/')}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            window.location.assign('/');
          }
        }}
      >
        ArthSaathi
      </span>

      <span ref={centerRef} className="hidden md:flex items-center gap-1 text-[12px]">
        <span className="font-mono text-negative font-medium" ref={counterRef}>
          ₹{displayNum}
        </span>
        <span className="font-syne text-text-muted">/sec drained from India's investors</span>
      </span>

      <div className="flex items-center gap-2">
        <button
          ref={btnRef}
          className="font-syne font-semibold text-[13px] bg-accent text-white h-[34px] px-4 rounded-[7px] transition-transform duration-150 hover:-translate-y-0.5 active:scale-[0.97]"
          onClick={() => {
            if (loggedIn) {
              navigate('/analyze');
            } else {
              navigate('/login');
            }
          }}
        >
          {loggedIn ? 'Analyze Portfolio' : 'Login to Analyze'}
        </button>
        {loggedIn ? (
          <button
            className="font-syne font-semibold text-[13px] border border-white/20 text-white h-[34px] px-4 rounded-[7px] hover:bg-white/10"
            onClick={() => {
              clearToken();
              setLoggedIn(false);
              navigate('/login');
            }}
          >
            Logout
          </button>
        ) : (
          <button
            className="font-syne font-semibold text-[13px] border border-white/20 text-white h-[34px] px-4 rounded-[7px] hover:bg-white/10"
            onClick={() => navigate('/login')}
          >
            Login
          </button>
        )}
      </div>
    </nav>
  );
}
