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
        'w-full max-w-[360px] mx-auto rounded-3xl bg-gradient-warm flex flex-col relative shadow-dreamy',
        className,
      )}
      style={{ height: 560 }}
    >
      <div className="flex-1 flex flex-col w-full px-6 overflow-y-auto no-scrollbar">
        {children}
      </div>
    </div>
  )
}
