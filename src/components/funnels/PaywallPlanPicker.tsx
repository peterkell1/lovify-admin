import { Plus, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { PlanOption } from '@/types/funnels'

export function PaywallPlanPicker({
  value,
  onChange,
  defaultPlanKey,
  onDefaultChange,
}: {
  value: PlanOption[]
  onChange: (next: PlanOption[]) => void
  defaultPlanKey: string | null
  onDefaultChange: (next: string | null) => void
}) {
  const update = (i: number, patch: Partial<PlanOption>) => {
    onChange(value.map((v, idx) => (idx === i ? { ...v, ...patch } : v)))
  }
  const remove = (i: number) => {
    const next = value.filter((_, idx) => idx !== i)
    onChange(next)
    if (value[i].planKey === defaultPlanKey) {
      onDefaultChange(next[0]?.planKey ?? null)
    }
  }
  const add = () => {
    onChange([
      ...value,
      { planKey: '', stripePriceId: '', label: '', trialDays: 0, amountCents: 0 },
    ])
  }

  return (
    <div className="space-y-3">
      {value.map((p, i) => (
        <div
          key={i}
          className="space-y-2 rounded-lg border border-border bg-card p-3"
        >
          <div className="flex items-center justify-between gap-2">
            <label className="flex items-center gap-2 text-xs">
              <input
                type="radio"
                name="default-plan"
                checked={defaultPlanKey === p.planKey && !!p.planKey}
                onChange={() => onDefaultChange(p.planKey || null)}
              />
              Default on paywall
            </label>
            <button
              type="button"
              onClick={() => remove(i)}
              className="rounded-md p-1.5 text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="planKey (e.g. yearly_premium_trial)"
              value={p.planKey}
              onChange={(e) => update(i, { planKey: e.target.value })}
              className="font-mono text-xs"
            />
            <Input
              placeholder="price_XXXXXXXX"
              value={p.stripePriceId}
              onChange={(e) => update(i, { stripePriceId: e.target.value })}
              className="font-mono text-xs"
            />
          </div>
          <Input
            placeholder="Label shown on paywall"
            value={p.label}
            onChange={(e) => update(i, { label: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              placeholder="Trial days (0 = charge now)"
              value={p.trialDays}
              onChange={(e) => update(i, { trialDays: Number(e.target.value) })}
            />
            <Input
              type="number"
              placeholder="Amount in cents (e.g. 8999)"
              value={p.amountCents}
              onChange={(e) => update(i, { amountCents: Number(e.target.value) })}
            />
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add}>
        <Plus className="h-3 w-3" /> Add plan
      </Button>
    </div>
  )
}
