import { Suspense } from 'react'
import { CallbackContent } from './callback-content'
import { Spinner } from '@/components/ui/spinner'

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic'

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center gap-4">
          <Spinner className="h-8 w-8" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  )
}
