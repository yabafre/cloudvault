'use client';

import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useOAuthCallback } from '../_hooks';

export function CallbackContent() {
  const { error, isProcessing, goToLogin } = useOAuthCallback();

  if (error) {
    return (
      <div className="w-full max-w-md space-y-4">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button className="w-full" onClick={goToLogin}>
          Back to login
        </Button>
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className="flex flex-col items-center gap-4">
        <Spinner className="h-8 w-8" />
        <p className="text-sm text-muted-foreground">Completing sign in...</p>
      </div>
    );
  }

  return null;
}
