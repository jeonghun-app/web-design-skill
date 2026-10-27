import fonts from '@/design/fonts.json'

// Base fonts (and the default trend's) are linked from the HTML head by the Vite plugin.
// Other trends' fonts load only when that trend is switched on (switcher, ?trend=, saved choice).
const byTrend: Record<string, string[]> = fonts.trends

function ensure(trend: string | undefined) {
  for (const href of (trend && byTrend[trend]) || []) {
    if (document.head.querySelector(`link[rel="stylesheet"][href="${CSS.escape(href)}"]`)) continue
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = href
    document.head.appendChild(link)
  }
}

export function watchTrendFonts() {
  const root = document.documentElement
  ensure(root.dataset.trend)
  new MutationObserver(() => ensure(root.dataset.trend)).observe(root, { attributes: true, attributeFilter: ['data-trend'] })
}
