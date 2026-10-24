import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// Teach tailwind-merge the token-named utilities so `text-display` and
// `text-fg` are not treated as conflicting font-size/color classes.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ['xs', 'sm', 'base', 'lg', 'lede', 'h3', 'h2', 'display'],
      radius: ['control', 'card', 'panel', 'pill', 'base'],
      shadow: ['card', 'raised', 'overlay'],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
