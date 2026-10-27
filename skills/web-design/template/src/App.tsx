import { lazy, Suspense, useEffect, useState } from 'react'
import { TrendSwitcher } from '@/dev/trend-switcher'
import { ToastProvider } from '@/components/ui/toast'
import { MotionProvider } from '@/lib/motion'
import { LandingPage } from '@/screens/landing'

// Two showcase pages on hash routes so the static build needs no server config:
//   #/        marketing grammar (sections)    #/app   product grammar (shell, table, overlays)
//   #/system  living style guide: the design introduction page for this system
// Every element reads semantic tokens only, so a trend switch restyles both.
// The product demo is its own chunk so the landing page doesn't pay for it (motion.md budget).
const AppDemoPage = lazy(() => import('@/screens/app-demo').then((m) => ({ default: m.AppDemoPage })))
const SystemPage = lazy(() => import('@/screens/system').then((m) => ({ default: m.SystemPage })))

function useHashRoute() {
  const [route, setRoute] = useState(() => location.hash.replace(/^#/, ''))
  useEffect(() => {
    const on = () => setRoute(location.hash.replace(/^#/, ''))
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return route.startsWith('/app') ? 'app' : route.startsWith('/system') ? 'system' : 'landing'
}

export default function App() {
  const route = useHashRoute()
  return (
    <MotionProvider>
      <ToastProvider>
        {route === 'landing' ? (
          <LandingPage />
        ) : (
          <Suspense fallback={<div className="min-h-dvh" aria-busy="true" />}>
            {route === 'app' ? <AppDemoPage /> : <SystemPage />}
          </Suspense>
        )}
        {import.meta.env.DEV && <TrendSwitcher />}
      </ToastProvider>
    </MotionProvider>
  )
}
