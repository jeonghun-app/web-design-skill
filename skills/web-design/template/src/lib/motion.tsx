'use client'

import { LazyMotion } from 'motion/react'
import type { ReactNode } from 'react'

// Motion's animation engine is the largest dependency in the app. Components render `m.*`
// (a thin shell that paints statically) and the engine loads once the page is idle after
// `load`, so it never competes with the route's own code for bandwidth (web-quality.md PF-07).
// `strict` throws if someone imports the full `motion.*` component, which would pull the
// engine back into the main chunk.
const afterLoad = () =>
  new Promise<void>((resolve) => {
    const idle = () => ('requestIdleCallback' in window ? requestIdleCallback(() => resolve(), { timeout: 2000 }) : setTimeout(resolve, 200))
    if (document.readyState === 'complete') idle()
    else addEventListener('load', idle, { once: true })
  })
const loadFeatures = () => afterLoad().then(() => import('./motion-features')).then((mod) => mod.default)

export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      {children}
    </LazyMotion>
  )
}
