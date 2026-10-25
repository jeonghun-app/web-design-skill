import type { CSSProperties, ReactNode } from 'react'
import { cn } from '@/lib/cn'

// Token-driven spot illustrations (references/illustration.md).
// One style family: one stroke weight (illus.stroke), one cap/join, flat 2D, one light
// source (top-left), a solid fill under every outline, a flat offset shadow, no text,
// no gradients, no people. Every color is a CSS variable, so the art re-themes with the
// active trend pack and dark mode without new files. The only literal numbers are geometry.

const ink: CSSProperties = {
  stroke: 'var(--color-illus-ink)',
  strokeWidth: 'var(--illus-stroke)',
  strokeLinecap: 'var(--illus-cap)' as CSSProperties['strokeLinecap'],
  strokeLinejoin: 'var(--illus-join)' as CSSProperties['strokeLinejoin'],
}
const fill = (token: string): CSSProperties => ({ ...ink, fill: `var(--color-illus-${token})` })
const line: CSSProperties = { ...ink, fill: 'none' }
const r = { rx: 'var(--illus-radius)', ry: 'var(--illus-radius)' } as CSSProperties
// The shadow copy is recolored by the `.illus-shadow` rule in index.css (it must beat the
// children's inline fills), and offset by the illus.shadow-* tokens.
const shadow: CSSProperties = { transform: 'translate(var(--illus-shadow-x), var(--illus-shadow-y))' }

function Backdrop() {
  // Soft organic shape behind the object: groups the art without a hard frame.
  return <path d="M22 78c-6-28 14-54 44-58 30-4 56 12 60 40 4 30-16 58-48 62-30 4-50-16-56-44Z" style={{ fill: 'var(--color-illus-base)' }} />
}

/** Drawn twice: once as the flat shadow, once as the object. */
function Lifted({ children }: { children: ReactNode }) {
  return (
    <>
      <g className="illus-shadow" style={shadow} aria-hidden>{children}</g>
      {children}
    </>
  )
}

const art = {
  'empty-inbox': (
    <>
      <Backdrop />
      <Lifted>
        <path d="M30 70 44 40h56l14 30v30a6 6 0 0 1-6 6H36a6 6 0 0 1-6-6Z" style={fill('paper')} />
      </Lifted>
      <path d="M30 70h24l6 10h24l6-10h24" style={line} />
      <rect x="56" y="50" width="32" height="6" style={{ ...fill('accent-3'), ...r }} />
      <path d="M66 26v8M82 26v8M74 22v10" style={line} />
    </>
  ),
  'no-results': (
    <>
      <Backdrop />
      <Lifted>
        <rect x="34" y="30" width="56" height="72" style={{ ...fill('paper'), ...r }} />
      </Lifted>
      <path d="M44 46h36M44 58h28M44 70h20" style={line} />
      <Lifted>
        <circle cx="94" cy="88" r="20" style={fill('accent-3')} />
      </Lifted>
      <circle cx="94" cy="88" r="11" style={fill('paper')} />
      <path d="m109 103 12 12" style={{ ...line, strokeWidth: 'calc(var(--illus-stroke) * 2)' }} />
    </>
  ),
  success: (
    <>
      <Backdrop />
      <Lifted>
        <circle cx="72" cy="72" r="32" style={fill('accent-1')} />
      </Lifted>
      <path d="m58 73 10 10 20-22" style={{ ...line, strokeWidth: 'calc(var(--illus-stroke) * 2)' }} />
      <path d="M30 40l4 4M110 34v6M116 98l6 2M26 96h6M72 22v6" style={line} />
      <circle cx="112" cy="58" r="4" style={fill('accent-2')} />
      <circle cx="36" cy="66" r="3" style={fill('accent-3')} />
    </>
  ),
  error: (
    <>
      <Backdrop />
      <Lifted>
        <rect x="30" y="40" width="84" height="60" style={{ ...fill('paper'), ...r }} />
      </Lifted>
      <path d="M30 54h84" style={line} />
      <circle cx="40" cy="47" r="2" style={fill('accent-2')} />
      <circle cx="48" cy="47" r="2" style={fill('accent-3')} />
      <path d="m72 64 14 24H58Z" style={{ ...fill('accent-2') }} />
      <path d="M72 72v7M72 83v.5" style={line} />
    </>
  ),
  upload: (
    <>
      <Backdrop />
      <Lifted>
        <path d="M46 94a18 18 0 0 1-2-36 24 24 0 0 1 46-6 20 20 0 0 1 8 42Z" style={fill('paper')} />
      </Lifted>
      <path d="M72 102V66m-12 12 12-12 12 12" style={{ ...line, strokeWidth: 'calc(var(--illus-stroke) * 1.5)' }} />
      <rect x="92" y="28" width="18" height="22" style={{ ...fill('accent-3'), ...r }} />
      <path d="M97 36h8M97 42h5" style={line} />
    </>
  ),
  secure: (
    <>
      <Backdrop />
      <Lifted>
        <path d="M72 26 104 38v28c0 22-14 38-32 46-18-8-32-24-32-46V38Z" style={fill('accent-1')} />
      </Lifted>
      <rect x="58" y="62" width="28" height="22" style={{ ...fill('paper'), ...r }} />
      <path d="M63 62v-6a9 9 0 0 1 18 0v6" style={line} />
      <circle cx="72" cy="72" r="2.5" style={fill('accent-2')} />
    </>
  ),
  analytics: (
    <>
      <Backdrop />
      <Lifted>
        <rect x="28" y="34" width="88" height="70" style={{ ...fill('paper'), ...r }} />
      </Lifted>
      <rect x="40" y="70" width="10" height="22" style={fill('accent-3')} />
      <rect x="56" y="58" width="10" height="34" style={fill('accent-1')} />
      <rect x="72" y="64" width="10" height="28" style={fill('accent-3')} />
      <rect x="88" y="48" width="10" height="44" style={fill('accent-2')} />
      <path d="M40 46h24" style={line} />
    </>
  ),
  'getting-started': (
    <>
      <Backdrop />
      <Lifted>
        <rect x="38" y="28" width="68" height="84" style={{ ...fill('paper'), ...r }} />
      </Lifted>
      <rect x="60" y="22" width="24" height="12" style={{ ...fill('accent-3'), ...r }} />
      <path d="m48 52 4 4 8-8M48 72l4 4 8-8" style={line} />
      <path d="M66 52h28M66 72h22M66 92h26" style={line} />
      <rect x="48" y="86" width="12" height="12" style={{ ...fill('accent-1'), ...r }} />
    </>
  ),
} as const

export type IllustrationName = keyof typeof art
export const ILLUSTRATIONS = Object.keys(art) as IllustrationName[]

// Role sizes (IL-02): spot 72, empty state in a card 120–144, page-level 240.
const SIZES = { sm: 72, md: 144, lg: 240 } as const

export function Illustration({
  name, size = 'md', label, className,
}: {
  name: IllustrationName
  size?: keyof typeof SIZES
  /** Pass a label only when the art carries meaning; otherwise it is decorative (IL-10). */
  label?: string
  className?: string
}) {
  const px = SIZES[size]
  const a11y = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true, focusable: false }
  return (
    <svg
      data-slot="illustration"
      data-illustration={name}
      viewBox="0 0 144 144"
      width={px}
      height={px}
      className={cn('shrink-0 overflow-visible', className)}
      {...a11y}
    >
      {art[name]}
    </svg>
  )
}
