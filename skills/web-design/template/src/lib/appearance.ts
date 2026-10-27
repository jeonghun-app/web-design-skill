'use client'

import { useSyncExternalStore } from 'react'

// Trend + theme live on <html data-trend data-theme>. Every control subscribes to those
// attributes, so the dev switcher and the style guide's header never disagree.
const root = () => document.documentElement
const subscribe = (cb: () => void) => {
  const mo = new MutationObserver(cb)
  mo.observe(root(), { attributes: true, attributeFilter: ['data-trend', 'data-theme'] })
  return () => mo.disconnect()
}
// The server has no <html> attributes to read; it renders the defaults and the client corrects on hydration.
const serverSnapshot = () => 'none|light'
const snapshot = () => `${root().dataset.trend ?? 'none'}|${root().dataset.theme ?? 'light'}`

export function setTrend(trend: string) {
  if (trend === 'none') delete root().dataset.trend
  else root().dataset.trend = trend
  localStorage.setItem('wd-trend', trend)
}
export function setTheme(theme: string) {
  root().dataset.theme = theme
  localStorage.setItem('wd-theme', theme)
}

export function useAppearance() {
  const [trend, theme] = useSyncExternalStore(subscribe, snapshot, serverSnapshot).split('|')
  return { trend, setTrend, theme, setTheme }
}
