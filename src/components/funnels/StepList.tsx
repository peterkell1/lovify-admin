import { ArrowUp, ArrowDown, Edit, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { FunnelStep } from '@/types/funnels'
import { STEP_TYPE_LABEL } from '@/types/funnels'

export function StepList({
  steps,
  onEdit,
  onDelete,
  onMove,
  busy,
}: {
  steps: FunnelStep[]
  onEdit: (step: FunnelStep) => void
  onDelete: (step: FunnelStep) => void
  onMove: (step: FunnelStep, dir: 'up' | 'down') => void
  busy: boolean
}) {
  if (steps.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-tertiary">
        No steps yet. Add your first step to build the funnel flow.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {steps.map((s, i) => (
        <div
          key={s.id}
          className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-xs font-bold">
              {s.position}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">
                  {(s.config as { title?: string }).title ?? s.step_key}
                </span>
                <Badge variant="outline">{STEP_TYPE_LABEL[s.step_type]}</Badge>
              </div>
              <p className="mt-0.5 font-mono text-xs text-tertiary">{s.step_key}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onMove(s, 'up')}
              disabled={busy || i === 0}
              className="rounded-md p-2 text-tertiary hover:bg-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="Move step up"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
            <button
              onClick={() => onMove(s, 'down')}
              disabled={busy || i === steps.length - 1}
              className="rounded-md p-2 text-tertiary hover:bg-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="Move step down"
            >
              <ArrowDown className="h-4 w-4" />
            </button>
            <button
              onClick={() => onEdit(s)}
              className="rounded-md p-2 text-tertiary hover:bg-secondary hover:text-foreground"
              aria-label="Edit step"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(s)}
              className="rounded-md p-2 text-destructive hover:bg-destructive/10"
              aria-label="Delete step"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
