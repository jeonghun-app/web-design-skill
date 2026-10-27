'use client'

import * as m from 'motion/react-m'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SectionHeading } from '@/components/ui/section-heading'
import { cn } from '@/lib/cn'

type Plan = { name: string; monthly: number; yearly: number; blurb: string; features: string[]; featured?: boolean }

// 3 plans, one highlighted as the recommended default; same feature order in every column
// so the eye compares row by row (CG-06, Von Restorff). Only the featured plan gets a solid CTA (LA-01).
export function Pricing({ plans }: { plans: Plan[] }) {
  const [yearly, setYearly] = useState(true)
  return (
    <section id="pricing" className="section-y container-page">
      <SectionHeading eyebrow="Pricing" title="Simple plans that grow with you" lede="Start free. Upgrade when your team needs more control." />
      <div className="mt-10 flex justify-center">
        <div role="radiogroup" aria-label="Billing period" className="relative inline-flex rounded-pill border border-border bg-surface-sunken p-1">
          {[{ v: false, l: 'Monthly' }, { v: true, l: 'Yearly · save 20%' }].map((o) => (
            <button
              key={o.l}
              role="radio"
              aria-checked={yearly === o.v}
              onClick={() => setYearly(o.v)}
              className="relative min-h-11 rounded-pill px-4 text-sm font-medium"
            >
              {yearly === o.v && (
                <m.span layoutId="billing-pill" transition={{ type: 'spring', bounce: 0.2, duration: 0.3 }} className="absolute inset-0 rounded-pill bg-surface shadow-card" />
              )}
              <span className="relative">{o.l}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="mt-10 grid gap-4 lg:grid-cols-3">
        {plans.map((p) => (
          <div
            key={p.name}
            className={cn('surface flex flex-col rounded-card p-8', p.featured && 'ring-2 ring-primary lg:-my-4 lg:py-12')}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{p.name}</h3>
              {p.featured && <Badge tone="brand">Most popular</Badge>}
            </div>
            <p className="mt-2 text-sm text-fg-muted">{p.blurb}</p>
            <p className="mt-6 flex items-baseline gap-1">
              <span className="text-h2 font-[number:var(--font-weight-display)] tracking-display">${yearly ? p.yearly : p.monthly}</span>
              <span className="text-sm text-fg-muted">/ user / month</span>
            </p>
            <Button className="mt-6" variant={p.featured ? 'solid' : 'outline'} tone={p.featured ? 'brand' : 'neutral'}>
              {p.monthly === 0 ? 'Start free' : `Choose ${p.name}`}
            </Button>
            <ul className="mt-8 grid gap-3 text-sm">
              {p.features.map((f) => (
                <li key={f} className="flex gap-2">
                  <svg viewBox="0 0 16 16" aria-hidden className="mt-0.5 size-4 shrink-0 fill-primary"><path d="M6.5 11.2 3.3 8l-1 1 4.2 4.2 7.2-7.2-1-1z" /></svg>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}
