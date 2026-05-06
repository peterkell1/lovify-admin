import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useActivationAndHabit, useRetention, useCohortSummary, type ProductFilters } from '@/hooks/use-product-dashboard'
import { CheckCircle2, AlertTriangle, AlertCircle, ArrowUp, ArrowDown, Minus, MousePointerClick, Sparkles } from 'lucide-react'
import { type ReactNode, type MouseEvent, useState, useMemo } from 'react'
import { FunnelDrillDown } from './FunnelDrillDown'
import { AiInsightPanel } from './AiInsightPanel'
import type { MetricContext } from '@/lib/cro-prompts'
import { cn } from '@/lib/utils'

interface TileProps {
  index: number
  question: string
  rate: number | undefined
  priorRate: number | undefined
  isLoading: boolean
  numerator?: number
  denominator?: number
  healthyMin: number
  healthyMax: number
  goalText: string
  plainEnglish: string
  approxNote?: string
  noDataReason?: string
  onClick?: () => void
  onAskAi?: () => void
}

function pct(n: number) {
  return `${(n * 100).toFixed(0)}%`
}

function StatusBadge({
  rate,
  min,
  max,
  denominator,
  noDataReason,
}: {
  rate: number
  min: number
  max: number
  denominator: number | undefined
  noDataReason?: string
}) {
  // No-data detection: if denominator is 0, OR if the rate is exactly 0 with
  // a reasonable denominator, the underlying tracking probably isn't wired.
  // Real products never get exactly 0% retention out of 5+ users.
  const noData = denominator === 0 || (rate === 0 && (denominator ?? 0) > 5 && !!noDataReason)
  if (noData) {
    return (
      <span
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-semibold"
        title={noDataReason}
      >
        <AlertTriangle className="h-2.5 w-2.5" />
        NO DATA YET
      </span>
    )
  }
  if (rate >= min) {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold">
        <CheckCircle2 className="h-2.5 w-2.5" />
        {rate >= max ? 'GREAT' : 'HEALTHY'}
      </span>
    )
  }
  if (rate >= min * 0.7) {
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

function PriorDelta({
  rate,
  priorRate,
}: {
  rate: number
  priorRate: number | undefined
}) {
  if (priorRate === undefined || !Number.isFinite(priorRate) || priorRate === 0) {
    return null
  }
  const delta = rate - priorRate
  const deltaPct = Math.abs(delta) * 100
  const direction = delta > 0.001 ? 'up' : delta < -0.001 ? 'down' : 'flat'
  const Icon = direction === 'up' ? ArrowUp : direction === 'down' ? ArrowDown : Minus
  // For all causal-chain metrics, "up" is good.
  const colorClass =
    direction === 'up'
      ? 'text-emerald-600'
      : direction === 'down'
        ? 'text-rose-600'
        : 'text-muted-foreground'
  return (
    <span className={cn('inline-flex items-center gap-0.5 text-[11px] font-medium', colorClass)}>
      <Icon className="h-3 w-3" />
      {deltaPct.toFixed(1)}pp vs prior period
    </span>
  )
}

function CausalTile({
  index,
  question,
  rate,
  priorRate,
  isLoading,
  numerator,
  denominator,
  healthyMin,
  healthyMax,
  goalText,
  plainEnglish,
  approxNote,
  noDataReason,
  onClick,
  onAskAi,
}: TileProps) {
  const showNoData =
    !isLoading &&
    rate !== undefined &&
    (denominator === 0 || (rate === 0 && (denominator ?? 0) > 5 && !!noDataReason))
  const clickable = !!onClick

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!clickable}
      className={cn(
        'w-full text-left rounded-xl border border-border bg-card shadow-soft transition-all group',
        clickable && 'cursor-pointer hover:border-accent/40 hover:shadow-dreamy'
      )}
    >
      <Card className="border-0 shadow-none">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-tertiary tracking-widest">
              {String(index).padStart(2, '0')}
            </span>
            <div className="flex items-center gap-1.5">
              {clickable && (
                <MousePointerClick className="h-3 w-3 text-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
              {!isLoading && rate !== undefined && (
                <StatusBadge
                  rate={rate}
                  min={healthyMin}
                  max={healthyMax}
                  denominator={denominator}
                  noDataReason={noDataReason}
                />
              )}
            </div>
          </div>
          <p className="text-xs font-semibold text-foreground leading-snug min-h-[28px]">
            {question}
          </p>

          {isLoading ? (
            <Skeleton className="h-9 w-20 mt-3" />
          ) : showNoData ? (
            <p className="text-3xl font-bold mt-2 text-muted-foreground/60 tracking-tight">—</p>
          ) : (
            <p className="text-3xl font-bold mt-2 text-foreground tracking-tight">
              {rate !== undefined ? pct(rate) : '—'}
            </p>
          )}

          {!isLoading && !showNoData && rate !== undefined && (
            <div className="mt-1">
              <PriorDelta rate={rate} priorRate={priorRate} />
            </div>
          )}

          {!isLoading && !showNoData && numerator !== undefined && denominator !== undefined && (
            <p className="text-[11px] text-muted-foreground mt-1">
              {numerator.toLocaleString()} of {denominator.toLocaleString()} users
            </p>
          )}

          <p className="text-[11px] text-tertiary mt-3 leading-snug">{plainEnglish}</p>

          {showNoData && noDataReason ? (
            <p className="text-[11px] text-slate-600 font-medium mt-2 leading-snug">
              ⚙️ Why &ldquo;no data&rdquo;: {noDataReason}
            </p>
          ) : (
            <p className="text-[11px] text-emerald-700 font-medium mt-2">🎯 {goalText}</p>
          )}

          {approxNote && !showNoData && (
            <p className="text-[10px] text-amber-600 mt-1.5 leading-snug">⚠️ {approxNote}</p>
          )}

          {clickable && !isLoading && !showNoData && (
            <p className="text-[10px] text-accent mt-2 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
              Click to see who&rsquo;s in this group →
            </p>
          )}
        </CardContent>
      </Card>
      {onAskAi && !isLoading && (
        <div className="px-4 pb-3 -mt-1">
          <span
            role="button"
            tabIndex={0}
            onClick={(e: MouseEvent) => {
              e.stopPropagation()
              onAskAi()
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.stopPropagation()
                e.preventDefault()
                onAskAi()
              }
            }}
            className="w-full flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-[11px] font-medium border border-accent/20 bg-accent/5 text-accent hover:bg-accent/15 transition-colors cursor-pointer"
          >
            <Sparkles className="h-3 w-3" />
            Ask AI why
          </span>
        </div>
      )}
    </button>
  )
}

