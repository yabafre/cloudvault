'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useServerActionMutation } from '@/lib/server-action-hooks';
import { useAuthStore } from '@/core/auth/stores/auth';
import { authKeys } from '@/core/auth/utils/query-keys';
import { registerAction } from '../_actions';
import type { RegisterDto } from '@cloudvault/types';

/**
 * Hook to handle registration - uses ZSA server action
 */
export function useRegister() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const mutation = useServerActionMutation(registerAction, {
    onSuccess: (data) => {
      // Update Zustand store
      setAuth(data.user, data.accessToken);
      // Set query cache for profile
      queryClient.setQueryData(authKeys.profile(), data.user);
      // Show success toast
      toast.success('Account created!', {
        description: 'Welcome to CloudVault. Your account is ready.',
      });
      // Redirect to dashboard
      router.push('/dashboard');
    },
    onError: (error) => {
      toast.error('Registration failed', {
        description: error.message,
      });
    },
  });

  const register = useCallback(
    (data: RegisterDto) => {
      mutation.mutate(data);
    },
    [mutation],
  );

  return {
    register,
    registerAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}
