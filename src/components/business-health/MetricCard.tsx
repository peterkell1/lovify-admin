import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { CheckCircle2, AlertTriangle, AlertCircle, ArrowUp, ArrowDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

export type MetricStatus = 'good' | 'ok' | 'bad' | 'no-data'

interface MetricCardProps {
  question: string
  value: string | undefined
  isLoading?: boolean
  detail?: string
  goal?: string
  plainEnglish: string
  status?: MetricStatus
  noDataReason?: string
  /** Optional change vs prior period — pass the percentage-points delta. */
  deltaPp?: number
  /** "up" means the value going UP is good (default). "down" inverts colors. */
  deltaDirection?: 'up-is-good' | 'down-is-good'
  /** Suffix on delta (e.g. "pp" or "%"). */
  deltaSuffix?: string
  approxNote?: string
}

function StatusBadge({ status }: { status: MetricStatus }) {
  if (status === 'no-data') {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-semibold">
        <AlertTriangle className="h-2.5 w-2.5" />
        NO DATA YET
      </span>
    )
  }
  if (status === 'good') {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold">
        <CheckCircle2 className="h-2.5 w-2.5" />
        HEALTHY
      </span>
    )
  }
  if (status === 'ok') {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-semibold">
        <AlertTriangle className="h-2.5 w-2.5" />
        WORK NEEDED
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-semibold">
      <AlertCircle className="h-2.5 w-2.5" />
      CRITICAL
    </span>
  )
}

function Delta({
  pp,
  direction = 'up-is-good',
  suffix = 'pp',
}: {
  pp: number
  direction?: 'up-is-good' | 'down-is-good'
  suffix?: string
}) {
  if (!Number.isFinite(pp)) return null
  const goodWhenUp = direction === 'up-is-good'
  const dir = pp > 0.001 ? 'up' : pp < -0.001 ? 'down' : 'flat'
  const Icon = dir === 'up' ? ArrowUp : dir === 'down' ? ArrowDown : Minus
  const isGood = (dir === 'up' && goodWhenUp) || (dir === 'down' && !goodWhenUp)
  const isBad = (dir === 'down' && goodWhenUp) || (dir === 'up' && !goodWhenUp)
  const color = isGood
    ? 'text-emerald-600'
    : isBad
      ? 'text-rose-600'
      : 'text-muted-foreground'
  return (
    <span className={cn('inline-flex items-center gap-0.5 text-[11px] font-medium', color)}>
      <Icon className="h-3 w-3" />
      {Math.abs(pp).toFixed(1)}
      {suffix} vs prior period
    </span>
  )
}

export function MetricCard({
  question,
  value,
  isLoading,
  detail,
  goal,
  plainEnglish,
  status,
  noDataReason,
  deltaPp,
  deltaDirection,
  deltaSuffix,
  approxNote,
}: MetricCardProps) {
  const showNoData = status === 'no-data'

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-tertiary tracking-widest">METRIC</span>
          {!isLoading && status && <StatusBadge status={status} />}
        </div>
        <p className="text-xs font-semibold text-foreground leading-snug min-h-[28px]">
          {question}
        </p>

        {isLoading ? (
          <Skeleton className="h-9 w-24 mt-3" />
        ) : showNoData ? (
          <p className="text-3xl font-bold mt-2 text-muted-foreground/60 tracking-tight">—</p>
        ) : (
          <p className="text-3xl font-bold mt-2 text-foreground tracking-tight">
            {value ?? '—'}
          </p>
        )}

        {!isLoading && !showNoData && deltaPp !== undefined && (
          <div className="mt-1">
            <Delta pp={deltaPp} direction={deltaDirection} suffix={deltaSuffix} />
          </div>
        )}

        {!isLoading && !showNoData && detail && (
          <p className="text-[11px] text-muted-foreground mt-1">{detail}</p>
        )}

        <p className="text-[11px] text-tertiary mt-3 leading-snug">{plainEnglish}</p>

        {showNoData && noDataReason ? (
          <p className="text-[11px] text-slate-600 font-medium mt-2 leading-snug">
            ⚙️ Why &ldquo;no data&rdquo;: {noDataReason}
          </p>
        ) : (
          goal && (
            <p className="text-[11px] text-emerald-700 font-medium mt-2">🎯 {goal}</p>
          )
        )}

        {approxNote && !showNoData && (
          <p className="text-[10px] text-amber-600 mt-1.5 leading-snug">⚠️ {approxNote}</p>
        )}
      </CardContent>
    </Card>
  )
}
