import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useOnboardingFunnel, type ProductFilters, type FunnelStep } from '@/hooks/use-product-dashboard'
import { cn } from '@/lib/utils'
import { ChevronRight, AlertTriangle, MousePointerClick } from 'lucide-react'
import { FunnelDrillDown } from './FunnelDrillDown'

function pct(n: number) {
  if (!Number.isFinite(n)) return '—'
  return `${(n * 100).toFixed(1)}%`
}

interface StepCardProps {
  step: FunnelStep
  index: number
  isLast: boolean
  onClick: ((step: FunnelStep) => void) | null
}

function StepCard({ step, index, isLast, onClick }: StepCardProps) {
  if (step.blocked) {
    return (
      <div className="flex items-stretch shrink-0">
        <div className="w-44 rounded-xl border border-dashed border-border bg-muted/30 p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[10px] font-bold text-tertiary tracking-widest">
              {String(index + 1).padStart(2, '0')}
            </span>
            <AlertTriangle className="h-3 w-3 text-amber-500" />
          </div>
          <p className="text-xs font-semibold text-muted-foreground">{step.label}</p>
          <p className="text-2xl font-bold mt-2 text-muted-foreground/60">—</p>
          <p className="text-[10px] text-amber-700 mt-2 leading-snug">{step.blockedReason}</p>
        </div>
        {!isLast && (
          <div className="flex items-center px-1 text-tertiary">
            <ChevronRight className="h-4 w-4" />
          </div>
        )}
      </div>
    )
  }

  // Coloring:
  //   green ≥70%, amber 30–70%, red <30% — true funnel drop-off
  //   blue >105% — non-linear: users hit this step without going through prev
  //   muted — undefined (prev was 0)
  let dropColor = 'text-emerald-600'
  let nonLinear = false
  if (Number.isFinite(step.pctOfPrev)) {
    if (step.pctOfPrev > 1.05) {
      dropColor = 'text-sky-600'
      nonLinear = true
    } else if (step.pctOfPrev < 0.3) dropColor = 'text-rose-600'
    else if (step.pctOfPrev < 0.7) dropColor = 'text-amber-600'
  } else {
    dropColor = 'text-muted-foreground'
  }

  const clickable = onClick !== null

  return (
    <div className="flex items-stretch shrink-0">
      <button
        type="button"
        onClick={clickable ? () => onClick!(step) : undefined}
        disabled={!clickable}
        className={cn(
          'w-44 text-left rounded-xl border border-border bg-card p-3 shadow-soft transition-all group',
          clickable && 'cursor-pointer hover:border-accent/40 hover:shadow-dreamy'
        )}
      >
        <div className="flex items-start justify-between">
          <p className="text-[10px] font-bold text-tertiary tracking-widest">
            {String(index + 1).padStart(2, '0')}
          </p>
          {clickable && (
            <MousePointerClick className="h-3 w-3 text-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </div>
        <p className="text-xs font-semibold text-foreground">{step.label}</p>
        <p className="text-3xl font-bold mt-2 text-foreground tracking-tight">
          {step.count.toLocaleString()}
        </p>
        {index > 0 && (
          <div className="mt-1.5 space-y-0.5">
            <p className={cn('text-[11px] font-medium', dropColor)}>
              {pct(step.pctOfPrev)} of prev
            </p>
            {nonLinear && (
              <p className="text-[9px] text-sky-700 italic leading-tight">
                some skipped prior step
              </p>
            )}
            <p className="text-[10px] text-muted-foreground">{pct(step.pctOfTop)} of signups</p>
          </div>
        )}
      </button>
      {!isLast && (
        <div className="flex items-center px-1 text-tertiary">
          <ChevronRight className="h-4 w-4" />
        </div>
      )}
    </div>
  )
}

export function OnboardingFunnel({ filters }: { filters: ProductFilters }) {
  const { data, isLoading } = useOnboardingFunnel(filters)
  const [drillStep, setDrillStep] = useState<FunnelStep | null>(null)

  const handleStepClick = (step: FunnelStep) => {
    if (step.blocked) return
    setDrillStep(step)
  }

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-base font-semibold text-foreground">Onboarding → Paid Funnel</h3>
          <p className="text-xs text-tertiary mt-0.5">
            Click any step to drill into the users behind it. Drop-off: green ≥70% · amber 30–70% · red &lt;30% · blue &gt;100% (skipped prior).
          </p>
        </div>
        {data && (
          <div className="flex items-center gap-4 text-xs">
            <div>
              <span className="text-tertiary">Signed up today: </span>
              <strong className="text-foreground">{data.signedUpToday}</strong>
            </div>
            <div>
              <span className="text-tertiary">Paid today: </span>
              <strong className="text-foreground">{data.paidToday}</strong>
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-2 overflow-x-auto">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-44 shrink-0" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-stretch gap-0 overflow-x-auto pb-2 -mb-2">
              {data?.steps.map((s, i) => (
                <StepCard
                  key={s.key}
                  step={s}
                  index={i}
                  isLast={i === data.steps.length - 1}
                  onClick={s.blocked ? null : handleStepClick}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <FunnelDrillDown
        open={drillStep !== null}
        onClose={() => setDrillStep(null)}
        filters={filters}
        stepKey={drillStep?.key ?? null}
        stepLabel={drillStep?.label ?? null}
      />
    </div>
  )
}
