// Query keys for auth-related queries
// This file has no 'use client' directive so it can be imported anywhere

export const authKeys = {
  all: ['auth'] as const,
  profile: () => [...authKeys.all, 'profile'] as const,
};