function priorPeriodFilters(f: ProductFilters): ProductFilters {
  // Same window width, shifted backward.
  const fromMs = new Date(f.cohortFrom).getTime()
  const toMs = new Date(f.cohortTo).getTime()
  const span = toMs - fromMs
  const priorTo = new Date(fromMs - 1)
  const priorFrom = new Date(fromMs - 1 - span)
  return {
    ...f,
    cohortFrom: priorFrom.toISOString().split('T')[0],
    cohortTo: priorTo.toISOString().split('T')[0],
  }
}

export function CausalChain({ filters }: { filters: ProductFilters }) {
  const ah = useActivationAndHabit(filters)
  const retention = useRetention(filters)
  const summary = useCohortSummary(filters)

  const priorFilters = useMemo(() => priorPeriodFilters(filters), [filters])
  const ahPrior = useActivationAndHabit(priorFilters)
  const retentionPrior = useRetention(priorFilters)

  const [drillStep, setDrillStep] = useState<{ key: string; label: string } | null>(null)
  const [aiContext, setAiContext] = useState<MetricContext | null>(null)

  const buildCtx = (overrides: Partial<MetricContext> & {
    question: string
    metric: string
    currentValue: string
    healthyRange: string
    status: string
  }): MetricContext => ({
    cohortFrom: filters.cohortFrom,
    cohortTo: filters.cohortTo,
    cohortSize: summary.data?.users.length ?? 0,
    excludedTestUsers: summary.data?.excludedTestUsers,
    manuallyExcluded: summary.data?.manuallyExcluded,
    ...overrides,
  })

  const fmtPct = (n: number | undefined) =>
    n === undefined ? '—' : `${(n * 100).toFixed(1)}%`

  const tiles: ReactNode[] = [
    <CausalTile
      key="activation"
      index={1}
      question="Are new users getting hooked?"
      rate={ah.data?.activationRate}
      priorRate={ahPrior.data?.activationRate}
      isLoading={ah.isLoading}
      numerator={ah.data?.activated}
      denominator={ah.data?.cohortSize}
      healthyMin={0.3}
      healthyMax={0.5}
      plainEnglish="Of new users, what % made a song AND played it back 3+ times in their first week. If they don't replay, they didn't feel the magic."
      goalText="Want 30%+ · below 20% = onboarding broken"
      approxNote="Replays counted lifetime, not within 7 days (no play timestamps yet)."
      onClick={() => setDrillStep({ key: 'activation', label: 'Are new users getting hooked?' })}
      onAskAi={() =>
        setAiContext(
          buildCtx({
            question: 'Are new users getting hooked?',
            metric: 'Activation Rate',
            currentValue: fmtPct(ah.data?.activationRate),
            healthyRange: '30%–50% healthy · <20% means onboarding is broken',
            status:
              ah.data === undefined
                ? 'unknown'
                : ah.data.activationRate >= 0.3
                  ? 'HEALTHY'
                  : ah.data.activationRate >= 0.21
                    ? 'WORK NEEDED'
                    : 'CRITICAL',
            numerator: ah.data?.activated,
            denominator: ah.data?.cohortSize,
            approxNote: 'Replays counted lifetime, not within 7 days (no play timestamps yet).',
          })
        )
      }
    />,
    <CausalTile
      key="habit"
      index={2}
      question="Are hooked users forming a habit?"
      rate={ah.data?.habitRate}
      priorRate={ahPrior.data?.habitRate}
      isLoading={ah.isLoading}
      numerator={ah.data?.habitFormed}
      denominator={ah.data?.activated}
      healthyMin={0.4}
      healthyMax={0.6}
      plainEnglish="Of users who got hooked, what % opened the app on 4+ days in their first 2 weeks. Habit early = retention later."
      goalText="Want 40%+"
      noDataReason="The lovifymusic app isn't logging app-open sessions yet. One-line fix in the app."
      onClick={() =>
        setDrillStep({ key: 'habit_formation', label: 'Are hooked users forming a habit?' })
      }
      onAskAi={() =>
        setAiContext(
          buildCtx({
            question: 'Are hooked users forming a habit?',
            metric: 'Habit Formation Rate',
            currentValue: '— (NO DATA)',
            healthyRange: '40%–60% of activated users',
            status: 'NO DATA YET',
            numerator: ah.data?.habitFormed,
            denominator: ah.data?.activated,
            isNoData: true,
            noDataReason:
              "user_sessions table is empty — the lovifymusic app isn't logging daily app opens yet.",
          })
        )
      }
    />,
    <CausalTile
      key="d7"
      index={3}
      question="Do they come back after 1 week?"
      rate={retention.data?.d7.rate}
      priorRate={retentionPrior.data?.d7.rate}
      isLoading={retention.isLoading}
      numerator={retention.data?.d7.retained}
      denominator={retention.data?.d7.eligible}
      healthyMin={0.25}
      healthyMax={0.4}
      plainEnglish="Of users who joined a week ago, how many are still using the app. If they don't come back in week 1, they almost never come back."
      goalText="Want 25%+"
      noDataReason="The lovifymusic app isn't logging app-open sessions yet. One-line fix in the app."
      onClick={() =>
        setDrillStep({ key: 'd7_retention', label: 'Do they come back after 1 week?' })
      }
      onAskAi={() =>
        setAiContext(
          buildCtx({
            question: 'Do they come back after 1 week?',
            metric: 'D7 Retention',
            currentValue: '— (NO DATA)',
            healthyRange: '25%–40% for a consumer subscription app',
            status: 'NO DATA YET',
            numerator: retention.data?.d7.retained,
            denominator: retention.data?.d7.eligible,
            isNoData: true,
            noDataReason:
              "user_sessions table is empty — the lovifymusic app isn't logging daily app opens yet.",
          })
        )
      }
    />,
    <CausalTile
      key="d30"
      index={4}
      question="Do they come back after 1 month?"
      rate={retention.data?.d30.rate}
      priorRate={retentionPrior.data?.d30.rate}
      isLoading={retention.isLoading}
      numerator={retention.data?.d30.retained}
      denominator={retention.data?.d30.eligible}
      healthyMin={0.15}
      healthyMax={0.25}
      plainEnglish="Of users who joined 30 days ago, how many are still active. This is whether the product creates lasting value."
      goalText="Want 15%+"
      noDataReason="The lovifymusic app isn't logging app-open sessions yet. One-line fix in the app."
      onClick={() =>
        setDrillStep({ key: 'd30_retention', label: 'Do they come back after 1 month?' })
      }
      onAskAi={() =>
        setAiContext(
          buildCtx({
            question: 'Do they come back after 1 month?',
            metric: 'D30 Retention',
            currentValue: '— (NO DATA)',
            healthyRange: '15%–25%',
            status: 'NO DATA YET',
            numerator: retention.data?.d30.retained,
            denominator: retention.data?.d30.eligible,
            isNoData: true,
            noDataReason:
              "user_sessions table is empty — the lovifymusic app isn't logging daily app opens yet.",
          })
        )
      }
    />,
    <CausalTile
      key="d90"
      index={5}
      question="Do they stick for 3 months?"
      rate={retention.data?.d90.rate}
      priorRate={retentionPrior.data?.d90.rate}
      isLoading={retention.isLoading}
      numerator={retention.data?.d90.retained}
      denominator={retention.data?.d90.eligible}
      healthyMin={0.08}
      healthyMax={0.15}
      plainEnglish="Of users who joined 3 months ago, how many are still active. These are the users who made the app part of their life."
      goalText="Want 8%+"
      noDataReason="The lovifymusic app isn't logging app-open sessions yet. One-line fix in the app."
      onClick={() =>
        setDrillStep({ key: 'd90_retention', label: 'Do they stick for 3 months?' })
      }
      onAskAi={() =>
        setAiContext(
          buildCtx({
            question: 'Do they stick for 3 months?',
            metric: 'D90 Retention',
            currentValue: '— (NO DATA)',
            healthyRange: '8%–15%',
            status: 'NO DATA YET',
            numerator: retention.data?.d90.retained,
            denominator: retention.data?.d90.eligible,
            isNoData: true,
            noDataReason:
              "user_sessions table is empty — the lovifymusic app isn't logging daily app opens yet.",
          })
        )
      }
    />,
  ]

  return (
    <div>
      <div className="mb-3">
        <h3 className="text-base font-semibold text-foreground">
          Are users getting hooked and sticking around?
        </h3>
        <p className="text-xs text-tertiary mt-0.5">
          Click any tile to see exactly which users are in (or not in) that group. Each tile
          compares to the prior {filters.cohortFrom} → {filters.cohortTo} window.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">{tiles}</div>

      <FunnelDrillDown
        open={drillStep !== null}
        onClose={() => setDrillStep(null)}
        filters={filters}
        stepKey={drillStep?.key ?? null}
        stepLabel={drillStep?.label ?? null}
      />

      <AiInsightPanel
        open={aiContext !== null}
        onClose={() => setAiContext(null)}
        context={aiContext}
      />
    </div>
  )
}
