import type { Metadata } from 'next'

// Next merges metadata shallowly: a page that sets `openGraph` replaces the layout's whole
// openGraph object (image, type, site name). Every page builds its metadata here so the share
// tags stay complete (web-quality.md SE-11).
export const SITE_NAME = 'Lumen'
export const OG_IMAGE = { url: '/og.png', width: 1200, height: 630, alt: 'Lumen: Ship the work, not the busywork.' }

export function pageMetadata({ title, description, path }: { title: string; description: string; path: string }): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { type: 'website', siteName: SITE_NAME, title, description, url: path, images: [OG_IMAGE] },
  }
}
