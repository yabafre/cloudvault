import Link from 'next/link'
import { Cloud, Shield, Zap, Users, ArrowRight, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ModeToggle } from '@/components/common/mode-toggle'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-black">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Cloud className="h-6 w-6 text-primary" />
            <span>CloudVault</span>
          </Link>
          <nav className="flex items-center gap-4">
            <ModeToggle />
            <Link href="/auth/login">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link href="/auth/register">
              <Button size="sm">Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container py-24 md:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Secure File Storage
            <span className="block text-primary">Made Simple</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground md:text-xl">
            Store, share, and manage your files securely in the cloud.
            CloudVault provides enterprise-grade security with a simple,
            intuitive interface.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link href="/auth/register">
              <Button size="lg" className="w-full sm:w-auto">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container py-24 border-t">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold tracking-tight">
            Why Choose CloudVault?
          </h2>
          <p className="mt-4 text-center text-muted-foreground">
            Everything you need to securely store and share your files
          </p>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            <FeatureCard
              icon={<Shield className="h-8 w-8" />}
              title="Bank-Grade Security"
              description="Your files are encrypted at rest and in transit with AES-256 encryption."
            />
            <FeatureCard
              icon={<Zap className="h-8 w-8" />}
              title="Lightning Fast"
              description="Upload and download files at blazing speeds with our global CDN."
            />
            <FeatureCard
              icon={<Users className="h-8 w-8" />}
              title="Easy Sharing"
              description="Share files securely with anyone using time-limited links."
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container py-24 border-t">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold tracking-tight">
            Simple, Transparent Pricing
          </h2>
          <p className="mt-4 text-center text-muted-foreground">
            Start free, upgrade when you need more
          </p>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            <PricingCard
              name="Free"
              price="$0"
              description="Perfect for personal use"
              features={['5 GB storage', 'Basic sharing', 'Email support']}
            />
            <PricingCard
              name="Pro"
              price="$9"
              description="For power users"
              features={['100 GB storage', 'Advanced sharing', 'Priority support', 'Version history']}
              highlighted
            />
            <PricingCard
              name="Team"
              price="$29"
              description="For teams and businesses"
              features={['1 TB storage', 'Team collaboration', '24/7 support', 'Admin controls', 'SSO integration']}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-24 border-t">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight">
            Ready to get started?
          </h2>
          <p className="mt-4 text-muted-foreground">
            Join thousands of users who trust CloudVault with their files.
          </p>
          <div className="mt-8">
            <Link href="/auth/register">
              <Button size="lg">
                Create Your Free Account
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <Cloud className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                CloudVault - Secure File Storage
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Built with Next.js, NestJS, and AWS
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="rounded-lg border bg-card p-6 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

function PricingCard({ name, price, description, features, highlighted }: {
  name: string
  price: string
  description: string
  features: string[]
  highlighted?: boolean
}) {
  return (
    <div className={`rounded-lg border p-6 ${highlighted ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'bg-card'}`}>
      <h3 className="text-lg font-semibold">{name}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      <div className="mt-4">
        <span className="text-4xl font-bold">{price}</span>
        <span className="text-muted-foreground">/month</span>
      </div>
      <ul className="mt-6 space-y-3">
        {features.map((feature) => (
          <li key={feature} className="flex items-center gap-2 text-sm">
            <Check className="h-4 w-4 text-primary" />
            {feature}
          </li>
        ))}
      </ul>
      <Link href="/auth/register" className="mt-6 block">
        <Button variant={highlighted ? 'default' : 'outline'} className="w-full">
          Get Started
        </Button>
      </Link>
    </div>
  )
}
