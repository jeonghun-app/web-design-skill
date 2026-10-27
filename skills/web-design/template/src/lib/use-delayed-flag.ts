'use client'

import { useEffect, useState } from 'react'

// True only after `active` has held for `delay` ms, so fast loads never flash a skeleton (RE-04).
export function useDelayedFlag(active: boolean, delay = 300) {
  const [show, setShow] = useState(false)
  useEffect(() => {
    if (!active) {
      setShow(false)
      return
    }
    const t = setTimeout(() => setShow(true), delay)
    return () => clearTimeout(t)
  }, [active, delay])
  return show
}
