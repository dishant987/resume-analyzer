import { forwardRef } from 'react'
import { cn } from '../../lib/utils'

const Label = forwardRef(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      'text-xs font-semibold leading-none text-foreground/80 peer-disabled:cursor-not-allowed peer-disabled:opacity-70 tracking-wide uppercase',
      className
    )}
    {...props}
  />
))
Label.displayName = 'Label'

export { Label }
