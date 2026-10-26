import type { MetadataRoute } from 'next'

const SITE = (process.env.SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '')

// Indexable paths (SE-20). Add every public route; leave out app screens behind login.
export default function sitemap(): MetadataRoute.Sitemap {
  return ['/', '/system'].map((p) => ({ url: `${SITE}${p}` }))
}
