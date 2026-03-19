'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useServerActionMutation } from '@/lib/server-action-hooks';
import { useAuthStore } from '@/core/auth/stores/auth';
import { authKeys } from '@/core/auth/utils/query-keys';
import { loginAction } from '../_actions';
import type { LoginDto } from '@cloudvault/types';

/**
 * Hook to handle login - uses ZSA server action
 */
export function useLogin() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const mutation = useServerActionMutation(loginAction, {
    onSuccess: (data) => {
      // Update Zustand store
      setAuth(data.user, data.accessToken);
      // Set query cache for profile
      queryClient.setQueryData(authKeys.profile(), data.user);
      // Show success toast
      toast.success('Welcome back!', {
        description: 'You have been signed in successfully.',
      });
      // Redirect to dashboard
      router.push('/dashboard');
    },
    onError: (error) => {
      toast.error('Sign in failed', {
        description: error.message,
      });
    },
  });

  const login = useCallback(
    (data: LoginDto) => {
      mutation.mutate(data);
    },
    [mutation],
  );

  return {
    login,
    loginAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}
