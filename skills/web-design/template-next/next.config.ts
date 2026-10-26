import type { NextConfig } from 'next'

// `npm run build:static` writes a static export to out/ (any static host). The default
// build is a server build (next start, a container, or an adapter).
const isExport = process.env.NEXT_OUTPUT === 'export'

const nextConfig: NextConfig = {
  // Partial prerendering: the static shell of every route is prerendered; anything dynamic
  // streams in behind <Suspense>. Default in create-next-app since 16.4.
  cacheComponents: !isExport,
  partialPrefetching: !isExport,
  reactStrictMode: true,
  ...(isExport && { output: 'export' as const, trailingSlash: true, images: { unoptimized: true } }),
}

export default nextConfig
