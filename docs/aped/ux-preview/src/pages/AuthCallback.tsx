import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, CheckCircle2, AlertCircle } from 'lucide-react';
import { FallingPattern } from '../components/ui/falling-pattern';
import { TextShimmer } from '../components/ui/text-shimmer';
import { Button } from '../components/ui/button';

type CallbackState = 'loading' | 'success' | 'error';

export function AuthCallback() {
  const navigate = useNavigate();
  const [state, setState] = useState<CallbackState>('loading');

  useEffect(() => {
    // Simulate OAuth token exchange
    const timer = setTimeout(() => {
      setState('success');
      setTimeout(() => navigate('/dashboard'), 800);
    }, 2000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-dvh flex items-center justify-center bg-[var(--background)] p-6 relative overflow-hidden">
      <FallingPattern
        color="#10b981"
        speed={0.6}
        dotSize={1.5}
        gap={6}
        className="absolute inset-0 h-full w-full [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_70%)]"
      />

      <div className="relative z-10 text-center max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Shield className="h-5 w-5 text-emerald-500" />
          <span className="text-sm font-semibold tracking-tight">CloudVault</span>
        </div>

        {state === 'loading' && (
          <>
            <div className="h-14 w-14 rounded-2xl bg-[var(--secondary)] border border-[var(--border)] flex items-center justify-center mx-auto mb-5">
              <div className="h-7 w-7 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
            </div>
            <h1 className="text-lg font-bold tracking-tight mb-2">Finishing sign in…</h1>
            <TextShimmer className="text-xs inline-block" duration={2}>
              Exchanging credentials with Google
            </TextShimmer>
          </>
        )}

        {state === 'success' && (
          <>
            <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="h-7 w-7 text-emerald-500" />
            </div>
            <h1 className="text-lg font-bold tracking-tight mb-2">Signed in successfully</h1>
            <p className="text-xs text-[var(--muted-foreground)]">Redirecting to your dashboard…</p>
          </>
        )}

        {state === 'error' && (
          <>
            <div className="h-14 w-14 rounded-2xl bg-[var(--destructive)]/10 border border-[var(--destructive)]/20 flex items-center justify-center mx-auto mb-5">
              <AlertCircle className="h-7 w-7 text-[var(--destructive)]" />
            </div>
            <h1 className="text-lg font-bold tracking-tight mb-2">Sign in failed</h1>
            <p className="text-xs text-[var(--muted-foreground)] mb-5">
              We couldn't complete your Google sign in. Please try again.
            </p>
            <Button size="sm" onClick={() => navigate('/auth/login')}>
              Back to login
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
