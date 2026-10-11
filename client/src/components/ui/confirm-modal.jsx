import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, Loader2 } from 'lucide-react'
import { Button } from './button'

export function ConfirmModal({
  isOpen,
  onClose,
  onCancel,
  onConfirm,
  title,
  description,
  confirmLabel,
  confirmText,
  confirmVariant,
  isConfirming,
  isLoading,
  icon: Icon
}) {
  const handleClose = onClose || onCancel
  const isBusy = isConfirming || isLoading
  const label = confirmLabel || confirmText || 'Confirm'

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className="relative bg-card border border-border w-full max-w-md rounded-2xl p-6 shadow-xl space-y-6 overflow-hidden z-10"
          >
            <div className="flex gap-4">
              <div className="h-10 w-10 shrink-0 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
                {Icon ? <Icon className="h-6 w-6" /> : <AlertCircle className="h-6 w-6" />}
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={handleClose} disabled={isBusy} className="rounded-full">
                Cancel
              </Button>
              <Button variant={confirmVariant || 'destructive'} onClick={onConfirm} disabled={isBusy} className="rounded-full flex items-center gap-2">
                {isBusy ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {label || 'Processing...'}
                  </>
                ) : (
                  label
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
