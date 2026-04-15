import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { Button } from '../components/ui/button';
import { FallingPattern } from '../components/ui/falling-pattern';

export function NotFound() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-[var(--background)] p-6 relative overflow-hidden">
      <FallingPattern
        color="#10b981"
        speed={0.6}
        dotSize={1.5}
        gap={6}
        className="absolute inset-0 h-full w-full [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_70%)]"
      />
      <div className="text-center max-w-sm relative z-10">
        <div className="h-14 w-14 rounded-2xl bg-[var(--secondary)] border border-[var(--border)] flex items-center justify-center mx-auto mb-6">
          <ShieldAlert className="h-7 w-7 text-[var(--muted-foreground)]" />
        </div>
        <h1 className="text-4xl font-bold tracking-tighter mb-2">404</h1>
        <p className="text-sm text-[var(--muted-foreground)] mb-6">
          This page doesn't exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link to="/">
            <Button variant="outline" size="sm" className="gap-2">
              <Home className="h-3 w-3" />
              Home
            </Button>
          </Link>
          <Button size="sm" className="gap-2" onClick={() => window.history.back()}>
            <ArrowLeft className="h-3 w-3" />
            Go back
          </Button>
        </div>
      </div>
    </div>
  );
}
