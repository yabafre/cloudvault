import { Link } from 'react-router-dom';
import { Shield, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { ThemeToggle } from '../components/ui/theme-toggle';
import { FallingPattern } from '../components/ui/falling-pattern';
import { TextShimmer } from '../components/ui/text-shimmer';
import AgentPlan from '../components/ui/agent-plan';
import DatabaseWithRestApi from '../components/ui/database-rest-api';
import { CyberneticBentoGrid } from '../components/ui/bento-grid';
import { FeaturesSection } from '../components/ui/features-section';

export function Landing() {
  return (
    <div className="min-h-dvh flex flex-col bg-[var(--background)]">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[var(--background)]/60">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-14">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <span className="text-sm font-semibold tracking-tight">CloudVault</span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle className="scale-75" />
            <Link to="/auth/login">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link to="/auth/register">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero + FallingPattern */}
      <section className="relative overflow-hidden">
        <FallingPattern
          color="#10b981"
          speed={0.8}
          dotSize={1.5}
          gap={6}
          className="absolute inset-0 h-full w-full [mask-image:linear-gradient(to_bottom,black_50%,transparent_100%)]"
        />
        <div className="relative z-10 max-w-4xl mx-auto px-6 pt-28 pb-24 text-center">
          <TextShimmer className="text-xs font-mono mb-6 inline-block" duration={1.5}>
            Privacy-first cloud storage — now in beta
          </TextShimmer>
          <h1 className="text-5xl lg:text-7xl font-bold tracking-tighter leading-[1.08] mb-5">
            Your files.
            <br />
            <span className="text-[var(--muted-foreground)]">Secured in the cloud.</span>
          </h1>
          <p className="text-base lg:text-lg text-[var(--muted-foreground)] max-w-xl mx-auto mb-8 leading-relaxed">
            Upload, manage, and share files with confidence. EU-hosted, encrypted,
            transparent — no tracking, no surprises.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/auth/register">
              <Button size="lg" className="gap-2">
                Start Free — 5 GB
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="outline" size="lg">Live Demo</Button>
            </Link>
          </div>
          <p className="text-xs text-[var(--muted-foreground)] mt-4">No credit card required</p>
        </div>
      </section>

      {/* Features */}
      <FeaturesSection />

      {/* Architecture */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-medium uppercase tracking-widest text-[var(--muted-foreground)] mb-2">Architecture</p>
            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight">
              Built on AWS. Designed for security.
            </h2>
          </div>
          <div className="flex justify-center">
            <DatabaseWithRestApi />
          </div>
        </div>
      </section>

      {/* Bento Grid */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-medium uppercase tracking-widest text-[var(--muted-foreground)] mb-2">Core</p>
            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight">
              Everything you need. Nothing you don't.
            </h2>
          </div>
          <CyberneticBentoGrid />
        </div>
      </section>

      {/* Roadmap */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-medium uppercase tracking-widest text-[var(--muted-foreground)] mb-2">Roadmap</p>
            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight">
              Shipping in the open
            </h2>
            <p className="text-[var(--muted-foreground)] mt-3 text-sm">
              Track our development progress in real-time.
            </p>
          </div>
          <AgentPlan />
        </div>
      </section>

      {/* CTA + Footer with FallingPattern */}
      <section className="relative overflow-hidden">
        <FallingPattern
          color="#10b981"
          speed={0.8}
          dotSize={1.5}
          gap={6}
          className="absolute inset-0 h-full w-full [mask-image:linear-gradient(to_top,black_50%,transparent_100%)]"
        />
        <div className="relative z-10">
          {/* CTA */}
          <div className="py-24 px-6 text-center">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-3xl lg:text-4xl font-bold tracking-tight mb-4">
                Ready to secure your files?
              </h2>
              <p className="text-[var(--muted-foreground)] mb-8">
                Start with 5 GB of free, encrypted, EU-hosted storage.
              </p>
              <Link to="/auth/register">
                <Button size="lg" className="gap-2">
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Footer */}
          <footer className="py-8 px-6">
            <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                <Shield className="h-4 w-4" />
                <span>CloudVault</span>
              </div>
              <p className="text-xs text-[var(--muted-foreground)]">
                EU hosted · AES-256 encrypted · GDPR compliant
              </p>
            </div>
          </footer>
        </div>
      </section>
    </div>
  );
}
