// Next.js routes: real paths, so every page has its own URL, metadata and canonical.
// Same shape as the Vite template's hash routes (template/src/lib/routes.ts), so pages and
// sections are shared unchanged.
export const routes = {
  home: '/',
  app: '/app',
  system: '/system',
  /** A section of the style guide: /system#<id>. */
  section: (id: string) => `/system#${id}`,
  /** The style-guide section named by the current URL, if any. */
  currentSection: () => location.hash.slice(1) || undefined,
  navigate: (href: string) => { location.assign(href) },
}
