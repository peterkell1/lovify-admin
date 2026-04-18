import { type ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface LiveStatCardProps {
  title: string
  value: number | undefined
  isLoading: boolean
  icon: ReactNode
  subtitle?: string
  format?: (n: number) => string
}

function defaultFormat(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString()
}

export function LiveStatCard({ title, value, isLoading, icon, subtitle, format }: LiveStatCardProps) {
  const fmt = format ?? defaultFormat

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-tertiary uppercase tracking-wider">{title}</p>
            {isLoading ? (
              <Skeleton className="h-7 w-16 mt-2" />
            ) : (
              <p className="text-2xl font-bold mt-1.5 text-foreground">{fmt(value ?? 0)}</p>
            )}
            {subtitle && !isLoading && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
            {isLoading && <Skeleton className="h-3 w-20 mt-2" />}
          </div>
          <div className="h-10 w-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
