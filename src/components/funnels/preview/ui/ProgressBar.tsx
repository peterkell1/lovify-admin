import { cn } from '@/lib/utils'

export function ProgressBar({
  current,
  total,
  className,
}: {
  current: number
  total: number
  className?: string
}) {
  const pct = total > 0 ? ((current + 1) / total) * 100 : 0
  return (
    <div className={cn('px-4 pt-4', className)}>
      <div className="h-1.5 w-full bg-secondary/60 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-orange-500 to-rose-500 rounded-full transition-all duration-400"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
