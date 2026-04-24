import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

// Mirror of lovify-funnel's PhoneFrame, scaled to fit inside the admin
// step editor side panel. We don't use 100dvh here because the dialog
// itself constrains height — instead we fill the preview column.
export function PhoneFrame({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'h-full min-h-[560px] w-full max-w-[360px] mx-auto rounded-3xl bg-gradient-warm flex flex-col relative overflow-hidden shadow-dreamy',
        className,
      )}
    >
      <div className="flex-1 flex flex-col w-full px-6 overflow-hidden">
        {children}
      </div>
    </div>
  )
}
