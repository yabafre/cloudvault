import { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import {
  Shield,
  LayoutDashboard,
  FolderOpen,
  User,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { ThemeToggle } from '../components/ui/theme-toggle';
import { FallingPattern } from '../components/ui/falling-pattern';
import { Breadcrumb } from '../components/ui/breadcrumb';
import { currentUser } from '../data/mock';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/files', icon: FolderOpen, label: 'Files' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="h-dvh flex flex-col lg:flex-row bg-[var(--background)] overflow-hidden">
      <a href="#main-content" className="skip-to-main">
        Skip to main content
      </a>

      {/* ─── Mobile header (fixed top) ─── */}
      <header className="lg:hidden flex-shrink-0 flex items-center justify-between px-4 h-12 border-b border-[var(--border)] z-50 bg-[var(--background)]">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          <span className="text-xs font-semibold tracking-tight">CloudVault</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle className="scale-75 origin-right" />
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </header>

      {/* ─── Sidebar: fixed height, never scrolls ─── */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-56 bg-[var(--background)] border-r border-[var(--border)]
          flex flex-col h-dvh
          transform transition-transform duration-200 ease-out
          lg:relative lg:translate-x-0
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo — pinned top */}
        <div className="flex-shrink-0 hidden lg:flex items-center justify-between px-5 h-12 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-emerald-500" />
            <span className="text-xs font-semibold tracking-tight">CloudVault</span>
          </div>
          <ThemeToggle className="scale-75 origin-right" />
        </div>

        {/* Navigation — fills middle, scrolls only if many items */}
        <nav className="flex-1 min-h-0 overflow-y-auto py-3 px-2" aria-label="Main navigation">
          <ul className="flex flex-col gap-0.5">
            {navItems.map(({ to, icon: Icon, label }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  onClick={() => setMobileOpen(false)}
                  className={`
                    flex items-center gap-2.5 px-2.5 py-1.5 rounded-[8px] text-xs font-medium
                    transition-colors duration-150
                    ${location.pathname === to
                      ? 'bg-[var(--secondary)] text-[var(--foreground)] border border-[var(--border)]'
                      : 'text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)] border border-transparent'
                    }
                  `}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* User — pinned bottom */}
        <div className="flex-shrink-0 p-2 border-t border-[var(--border)]">
          <div className="flex items-center gap-2.5 px-2.5 py-2">
            <div className="h-6 w-6 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] font-medium text-white flex-shrink-0 relative overflow-hidden">
              <span className="relative z-10">{currentUser.name.charAt(0)}</span>
              <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent"></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{currentUser.name}</p>
              <p className="text-[10px] text-[var(--muted-foreground)] truncate">{currentUser.email}</p>
            </div>
            <Button variant="ghost" size="icon" aria-label="Sign out" className="h-6 w-6">
              <LogOut className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ─── Main content: only this zone scrolls ─── */}
      <main id="main-content" className="flex-1 min-h-0 overflow-y-auto relative" tabIndex={-1}>
        <FallingPattern
          color="#10b981"
          speed={0.6}
          dotSize={1}
          gap={8}
          className="fixed inset-0 h-full w-full opacity-30 pointer-events-none [mask-image:radial-gradient(ellipse_at_top_right,black,transparent_60%)] z-0"
        />

        {/* Breadcrumb bar — same h-12 as sidebar header for alignment */}
        <div className="sticky top-0 z-20 bg-[var(--background)]/80 backdrop-blur-sm border-b border-[var(--border)] px-6 h-12 flex items-center">
          <Breadcrumb />
        </div>

        {/* Page content */}
        <div className="relative z-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
