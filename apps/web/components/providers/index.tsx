"use client"

import { type ReactNode, useState, useEffect } from "react"
import { ThemeProvider } from "@/components/common/theme-provider"
import { ReactQueryProvider } from "@/core/providers/reactQuery"
import { AuthProvider } from "./auth-provider"
import { Toaster } from "@/components/ui/sonner"

interface ProvidersProps {
  children: ReactNode
}

/**
 * Providers wrapper qui attend le montage client avant de rendre
 * Cela evite les problemes de prerendering avec les hooks React
 */
export function Providers({ children }: ProvidersProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Pendant le SSR/prerendering, ne rendre que les enfants
  if (!isMounted) {
    return <>{children}</>
  }

  return (
    <ReactQueryProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <AuthProvider>{children}</AuthProvider>
        <Toaster position="top-right" richColors />
      </ThemeProvider>
    </ReactQueryProvider>
  )
}
