import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('animate-pulse rounded-lg bg-muted', className)} />
  )
}

export function SkeletonCard({ className }: SkeletonProps) {
  return (
    <div className={cn('border border-border rounded-xl bg-card p-5 shadow-soft', className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-16" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-10 w-10 rounded-xl" />
      </div>
    </div>
  )
}

export function SkeletonTableRow({ cols = 4 }: { cols?: number }) {
  return (
    <tr className="border-b border-border">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="p-4">
          <Skeleton className={cn('h-4', i === 0 ? 'w-32' : 'w-20')} />
        </td>
      ))}
    </tr>
  )
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="border border-border rounded-xl bg-card shadow-soft overflow-hidden">
      <div className="p-6 pb-4">
        <Skeleton className="h-5 w-40" />
      </div>
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className="p-4 text-left">
                <Skeleton className="h-3 w-16" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <SkeletonTableRow key={i} cols={cols} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function SkeletonChart({ className }: SkeletonProps) {
  return (
    <div className={cn('border border-border rounded-xl bg-card shadow-soft', className)}>
      <div className="p-6 pb-4">
        <Skeleton className="h-5 w-48" />
      </div>
      <div className="px-6 pb-6">
        <Skeleton className="h-[280px] w-full rounded-lg" />
      </div>
    </div>
  )
}

export function SkeletonContentGrid({ count = 6, aspect = 'square' }: { count?: number; aspect?: 'square' | 'video' }) {
  const gridCols = aspect === 'video'
    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
    : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6'

  return (
    <div className={cn('grid gap-4', gridCols)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="border border-border rounded-xl bg-card overflow-hidden">
          <Skeleton className={cn('w-full rounded-none', aspect === 'video' ? 'aspect-video' : 'aspect-square')} />
          <div className="p-2.5 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function SkeletonUserRow() {
  return (
    <tr className="border-b border-border">
      <td className="p-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-36" />
          </div>
        </div>
      </td>
      <td className="p-4"><Skeleton className="h-4 w-12" /></td>
      <td className="p-4"><Skeleton className="h-5 w-14 rounded-full" /></td>
      <td className="p-4"><Skeleton className="h-4 w-20" /></td>
    </tr>
  )
}
