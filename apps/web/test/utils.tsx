import React, { ReactElement, ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { User } from '@cloudvault/types';

/**
 * Create a fresh QueryClient for each test
 */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

interface WrapperProps {
  children: ReactNode;
}

/**
 * Create a wrapper with QueryClientProvider for testing hooks
 */
export function createWrapper(): React.FC<WrapperProps> {
  const testQueryClient = createTestQueryClient();

  const Wrapper: React.FC<WrapperProps> = ({ children }) => (
    <QueryClientProvider client={testQueryClient}>
      {children}
    </QueryClientProvider>
  );

  return Wrapper;
}

/**
 * Custom render function that wraps components with providers
 */
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) {
  const testQueryClient = createTestQueryClient();

  const AllProviders: React.FC<WrapperProps> = ({ children }) => (
    <QueryClientProvider client={testQueryClient}>
      {children}
    </QueryClientProvider>
  );

  return render(ui, { wrapper: AllProviders, ...options });
}

// Re-export everything from testing-library
export * from '@testing-library/react';

// Override render with custom render
export { customRender as render };

// ============================================================================
// Test Fixtures
// ============================================================================

export const mockUser: User = {
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  avatar: null,
  provider: 'LOCAL',
  emailVerified: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

export const mockGoogleUser: User = {
  id: 'user-456',
  email: 'google@example.com',
  name: 'Google User',
  avatar: 'https://example.com/avatar.jpg',
  provider: 'GOOGLE',
  emailVerified: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

export const mockAccessToken = 'mock-access-token-jwt';

export const mockTokens = {
  accessToken: mockAccessToken,
  refreshToken: 'mock-refresh-token',
};

export const mockAuthResponse = {
  user: mockUser,
  tokens: mockTokens,
};
