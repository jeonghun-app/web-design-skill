'use client'

import { useEffect, type ReactNode } from 'react'
import { ToastProvider } from '@/components/ui/toast'
import { TrendSwitcher } from '@/dev/trend-switcher'
import { MotionProvider } from '@/lib/motion'
import { watchTrendFonts } from '@/lib/trend-fonts'

// Client-side providers for every route. Pages stay Server Components; only the islands
// that need state (dialogs, toasts, motion) hydrate.
export function AppProviders({ children }: { children: ReactNode }) {
  useEffect(() => watchTrendFonts(), [])
  return (
    <MotionProvider>
      <ToastProvider>
        {children}
        {process.env.NODE_ENV === 'development' && <TrendSwitcher />}
      </ToastProvider>
    </MotionProvider>
  )
}
