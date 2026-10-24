import { lazy, Suspense, useEffect, useState } from 'react'
import { TrendSwitcher } from '@/dev/trend-switcher'
import { ToastProvider } from '@/components/ui/toast'
import { TooltipProvider } from '@/components/ui/tooltip'
import { LandingPage } from '@/pages/landing'

// Two showcase pages on hash routes so the static build needs no server config:
//   #/      marketing grammar (sections)    #/app   product grammar (shell, table, overlays)
// Every element reads semantic tokens only, so a trend switch restyles both.
// The product demo is its own chunk so the landing page doesn't pay for it (motion.md budget).
const AppDemoPage = lazy(() => import('@/pages/app-demo').then((m) => ({ default: m.AppDemoPage })))

function useHashRoute() {
  const [route, setRoute] = useState(() => location.hash.replace(/^#/, ''))
  useEffect(() => {
    const on = () => setRoute(location.hash.replace(/^#/, ''))
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return route.startsWith('/app') ? 'app' : 'landing'
}

export default function App() {
  const route = useHashRoute()
  return (
    <TooltipProvider>
      <ToastProvider>
        {route === 'app' ? (
          <Suspense fallback={<div className="min-h-dvh" aria-busy="true" />}>
            <AppDemoPage />
          </Suspense>
        ) : (
          <LandingPage />
        )}
        {import.meta.env.DEV && <TrendSwitcher />}
      </ToastProvider>
    </TooltipProvider>
  )
}
