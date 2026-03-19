/**
 * ZSA Server Action Hooks
 *
 * This module provides hooks for executing ZSA server actions.
 *
 * Two approaches are available:
 *
 * 1. useServerAction (from zsa-react)
 *    - Simple hook with execute() function
 *    - Returns tuple [data, err] from execute()
 *    - Good for simple forms and one-off actions
 *
 * 2. useServerActionMutation/Query (from zsa-react-query)
 *    - React Query integration
 *    - Provides caching, refetching, optimistic updates
 *    - Good for complex data flows
 *
 * @see https://zsa.vercel.app/docs/use-server-action
 * @see https://zsa.vercel.app/docs/react-query
 */

import { useInfiniteQuery, useMutation, useQuery } from '@tanstack/react-query';
import { setupServerActionHooks } from 'zsa-react-query';

// Re-export useServerAction from zsa-react for simple use cases
export { useServerAction } from 'zsa-react';

// Setup React Query integrated hooks
const {
  useServerActionQuery,
  useServerActionMutation,
  useServerActionInfiniteQuery,
} = setupServerActionHooks({
  hooks: {
    useQuery,
    useMutation,
    useInfiniteQuery,
  },
});

export {
  useServerActionQuery,
  useServerActionMutation,
  useServerActionInfiniteQuery,
};
