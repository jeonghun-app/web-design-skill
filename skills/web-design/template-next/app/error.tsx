'use client'

import { Button } from '@/components/ui/button'

// Route error boundary: keep the shell, explain, offer a retry (RE-* recovery). It is a client
// component that loads on every route, so it stays text-only: importing EmptyState here would
// ship every illustration in the first-load JS of every page.
export default function RouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="grid min-h-dvh place-items-center px-6 text-center">
      <div className="max-w-sm">
        <h1 className="text-lg font-semibold">Something went wrong</h1>
        <p className="mt-1 text-sm text-fg-muted">This part of the page didn&apos;t load. Try again; your work is not lost.</p>
        <Button className="mt-5" onClick={() => reset()}>Try again</Button>
      </div>
    </main>
  )
}
