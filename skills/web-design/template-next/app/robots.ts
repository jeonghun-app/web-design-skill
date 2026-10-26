import type { MetadataRoute } from 'next'

// Generated at build time, so it also works in the static export.
export const dynamic = 'force-static'

const SITE = (process.env.SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '')

export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: '*', allow: '/' }, sitemap: `${SITE}/sitemap.xml` }
}
