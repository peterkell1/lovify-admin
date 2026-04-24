import { useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { Select } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { PlanOption } from '@/types/funnels'
import {
  LOVIFY_PLANS_BY_INTERVAL,
  INTERVAL_LABEL,
  formatPlanPrice,
  type LovifyIntervalKey,
  type LovifyPlan,
} from '@/config/lovify-plans'

// ─────────────────────────────────────────────────────────────────────
// Admin-side Plans editor, catalog-style:
//
//   • Marketer sees every plan in the Lovify catalog, grouped by interval.
//   • A checkbox per plan toggles whether end users can pick it on the paywall.
//   • A single radio picks the *default plan* that the funnel paywall's
//     dropdowns preselect on first load.
//   • A dropdown picks the *default interval* — the tab the paywall opens on.
//
// PlanOption rows in the DB are materialised from the catalog on toggle, so
// the funnel side doesn't need to know about the catalog at all.
// ─────────────────────────────────────────────────────────────────────

export function PaywallPlanPicker({
  value,
  onChange,
  defaultPlanKey,
  onDefaultChange,
  defaultInterval,
  onDefaultIntervalChange,
}: {
  value: PlanOption[]
  onChange: (next: PlanOption[]) => void
  defaultPlanKey: string | null
  onDefaultChange: (next: string | null) => void
  defaultInterval: LovifyIntervalKey | null
  onDefaultIntervalChange: (next: LovifyIntervalKey | null) => void
}) {
  const enabledKeys = new Set(value.map((p) => p.planKey))

  const togglePlan = (plan: LovifyPlan, enabled: boolean) => {
    if (enabled) {
      if (enabledKeys.has(plan.id)) return
      const option: PlanOption = {
        planKey: plan.id,
        stripePriceId: plan.stripePriceId,
        label: plan.name,
        trialDays: plan.trialDays ?? 0,
        amountCents: Math.round(plan.price * 100),
        credits: plan.credits,
        interval: plan.interval,
      }
      const next = [...value, option]
      onChange(next)
      // First plan added becomes the default automatically.
      if (!defaultPlanKey) onDefaultChange(plan.id)
    } else {
      const next = value.filter((p) => p.planKey !== plan.id)
      onChange(next)
      if (defaultPlanKey === plan.id) {
        onDefaultChange(next[0]?.planKey ?? null)
      }
    }
  }

  const intervalHasEnabled = (key: LovifyIntervalKey) =>
    LOVIFY_PLANS_BY_INTERVAL[key].some((p) => enabledKeys.has(p.id))

  return (
    <div className="space-y-4">
      {/* Defaults bar */}
      <div className="rounded-lg border border-border bg-card p-3 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Paywall defaults
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="block space-y-1">
            <span className="text-xs font-semibold text-foreground">Default interval</span>
            <Select
              value={defaultInterval ?? ''}
              onChange={(e) =>
                onDefaultIntervalChange(
                  (e.target.value as LovifyIntervalKey) || null,
                )
              }
            >
              <option value="">Auto (Trial if available)</option>
              {(Object.keys(INTERVAL_LABEL) as LovifyIntervalKey[]).map((k) => (
                <option key={k} value={k} disabled={!intervalHasEnabled(k)}>
                  {INTERVAL_LABEL[k]}
                  {!intervalHasEnabled(k) ? ' — no plans enabled' : ''}
                </option>
              ))}
            </Select>
            <p className="text-[11px] text-muted-foreground">
              Tab preselected when the paywall first loads.
            </p>
          </label>

          <div className="space-y-1">
            <span className="text-xs font-semibold text-foreground">Default plan</span>
            <div className="rounded-md border border-input bg-secondary px-3 py-2 text-sm">
              {defaultPlanKey ? (
                <span className="font-semibold text-foreground">
                  {value.find((p) => p.planKey === defaultPlanKey)?.label ?? defaultPlanKey}
                </span>
              ) : (
                <span className="text-muted-foreground">
                  Pick a default below
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Preselected credit tier within the default interval.
            </p>
          </div>
        </div>
      </div>

      {/* Catalog grouped by interval */}
      {(Object.keys(LOVIFY_PLANS_BY_INTERVAL) as LovifyIntervalKey[]).map((key) => (
        <CatalogGroup
          key={key}
          intervalKey={key}
          plans={LOVIFY_PLANS_BY_INTERVAL[key]}
          enabledKeys={enabledKeys}
          defaultPlanKey={defaultPlanKey}
          onToggle={togglePlan}
          onPickDefault={(planId) => onDefaultChange(planId)}
        />
      ))}

      {value.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center">
          Enable at least one plan above before publishing the funnel.
        </p>
      ) : null}
    </div>
  )
}

// ─── One interval group ──────────────────────────────────────────────

function CatalogGroup({
  intervalKey,
  plans,
  enabledKeys,
  defaultPlanKey,
  onToggle,
  onPickDefault,
}: {
  intervalKey: LovifyIntervalKey
  plans: LovifyPlan[]
  enabledKeys: Set<string>
  defaultPlanKey: string | null
  onToggle: (plan: LovifyPlan, enabled: boolean) => void
  onPickDefault: (planId: string) => void
}) {
  const enabledCount = plans.filter((p) => enabledKeys.has(p.id)).length
  // Open by default only if this group has enabled plans — collapsed
  // groups are cheap to scan and still show their summary.
  const [open, setOpen] = useState(enabledCount > 0)
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-foreground/[0.02] transition-colors"
      >
        <div className="min-w-0">
          <h4 className="text-sm font-semibold text-foreground">
            {INTERVAL_LABEL[intervalKey]}
          </h4>
          <p className="text-[11px] text-muted-foreground">
            {enabledCount === 0
              ? `${plans.length} plan${plans.length === 1 ? '' : 's'} available`
              : `${enabledCount} of ${plans.length} enabled`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {enabledCount > 0 ? (
            <span className="rounded-full bg-orange-500/10 px-2 py-0.5 text-[10px] font-bold text-orange-600">
              {enabledCount}
            </span>
          ) : null}
          <ChevronDown
            className={cn(
              'h-4 w-4 text-muted-foreground transition-transform duration-200',
              open ? 'rotate-180' : 'rotate-0',
            )}
          />
        </div>
      </button>
      <div
        className={cn(
          'grid transition-[grid-template-rows] duration-300 ease-out',
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className="overflow-hidden">
          <ul className="divide-y divide-border border-t border-border">
        {plans.map((plan) => {
          const isEnabled = enabledKeys.has(plan.id)
          const isDefault = defaultPlanKey === plan.id
          return (
            <li key={plan.id} className="flex items-center gap-3 px-4 py-3">
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={(e) => onToggle(plan, e.target.checked)}
                className="h-4 w-4 rounded border-border text-orange-500 focus:ring-orange-500"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-semibold text-sm text-foreground truncate">
                    {plan.name}
                  </p>
                  <p className="font-mono text-xs text-muted-foreground flex-shrink-0">
                    {formatPlanPrice(plan)}
                  </p>
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="rounded-full bg-orange-500/10 px-2 py-0.5 font-semibold text-orange-600">
                    {plan.credits.toLocaleString()} credits
                  </span>
                  {plan.trialDays ? (
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 font-semibold text-emerald-600">
                      {plan.trialDays}-day free trial
                    </span>
                  ) : null}
                  {plan.perceivedSavings ? (
                    <span className="rounded-full bg-rose-500/10 px-2 py-0.5 font-semibold text-rose-600">
                      {plan.perceivedSavings}
                    </span>
                  ) : null}
                </div>
              </div>
              <label
                className={cn(
                  'flex items-center gap-1.5 text-[11px] font-semibold cursor-pointer whitespace-nowrap',
                  isEnabled ? 'text-foreground' : 'text-muted-foreground/60 cursor-not-allowed',
                )}
              >
                <input
                  type="radio"
                  name="default-plan"
                  checked={isDefault}
                  disabled={!isEnabled}
                  onChange={() => onPickDefault(plan.id)}
                  className="text-orange-500 focus:ring-orange-500"
                />
                {isDefault ? (
                  <span className="inline-flex items-center gap-1 text-orange-600">
                    <Check className="h-3 w-3" /> Default
                  </span>
                ) : (
                  'Set default'
                )}
              </label>
            </li>
          )
        })}
          </ul>
        </div>
      </div>
    </div>
  )
}
