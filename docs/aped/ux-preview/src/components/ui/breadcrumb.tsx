import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

const labels: Record<string, string> = {
  dashboard: 'Dashboard',
  files: 'Files',
  profile: 'Profile',
};

export function Breadcrumb({ className }: { className?: string }) {
  const { pathname } = useLocation();
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center gap-1 text-[10px] text-[var(--muted-foreground)]', className)}>
      <Link to="/dashboard" className="hover:text-[var(--foreground)] transition-colors">
        Home
      </Link>
      {segments.map((segment, i) => {
        const path = '/' + segments.slice(0, i + 1).join('/');
        const isLast = i === segments.length - 1;
        const label = labels[segment] || segment;

        return (
          <span key={path} className="flex items-center gap-1">
            <ChevronRight className="h-2.5 w-2.5" />
            {isLast ? (
              <span className="text-[var(--foreground)] font-medium">{label}</span>
            ) : (
              <Link to={path} className="hover:text-[var(--foreground)] transition-colors">
                {label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
