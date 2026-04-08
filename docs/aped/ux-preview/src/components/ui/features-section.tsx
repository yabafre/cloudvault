import { Zap, Lock, Sparkles, Globe, Upload, ShieldCheck, HardDrive, Share2 } from 'lucide-react';

const steps = [
  { icon: Upload, label: 'Upload', desc: 'Direct to S3' },
  { icon: ShieldCheck, label: 'Encrypt', desc: 'AES-256' },
  { icon: HardDrive, label: 'Store', desc: 'eu-west-3' },
  { icon: Share2, label: 'Share', desc: 'Pre-signed URL' },
];

export function FeaturesSection() {
  return (
    <section className="py-20 px-6">
      <div className="mx-auto max-w-6xl space-y-16">
        <div className="relative z-10 grid items-center gap-4 md:grid-cols-2 md:gap-12">
          <h2 className="text-3xl lg:text-4xl font-semibold tracking-tight">CloudVault brings together security and simplicity</h2>
          <p className="max-w-sm sm:ml-auto text-[var(--muted-foreground)]">Empower your workflow with file storage that adapts to your needs — whether you're a freelancer, a small team, or building your next SaaS.</p>
        </div>

        {/* Card with pipeline flow inside */}
        <div className="relative rounded-3xl">
          <div className="aspect-[88/36] relative rounded-2xl overflow-hidden border border-[var(--border)] bg-[var(--card)]">
            {/* Grid background pattern */}
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage: `linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)`,
                backgroundSize: '40px 40px',
              }}
            />

            {/* Pipeline flow centered */}
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="flex items-center gap-3 sm:gap-6">
                {steps.map(({ icon: Icon, label, desc }, i) => (
                  <div key={label} className="flex items-center gap-3 sm:gap-6">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-[var(--background)] border border-[var(--border)] flex items-center justify-center shadow-sm">
                        <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-500" />
                      </div>
                      <div className="text-center">
                        <p className="text-xs sm:text-sm font-medium">{label}</p>
                        <p className="text-[10px] text-[var(--muted-foreground)] hidden sm:block">{desc}</p>
                      </div>
                    </div>
                    {i < steps.length - 1 && (
                      <div className="w-8 sm:w-12 h-px bg-[var(--border)] relative mb-6">
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-t-[3px] border-t-transparent border-b-[3px] border-b-transparent border-l-[5px] border-l-[var(--muted-foreground)]" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom fade */}
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[var(--card)] to-transparent z-[2]" />
            {/* Top fade */}
            <div className="absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-[var(--card)] to-transparent z-[2]" />
          </div>
        </div>

        {/* Feature details */}
        <div className="relative mx-auto grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-8 lg:grid-cols-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="size-4 text-emerald-500" />
              <h3 className="text-sm font-medium">Lightning Fast</h3>
            </div>
            <p className="text-[var(--muted-foreground)] text-sm">Direct S3 uploads bypass the server entirely. 5MB files in under 10 seconds.</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Lock className="size-4 text-emerald-500" />
              <h3 className="text-sm font-medium">Encrypted</h3>
            </div>
            <p className="text-[var(--muted-foreground)] text-sm">AES-256 at rest, TLS 1.3 in transit. Pre-signed URLs expire in 15 minutes.</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Globe className="size-4 text-emerald-500" />
              <h3 className="text-sm font-medium">EU Compliant</h3>
            </div>
            <p className="text-[var(--muted-foreground)] text-sm">All data stored in AWS Paris. GDPR compliant with right to erasure built-in.</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-emerald-500" />
              <h3 className="text-sm font-medium">Auto Thumbnails</h3>
            </div>
            <p className="text-[var(--muted-foreground)] text-sm">Serverless Lambda generates previews instantly. No manual processing needed.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
