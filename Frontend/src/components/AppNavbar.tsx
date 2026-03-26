import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { isAuthenticated, clearToken, fetchMe } from '@/lib/auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const NAV_LINKS = [
  { to: '/analyze', label: 'X-Ray' },
  { to: '/tax', label: 'Tax' },
  { to: '/fire', label: 'FIRE' },
  { to: '/mentor', label: 'Mentor' },
];

export function AppNavbar() {
  const navigate = useNavigate();
  const [userInitial, setUserInitial] = useState('A');
  const [userEmail, setUserEmail] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) {
      fetchMe()
        .then((u) => {
          setUserEmail(u.email || u.username || '');
          const display = u.username || u.email || '';
          setUserInitial(display.charAt(0).toUpperCase());
        })
        .catch(() => {/* no-op — stay with default initial */});
    }
  }, []);

  const signOut = () => {
    clearToken();
    navigate('/');
  };

  const activeStyle = {
    color: 'hsl(var(--text-primary))',
    borderBottom: '2px solid hsl(var(--accent))',
    paddingBottom: '2px',
  };
  const inactiveStyle = {
    color: 'hsl(var(--text-muted))',
    borderBottom: '2px solid transparent',
    paddingBottom: '2px',
  };

  return (
    <nav
      className="fixed top-0 left-0 right-0 h-12 z-50 flex items-center justify-between px-6"
      style={{
        background: 'hsla(220, 25%, 6%, 0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid hsl(220 10% 14%)',
      }}
    >
      {/* Wordmark */}
      <span
        className="font-fraunces text-sm text-text-primary cursor-pointer shrink-0"
        style={{ fontVariationSettings: "'opsz' 72, 'wght' 700" }}
        onClick={() => navigate('/')}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter') navigate('/'); }}
      >
        ArthSaathi
      </span>

      {/* Center nav — desktop */}
      <div className="hidden md:flex items-center gap-8">
        {NAV_LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className="font-syne text-[13px] font-medium transition-colors"
            style={({ isActive }) => (isActive ? activeStyle : inactiveStyle)}
          >
            {link.label}
          </NavLink>
        ))}
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        {/* Avatar + dropdown — desktop */}
        {isAuthenticated() ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="w-7 h-7 rounded-full flex items-center justify-center font-syne text-[13px] font-medium text-text-primary shrink-0 cursor-pointer"
                style={{ background: 'rgba(255,255,255,0.08)' }}
              >
                {userInitial}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="font-syne"
              style={{
                background: 'hsl(var(--bg-raised))',
                border: '1px solid rgba(255,255,255,0.06)',
                minWidth: 180,
              }}
            >
              {userEmail ? (
                <div className="px-3 py-2">
                  <p className="font-syne text-[12px] text-text-muted truncate">{userEmail}</p>
                </div>
              ) : null}
              <DropdownMenuSeparator style={{ background: 'rgba(255,255,255,0.06)' }} />
              <DropdownMenuItem
                className="font-syne text-[13px] text-text-secondary cursor-pointer focus:bg-white/5"
                onClick={signOut}
              >
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <button
            className="font-syne text-[13px] text-text-muted hover:text-text-secondary transition-colors"
            onClick={() => navigate('/login')}
          >
            Sign in
          </button>
        )}

        {/* Hamburger — mobile */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <button
              className="md:hidden flex flex-col gap-1 p-1"
              aria-label="Open menu"
            >
              <span className="w-4 h-[1.5px] bg-text-secondary" />
              <span className="w-4 h-[1.5px] bg-text-secondary" />
              <span className="w-4 h-[1.5px] bg-text-secondary" />
            </button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="p-0 w-[260px]"
            style={{ background: 'hsl(var(--bg-raised))', border: 'none' }}
          >
            <div className="flex flex-col h-full">
              <div className="px-6 py-5 border-b border-white/[0.06]">
                <span
                  className="font-fraunces text-base text-text-primary"
                  style={{ fontVariationSettings: "'opsz' 72, 'wght' 700" }}
                >
                  ArthSaathi
                </span>
              </div>
              <nav className="flex-1 px-4 py-4">
                {NAV_LINKS.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className="block py-3 border-b border-white/[0.06] font-syne text-[14px]"
                    style={({ isActive }) => ({
                      color: isActive ? 'hsl(var(--text-primary))' : 'hsl(var(--text-secondary))',
                    })}
                    onClick={() => setSheetOpen(false)}
                  >
                    {link.label}
                  </NavLink>
                ))}
              </nav>
              {userEmail && (
                <div className="px-4 py-4 border-t border-white/[0.06]">
                  <p className="font-syne text-[12px] text-text-muted mb-3 truncate">{userEmail}</p>
                  <button
                    className="font-syne text-[13px] text-text-secondary hover:text-text-primary transition-colors"
                    onClick={() => { setSheetOpen(false); signOut(); }}
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
