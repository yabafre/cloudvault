'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useServerActionMutation } from '@/lib/server-action-hooks';
import { useAuthStore } from '@/core/auth/stores/auth';
import { logoutAction } from '@/core/auth/actions';

/**
 * Hook to handle logout - global hook used across the app
 * Uses ZSA server action for secure cookie management
 */
export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { clearAuth } = useAuthStore();

  const mutation = useServerActionMutation(logoutAction, {
    onSettled: () => {
      // Always clear local state, even if API call fails
      clearAuth();
      queryClient.clear();
      toast.success('Signed out', {
        description: 'You have been signed out successfully.',
      });
      router.push('/auth/login');
    },
  });

  const logout = useCallback(() => {
    mutation.mutate(undefined);
  }, [mutation]);

  return {
    logout,
    mutate: mutation.mutate,
    isPending: mutation.isPending,
  };
}
