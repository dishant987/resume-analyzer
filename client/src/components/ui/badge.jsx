import { cva } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide transition-colors border',
  {
    variants: {
      variant: {
        default: 'bg-secondary text-secondary-foreground border-transparent',
        secondary: 'bg-secondary/50 text-muted-foreground border-border',
        success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 dark:border-emerald-500/30',
        warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 dark:border-amber-500/30',
        destructive: 'bg-destructive/10 text-destructive border-destructive/20 dark:border-destructive/30',
        accent: 'bg-primary/10 text-primary border-primary/20 dark:border-primary/30',
        outline: 'text-foreground border-border bg-transparent',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

function Badge({ className, variant, ...props }) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
