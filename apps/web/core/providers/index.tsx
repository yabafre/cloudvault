'use client';

import { type ReactNode } from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { ReactQueryProvider } from './reactQuery';
import { AuthProvider } from './auth-provider';
import { Toaster } from '@/components/ui/sonner';

interface ProvidersProps {
  children: ReactNode;
}

/**
 * Unified providers wrapper for the application
 * Order: ReactQuery -> Theme -> Auth -> Content + Toaster
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <ReactQueryProvider>
      <NextThemesProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <AuthProvider>{children}</AuthProvider>
        <Toaster position="top-right" richColors />
      </NextThemesProvider>
    </ReactQueryProvider>
  );
}

// Re-export individual providers for flexibility
export { ReactQueryProvider } from './reactQuery';
export { AuthProvider, useAuthContext } from './auth-provider';
