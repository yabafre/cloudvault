import { AuthGuard } from '@/components/auth'
import { DashboardNav } from '@/components/dashboard/nav'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-zinc-50 dark:bg-black">
        <DashboardNav />
        <main className="container mx-auto py-6 px-4">
          {children}
        </main>
      </div>
    </AuthGuard>
  )
}
