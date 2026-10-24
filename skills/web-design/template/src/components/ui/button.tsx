import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/cn'

// variant = visual weight, tone = intent, size = height. One `solid` per view (LA-01).
export const buttonVariants = cva(
  [
    'relative inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap select-none',
    'font-[number:var(--font-weight-control)] rounded-control border-(length:--effect-border-width) border-transparent',
    'transition-[background-color,color,border-color,box-shadow,transform] duration-(--motion-duration-micro) ease-(--ease-standard)',
    'active:translate-y-px disabled:pointer-events-none disabled:opacity-50',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
    // MO-02: keep a 44px hit area on touch even for small visuals.
    'before:absolute before:left-1/2 before:top-1/2 before:size-full before:min-h-(--size-touch-min) before:min-w-(--size-touch-min) before:-translate-1/2 before:content-[""]',
    '[&_svg]:size-4 [&_svg]:shrink-0',
  ],
  {
    variants: {
      variant: {
        solid: 'shadow-card',
        soft: '',
        outline: 'border-border-strong bg-transparent',
        ghost: 'bg-transparent',
        link: 'h-auto! px-0! underline-offset-4 hover:underline before:hidden',
      },
      tone: {
        brand: '',
        neutral: '',
        danger: '',
      },
      size: {
        sm: 'h-(--size-control-sm) px-3 text-sm',
        md: 'h-(--size-control-md) px-4 text-sm',
        lg: 'h-(--size-control-lg) px-6 text-base',
        icon: 'size-(--size-control-md) p-0',
      },
      shape: {
        default: '',
        pill: 'rounded-pill',
      },
    },
    compoundVariants: [
      { variant: 'solid', tone: 'brand', class: 'bg-primary text-primary-fg hover:bg-primary-hover' },
      { variant: 'solid', tone: 'neutral', class: 'bg-fg text-bg hover:opacity-90' },
      { variant: 'solid', tone: 'danger', class: 'bg-danger text-danger-fg hover:opacity-90' },
      { variant: 'soft', tone: 'brand', class: 'bg-primary-soft text-primary-soft-fg hover:brightness-95' },
      { variant: 'soft', tone: 'neutral', class: 'bg-surface-sunken text-fg hover:bg-border' },
      { variant: 'soft', tone: 'danger', class: 'bg-danger/10 text-danger hover:bg-danger/15' },
      { variant: 'outline', tone: 'brand', class: 'text-primary-text hover:bg-primary-soft' },
      { variant: 'outline', tone: 'neutral', class: 'text-fg hover:bg-surface-sunken' },
      { variant: 'outline', tone: 'danger', class: 'border-danger text-danger hover:bg-danger/10' },
      { variant: 'ghost', tone: 'brand', class: 'text-primary-text hover:bg-primary-soft' },
      { variant: 'ghost', tone: 'neutral', class: 'text-fg hover:bg-surface-sunken' },
      { variant: 'ghost', tone: 'danger', class: 'text-danger hover:bg-danger/10' },
      { variant: 'link', tone: 'brand', class: 'text-primary-text' },
      { variant: 'link', tone: 'neutral', class: 'text-fg' },
      { variant: 'link', tone: 'danger', class: 'text-danger' },
    ],
    defaultVariants: { variant: 'solid', tone: 'brand', size: 'md', shape: 'default' },
  },
)

export type ButtonProps = ComponentProps<'button'> & VariantProps<typeof buttonVariants> & { asChild?: boolean }

export function Button({ className, variant, tone, size, shape, asChild, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : 'button'
  return (
    <Comp
      data-slot="button"
      data-variant={variant ?? 'solid'}
      data-tone={tone ?? 'brand'}
      className={cn(buttonVariants({ variant, tone, size, shape }), className)}
      {...props}
    />
  )
}
