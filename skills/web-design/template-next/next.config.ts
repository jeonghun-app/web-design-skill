import type { NextConfig } from 'next'

// `npm run build:static` writes a static export to out/ (any static host). The default
// build is a server build (next start, a container, or an adapter). npm names the running
// script in npm_lifecycle_event on every OS, so no inline env syntax is needed.
const isExport = process.env.npm_lifecycle_event === 'build:static' || process.env.NEXT_OUTPUT === 'export'

const nextConfig: NextConfig = {
  // Partial prerendering: the static shell of every route is prerendered; anything dynamic
  // streams in behind <Suspense>. Default in create-next-app since 16.4.
  cacheComponents: !isExport, // Next can't prerender partially in export mode
  partialPrefetching: !isExport,
  reactStrictMode: true,
  ...(isExport && { output: 'export' as const, trailingSlash: true, images: { unoptimized: true } }),
}

export default nextConfig
