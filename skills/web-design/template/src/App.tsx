import { useEffect, useState } from 'react'
import { TrendSwitcher } from '@/dev/trend-switcher'
import { ToastProvider } from '@/components/ui/toast'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppDemoPage } from '@/pages/app-demo'
import { LandingPage } from '@/pages/landing'

// Two showcase pages on hash routes so the static build needs no server config:
//   #/      marketing grammar (sections)    #/app   product grammar (shell, table, overlays)
// Every element reads semantic tokens only, so a trend switch restyles both.
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
        {route === 'app' ? <AppDemoPage /> : <LandingPage />}
        {import.meta.env.DEV && <TrendSwitcher />}
      </ToastProvider>
    </TooltipProvider>
  )
}
