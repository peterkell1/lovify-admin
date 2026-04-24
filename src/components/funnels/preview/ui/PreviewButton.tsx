import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

// Standalone preview-only CTA button — ignores clicks (the preview is read-only)
// but visually matches lovify-funnel's primary Button verbatim.
type Props = ButtonHTMLAttributes<HTMLButtonElement>

export const PreviewButton = forwardRef<HTMLButtonElement, Props>(
  ({ className, ...rest }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          'w-full h-14 text-base font-semibold rounded-2xl inline-flex items-center justify-center gap-2',
          'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-lg shadow-orange-500/30',
          'disabled:opacity-40 disabled:shadow-none',
          className,
        )}
        {...rest}
      />
    )
  },
)
PreviewButton.displayName = 'PreviewButton'
