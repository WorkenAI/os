import { cva, type VariantProps } from 'class-variance-authority'
import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-700 focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-white text-zinc-950 shadow',
        secondary: 'border-transparent bg-zinc-800 text-zinc-50',
        destructive: 'border-transparent bg-red-900 text-zinc-50 shadow',
        outline: 'text-zinc-50',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

type BadgeProps = HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
export type { BadgeProps }
