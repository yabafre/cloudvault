import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard - CloudVault',
  description: 'Your CloudVault dashboard',
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to CloudVault. Your secure file storage.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-sm font-medium text-muted-foreground">
            Total Files
          </h3>
          <p className="text-2xl font-bold">0</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-sm font-medium text-muted-foreground">
            Storage Used
          </h3>
          <p className="text-2xl font-bold">0 MB</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-sm font-medium text-muted-foreground">
            Shared Files
          </h3>
          <p className="text-2xl font-bold">0</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-sm font-medium text-muted-foreground">
            Recent Activity
          </h3>
          <p className="text-2xl font-bold">-</p>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Files</h2>
        <p className="text-muted-foreground text-center py-8">
          No files yet. Upload your first file to get started.
        </p>
      </div>
    </div>
  )
}
