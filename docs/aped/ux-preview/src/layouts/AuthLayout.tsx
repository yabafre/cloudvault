import { Outlet } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { FallingPattern } from '../components/ui/falling-pattern';

export function AuthLayout() {
  return (
    <div className="min-h-dvh flex bg-[var(--background)]">
      {/* Left — form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="flex flex-col items-center gap-1.5 mb-8">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <span className="text-sm font-semibold tracking-tight">CloudVault</span>
            </div>
            <p className="text-xs text-[var(--muted-foreground)]">Secure file storage you can trust</p>
          </div>
          <Outlet />
        </div>
      </div>

      {/* Right — FallingPattern */}
      <div className="hidden lg:block w-1/2 relative">
        <FallingPattern
          color="#10b981"
          speed={0.8}
          dotSize={1.5}
          gap={6}
          className="absolute inset-0 h-full w-full [mask-image:linear-gradient(to_right,transparent,black_30%)]"
        />
      </div>
    </div>
  );
}
