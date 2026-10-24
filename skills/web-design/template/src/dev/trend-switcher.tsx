import { useEffect, useState } from 'react'
import trends from '@/design/trends.json'

// Dev-only panel: flip trend and theme live. Persists to localStorage; ?trend=<id> also works.
export function TrendSwitcher() {
  const root = document.documentElement
  const [trend, setTrend] = useState(root.dataset.trend ?? 'none')
  const [theme, setTheme] = useState(root.dataset.theme ?? 'light')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (trend === 'none') delete root.dataset.trend
    else root.dataset.trend = trend
    localStorage.setItem('wd-trend', trend === 'none' ? '' : trend)
  }, [trend, root])
  useEffect(() => {
    root.dataset.theme = theme
    localStorage.setItem('wd-theme', theme)
  }, [theme, root])

  return (
    <div className="fixed bottom-4 right-4 z-50 text-sm" data-wd-dev>
      {open && (
        <div className="surface mb-2 w-72 rounded-card p-3 shadow-overlay">
          <p className="mb-2 font-semibold">Trend</p>
          <div className="grid gap-1">
            {[{ id: 'none', name: 'Base (no trend)', stage: '' }, ...trends].map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setTrend(t.id)
                  if ('preferTheme' in t && t.preferTheme) setTheme(t.preferTheme)
                }}
                aria-pressed={trend === t.id}
                className="flex min-h-11 items-center justify-between rounded-control px-3 text-left hover:bg-surface-sunken aria-pressed:bg-primary-soft aria-pressed:text-primary-soft-fg"
              >
                <span>{t.name}</span>
                <span className="text-xs text-fg-muted">{t.stage}</span>
              </button>
            ))}
          </div>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="mt-2 min-h-11 w-full rounded-control border border-border-strong px-3 hover:bg-surface-sunken"
          >
            {theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
          </button>
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="ml-auto flex min-h-11 items-center gap-2 rounded-pill bg-fg px-4 text-bg shadow-raised"
      >
        Trend: {trend}
      </button>
    </div>
  )
}
