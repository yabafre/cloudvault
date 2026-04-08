import { useEffect, useRef, type ReactNode } from 'react';

function BentoItem({ className = '', children }: { className?: string; children: ReactNode }) {
  const itemRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const item = itemRef.current;
    if (!item) return;
    const handleMouseMove = (e: MouseEvent) => {
      const rect = item.getBoundingClientRect();
      item.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
      item.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
    };
    item.addEventListener('mousemove', handleMouseMove);
    return () => item.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div ref={itemRef} className={`bento-item ${className}`}>
      {children}
    </div>
  );
}

export function CyberneticBentoGrid() {
  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="bento-grid">
        {/* Row 1-2: Direct S3 Upload (2x2) + EU Hosted + AES-256 */}
        <BentoItem className="col-span-2 row-span-2 flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-bold">Direct S3 Upload</h3>
            <p className="mt-2 text-[var(--muted-foreground)] text-sm">Files upload directly to AWS S3 via pre-signed URLs. No server bottleneck — just raw speed.</p>
          </div>
          <div className="mt-4 h-48 bg-emerald-500/5 border border-emerald-500/10 rounded-lg flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-emerald-500">
              <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
              <span className="text-xs font-medium">Browser → S3 (no transit)</span>
            </div>
          </div>
        </BentoItem>
        <BentoItem>
          <h3 className="text-lg font-bold">EU Hosted</h3>
          <p className="mt-2 text-[var(--muted-foreground)] text-sm">AWS eu-west-3 (Paris). Your data never leaves Europe.</p>
        </BentoItem>
        <BentoItem>
          <h3 className="text-lg font-bold">AES-256</h3>
          <p className="mt-2 text-[var(--muted-foreground)] text-sm">Every file encrypted at rest. Zero-access to your content.</p>
        </BentoItem>

        {/* Row 3: Auto Thumbnails + CI/CD Pipeline (2x1) */}
        <BentoItem>
          <h3 className="text-lg font-bold">Auto Thumbnails</h3>
          <p className="mt-2 text-[var(--muted-foreground)] text-sm">Serverless Lambda generates 200x200 previews within seconds of upload.</p>
          <div className="mt-3 flex gap-1.5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 w-8 rounded bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-center text-[8px] text-emerald-500/60">img</div>
            ))}
          </div>
        </BentoItem>
        <BentoItem className="col-span-2">
          <h3 className="text-lg font-bold">CI/CD Pipeline</h3>
          <p className="mt-2 text-[var(--muted-foreground)] text-sm">GitHub Actions → Docker → EC2. Automated lint, test, build, and deploy on every merge to main.</p>
        </BentoItem>

        {/* Row 4: GDPR Ready + Cloudflare WAF + Open Source */}
        <BentoItem>
          <h3 className="text-lg font-bold">GDPR Ready</h3>
          <p className="mt-2 text-[var(--muted-foreground)] text-sm">Right to erasure, audit logs, and data portability built-in.</p>
        </BentoItem>
        <BentoItem>
          <h3 className="text-lg font-bold">Cloudflare WAF</h3>
          <p className="mt-2 text-[var(--muted-foreground)] text-sm">DDoS protection, SSL/TLS, and rate limiting out of the box.</p>
        </BentoItem>
        <BentoItem>
          <h3 className="text-lg font-bold">Open Source</h3>
          <p className="mt-2 text-[var(--muted-foreground)] text-sm">Fully transparent codebase. Audit the code, contribute, or self-host.</p>
        </BentoItem>
      </div>
    </div>
  );
}
