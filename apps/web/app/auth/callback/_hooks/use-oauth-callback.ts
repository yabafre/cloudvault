'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useServerActionMutation } from '@/lib/server-action-hooks';
import { useAuthStore } from '@/core/auth/stores/auth';
import { authKeys } from '@/core/auth/utils/query-keys';
import { exchangeCodeAction } from '../_actions';

/**
 * Validate OAuth state from callback (CSRF protection)
 */
function validateOAuthState(returnedState: string | null): boolean {
  if (typeof window === 'undefined' || !returnedState) return false;
  const storedState = sessionStorage.getItem('oauth_state');
  sessionStorage.removeItem('oauth_state');
  return storedState === returnedState;
}

/**
 * Hook to handle OAuth callback - uses ZSA server action
 */
export function useOAuthCallback() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { setAuth, clearAuth } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  const mutation = useServerActionMutation(exchangeCodeAction, {
    onSuccess: (data) => {
      // Update Zustand store
      setAuth(data.user, data.accessToken);
      // Set query cache for profile
      queryClient.setQueryData(authKeys.profile(), data.user);
      // Show success toast
      toast.success('Welcome!', {
        description: 'You have been signed in successfully.',
      });
      // Redirect to dashboard
      router.push('/dashboard');
    },
    onError: (err) => {
      clearAuth();
      setError(err.message);
      toast.error('Authentication failed', {
        description: err.message,
      });
    },
  });

  const processCallback = useCallback(async () => {
    const accessToken = searchParams.get('accessToken');
    const errorParam = searchParams.get('error');
    const state = searchParams.get('state');

    // Handle error from OAuth provider
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
      setIsProcessing(false);
      return;
    }

    // Validate OAuth state if provided (CSRF protection)
    if (state && !validateOAuthState(state)) {
      setError('Invalid authentication state. Please try again.');
      setIsProcessing(false);
      return;
    }

    // Clear stored state if backend did not return it
    if (!state && typeof window !== 'undefined') {
      sessionStorage.removeItem('oauth_state');
    }

    // Check for access token
    if (!accessToken) {
      setError('No access token received');
      setIsProcessing(false);
      return;
    }

    // Exchange code for session via server action
    mutation.mutate({ accessToken });
  }, [searchParams, mutation]);

  useEffect(() => {
    processCallback();
  }, [processCallback]);

  const goToLogin = useCallback(() => {
    router.push('/auth/login');
  }, [router]);

  return {
    error,
    isProcessing: isProcessing && !error,
    isPending: mutation.isPending,
    goToLogin,
  };
}
