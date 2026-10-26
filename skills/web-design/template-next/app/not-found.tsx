import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'

// 404: say what happened and give one way forward (content.md errors). Next adds noindex.
export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center">
      <h1 className="sr-only">Page not found</h1>
      <EmptyState
        illustration="no-results"
        title="This page doesn't exist"
        text="The link may be old, or the address has a typo."
        action={<Button asChild><a href="/">Go to the home page</a></Button>}
      />
    </main>
  )
}
