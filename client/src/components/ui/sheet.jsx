import { forwardRef } from 'react'
import { cn } from '../../lib/utils'
import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const Sheet = ({ open, onOpenChange, children }) => (
  <AnimatePresence>
    {open && (
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs"
          onClick={() => onOpenChange(false)}
        />
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 250 }}
          className="fixed right-0 top-0 z-50 h-full w-3/4 max-w-sm border-l border-border bg-card text-foreground shadow-lg flex flex-col"
        >
          <div className="flex items-center justify-between p-5 border-b border-border">
            <span className="font-semibold text-lg">Menu</span>
            <button onClick={() => onOpenChange(false)} className="rounded-full p-2 hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
)

const SheetTrigger = forwardRef(({ className, onClick, children, ...props }, ref) => (
  <button ref={ref} className={cn(className)} onClick={onClick} {...props}>
    {children}
  </button>
))
SheetTrigger.displayName = 'SheetTrigger'

const SheetContent = ({ className, children, ...props }) => (
  <div className={cn('p-5 flex-1 flex flex-col', className)} {...props}>
    {children}
  </div>
)

export { Sheet, SheetTrigger, SheetContent }
