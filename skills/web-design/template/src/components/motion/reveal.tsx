'use client'

import { useEffect, useRef, useState, type ComponentProps } from 'react'
import { cn } from '@/lib/cn'

// Fade-and-rise when the element enters the viewport. Timing comes from tokens
// (motion.duration.reveal, motion.distance.reveal, ease.out) so trend packs can tune it;
// the global reduced-motion rule turns it into an instant change (MT-03).
export function Reveal({ className, delay = 0, style, ...props }: ComponentProps<'div'> & { delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          io.disconnect()
        }
      },
      { rootMargin: '0px 0px -10% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    <div
      ref={ref}
      data-inview={inView || undefined}
      style={{ transitionDelay: `${delay}ms`, ...style }}
      className={cn(
        'translate-y-(--motion-distance-reveal) opacity-0 transition-[opacity,translate] duration-(--motion-duration-reveal) ease-(--ease-out)',
        'data-inview:translate-y-0 data-inview:opacity-100',
        className,
      )}
      {...props}
    />
  )
}
