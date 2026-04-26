import { type ReactNode, type MouseEvent, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'

interface DialogProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  className?: string
  /**
   * When true (the default), clicking the dim backdrop closes the dialog.
   * Set to false for dialogs that hold unsaved state (e.g. step editor)
   * so marketers don't lose work to a stray click.
   */
  dismissOnBackdropClick?: boolean
}

export function Dialog({
  open,
  onClose,
  children,
  className,
  dismissOnBackdropClick = true,
}: DialogProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  const handleBackdropClick = (e: MouseEvent) => {
    if (!dismissOnBackdropClick) return
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className={cn('bg-card rounded-2xl shadow-dreamy border border-border w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden flex flex-col', className)}>
        {children}
      </div>
    </div>
  )
}

export function DialogHeader({ children, onClose }: { children: ReactNode; onClose?: () => void }) {
  return (
    <div className="flex-shrink-0 flex items-center justify-between p-6 pb-0">
      <div className="space-y-1">{children}</div>
      {onClose && (
        <button onClick={onClose} className="text-tertiary hover:text-foreground cursor-pointer transition-colors">
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  )
}

export function DialogTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h2 className={cn('text-lg font-bold', className)}>{children}</h2>
}

export function DialogContent({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('p-6 overflow-y-auto flex-1', className)}>{children}</div>
}
