import { Check, X, ArrowRight, ChevronDown, CheckCircle, Mail } from 'lucide-react'
import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import type { PlanOption, StepType, Funnel } from '@/types/funnels'
import { PhoneFrame } from './ui/PhoneFrame'
import { ProgressBar } from './ui/ProgressBar'
import { PreviewButton } from './ui/PreviewButton'
import { interpolatePreview } from './interpolate'
import { getLovifyPlanById } from '@/config/lovify-plans'

export type PreviewFunnelDefaults = {
  planOptions: PlanOption[]
  defaultPlanKey: string | null
  defaultInterval: Funnel['default_interval']
}

// Read-only mirror of lovify-funnel/src/components/steps/*. Every renderer
// here takes the same `config` JSONB the marketer is editing live and paints
// the step as it would appear in the funnel — minus animations, auto-advance
// timers, and network side-effects. Drift risk is real: if you change a step
// visual in the funnel, update the matching branch here.

type Cfg = Record<string, unknown>

const HIDE_PROGRESS_ON: StepType[] = [
  'welcome',
  'narrative',
  'crafting',
  'paywall',
  'success',
]

export function StepPreview({
  stepType,
  config,
  stepKey,
  funnelName,
  funnelDefaults,
}: {
  stepType: StepType
  config: Cfg
  stepKey: string
  funnelName: string
  funnelDefaults: PreviewFunnelDefaults
}) {
  const showProgress = !HIDE_PROGRESS_ON.includes(stepType)
  return (
    <PhoneFrame>
      {showProgress ? (
        <div className="flex-shrink-0 -mx-6">
          <ProgressBar current={2} total={10} />
        </div>
      ) : null}
      <div className="flex-1 flex flex-col min-h-0">
        {renderBody(stepType, config, stepKey, funnelName, funnelDefaults)}
      </div>
    </PhoneFrame>
  )
}

function renderBody(
  stepType: StepType,
  config: Cfg,
  stepKey: string,
  funnelName: string,
  funnelDefaults: PreviewFunnelDefaults,
) {
  switch (stepType) {
    case 'email-capture':
      return <EmailCapturePreview config={config} funnelName={funnelName} />
    case 'welcome':
      return <WelcomePreview config={config} />
    case 'narrative':
      return <NarrativePreview config={config} />
    case 'quiz-single':
      return <QuizSinglePreview config={config} />
    case 'quiz-multi':
      return <QuizMultiPreview config={config} />
    case 'number-picker':
      return <NumberPickerPreview config={config} />
    case 'time-picker':
      return <TimePickerPreview config={config} />
    case 'statement':
      return <StatementPreview config={config} />
    case 'genre-picker':
      return <GenrePickerPreview config={config} />
    case 'crafting':
      return <CraftingPreview config={config} />
    case 'paywall':
      return <PaywallPreview config={config} funnelDefaults={funnelDefaults} />
    case 'success':
      return <SuccessPreview config={config} />
  }
  return <UnknownPreview stepKey={stepKey} />
}

// ─── Previews ───────────────────────────────────────────────────────────

function EmailCapturePreview({ config, funnelName }: { config: Cfg; funnelName: string }) {
  return (
    <div className="flex-1 flex flex-col justify-center">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-orange-500 text-center">
        {funnelName || 'Your funnel'}
      </p>
      <h1 className="mt-3 font-display text-[1.6rem] font-extrabold text-foreground text-center leading-tight">
        {(config.title as string) || 'Start your Lovify journey'}
      </h1>
      {config.subtitle ? (
        <p className="mt-3 text-sm text-muted-foreground text-center leading-relaxed">
          {config.subtitle as string}
        </p>
      ) : null}
      <div className="mt-8 space-y-3">
        <div className="h-12 rounded-xl bg-foreground/5 border border-foreground/15 flex items-center px-4 text-sm text-muted-foreground">
          you@example.com
        </div>
        <PreviewButton>{(config.cta_label as string) || 'Continue'}</PreviewButton>
      </div>
      {config.consent_copy ? (
        <p className="mt-6 text-center text-xs text-muted-foreground leading-relaxed">
          {config.consent_copy as string}
        </p>
      ) : null}
    </div>
  )
}

function WelcomePreview({ config }: { config: Cfg }) {
  return (
    <>
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        {config.character_image_url ? (
          <img
            src={config.character_image_url as string}
            alt=""
            className="w-56 h-56 object-contain mb-6 drop-shadow-lg"
          />
        ) : config.hero_emoji ? (
          <div className="text-7xl mb-8 drop-shadow-lg">{config.hero_emoji as string}</div>
        ) : null}
        <h1 className="font-display text-[1.7rem] font-extrabold text-foreground leading-tight">
          {(config.title as string) || 'Welcome'}
        </h1>
        {config.subtitle ? (
          <p className="text-muted-foreground text-base leading-relaxed max-w-xs mt-3">
            {config.subtitle as string}
          </p>
        ) : null}
        {config.body_md ? (
          <p className="text-muted-foreground leading-relaxed max-w-sm mt-4">
            {config.body_md as string}
          </p>
        ) : null}
      </div>
      <div className="pb-8">
        <PreviewButton>{(config.cta_label as string) || 'Continue'}</PreviewButton>
      </div>
    </>
  )
}

function NarrativePreview({ config }: { config: Cfg }) {
  const title = interpolatePreview((config.title as string) ?? '')
  const subtitle = config.subtitle
    ? interpolatePreview(config.subtitle as string)
    : null
  const bullets = (config.bullets as { emoji?: string; text: string }[]) ?? []
  return (
    <>
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        {config.character_image_url ? (
          <img
            src={config.character_image_url as string}
            alt=""
            className="w-48 h-48 object-contain mb-5 drop-shadow-lg"
          />
        ) : config.hero_emoji ? (
          <div className="text-6xl mb-5 drop-shadow-lg">{config.hero_emoji as string}</div>
        ) : null}
        <h1 className="font-display text-[1.5rem] font-extrabold text-foreground leading-tight max-w-sm">
          {title || 'Your headline here'}
        </h1>
        {subtitle ? (
          <p className="text-muted-foreground text-base leading-relaxed max-w-xs mt-3">
            {subtitle}
          </p>
        ) : null}
        {bullets.length > 0 ? (
          <ul className="mt-5 flex flex-col gap-3 text-left w-full max-w-sm">
            {bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-3">
                {b.emoji ? <span className="text-lg leading-none mt-0.5">{b.emoji}</span> : null}
                <span className="text-[14px] text-foreground leading-snug">{b.text}</span>
              </li>
            ))}
          </ul>
        ) : null}
        {config.footer_note ? (
          <p className="mt-5 text-xs text-muted-foreground">{config.footer_note as string}</p>
        ) : null}
      </div>
      <div className="pb-8">
        <PreviewButton>
          {(config.cta_label as string) || 'Continue'}
          <ArrowRight className="w-5 h-5" />
        </PreviewButton>
      </div>
    </>
  )
}

type QuizOption = { value: string; label: string; emoji?: string }

function QuizSinglePreview({ config }: { config: Cfg }) {
  const options = Array.isArray(config.options) ? (config.options as QuizOption[]) : []
  const isHorizontal = config.layout === 'horizontal'
  return (
    <>
      <h1 className="font-display text-xl font-extrabold text-foreground text-center leading-snug pt-6">
        {(config.title as string) || 'Quiz question'}
      </h1>
      {config.subtitle ? (
        <p className="text-sm text-muted-foreground text-center mt-2 leading-relaxed">
          {config.subtitle as string}
        </p>
      ) : null}
      <div className={cn('mt-8', isHorizontal ? 'flex gap-3' : 'flex flex-col gap-[10px]')}>
        {options.map((opt, i) => (
          <div
            key={i}
            className={cn(
              'py-[14px] px-6 rounded-xl text-[15px] font-semibold bg-foreground/5 border border-foreground/15 text-foreground',
              isHorizontal ? 'flex-1 text-center' : 'text-left',
            )}
          >
            {opt.emoji && !isHorizontal ? (
              <span className="inline-flex items-center gap-3">
                <span className="text-xl">{opt.emoji}</span>
                <span>{opt.label}</span>
              </span>
            ) : (
              opt.label || opt.value || 'Option'
            )}
          </div>
        ))}
      </div>
    </>
  )
}

function QuizMultiPreview({ config }: { config: Cfg }) {
  const options = Array.isArray(config.options) ? (config.options as QuizOption[]) : []
  const min = (config.min as number) ?? 1
  return (
    <>
      <h1 className="font-display text-xl font-extrabold text-foreground text-center leading-snug pt-6">
        {(config.title as string) || 'Quiz question'}
      </h1>
      {config.subtitle ? (
        <p className="text-sm text-muted-foreground text-center mt-2 leading-relaxed">
          {config.subtitle as string}
        </p>
      ) : null}
      <div className="overflow-y-auto no-scrollbar -mx-1 px-1 pb-2 mt-6 flex flex-col gap-[10px] flex-1">
        {options.map((opt, i) => (
          <div
            key={i}
            className="flex items-center gap-3 py-[14px] px-4 rounded-xl text-left text-[15px] font-semibold bg-foreground/5 border-2 border-transparent text-foreground"
          >
            {opt.emoji ? <span className="text-xl flex-shrink-0">{opt.emoji}</span> : null}
            <span className="flex-1">{opt.label || opt.value}</span>
            <span className="w-5 h-5 rounded-full border-2 border-foreground/20 flex-shrink-0" />
          </div>
        ))}
      </div>
      <div className="pt-4 pb-2">
        <PreviewButton disabled>Select at least {min} to continue</PreviewButton>
      </div>
    </>
  )
}

function NumberPickerPreview({ config }: { config: Cfg }) {
  const min = (config.min as number) ?? 0
  const max = (config.max as number) ?? 100
  const step = (config.step as number) ?? 1
  const defaultVal = (config.default as number) ?? Math.floor((min + max) / 2)
  const around: number[] = []
  for (let i = -2; i <= 2; i++) {
    const v = defaultVal + i * step
    if (v >= min && v <= max) around.push(v)
  }
  return (
    <>
      <div className="pt-8 text-center">
        <h1 className="font-display text-xl font-extrabold text-foreground leading-snug">
          {(config.title as string) || 'Pick a number'}
        </h1>
        {config.subtitle ? (
          <p className="text-sm text-muted-foreground mt-2">{config.subtitle as string}</p>
        ) : null}
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="relative flex items-center gap-6">
          <div className="flex flex-col items-center">
            {around.map((v) => {
              const isSelected = v === defaultVal
              return (
                <div
                  key={v}
                  className={cn(
                    'font-display font-extrabold tabular-nums h-[52px] flex items-center justify-center min-w-[80px]',
                    isSelected
                      ? 'text-foreground text-3xl'
                      : 'text-muted-foreground/50 text-2xl',
                  )}
                >
                  {v}
                </div>
              )
            })}
          </div>
          {config.unit_label ? (
            <span className="text-lg font-semibold text-orange-500">{config.unit_label as string}</span>
          ) : null}
        </div>
      </div>
      <div className="pb-8">
        <PreviewButton>
          Continue
          <ArrowRight className="w-5 h-5" />
        </PreviewButton>
      </div>
    </>
  )
}

function TimePickerPreview({ config }: { config: Cfg }) {
  const hour = (config.default_hour as number) ?? 9
  const minute = (config.default_minute as number) ?? 0
  const period = (config.default_period as string) ?? 'AM'
  const pad = (n: number) => (n < 10 ? `0${n}` : String(n))
  return (
    <>
      <div className="pt-6 text-center">
        <h1 className="font-display text-xl font-extrabold text-foreground leading-snug">
          {(config.title as string) || '21 days is a great start'}
        </h1>
        {config.subtitle ? (
          <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto leading-relaxed">
            {config.subtitle as string}
          </p>
        ) : null}
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="relative inline-flex items-center gap-2 px-4 py-3 rounded-lg bg-foreground/5">
          <span className="font-display text-2xl font-extrabold text-foreground tabular-nums">{hour}</span>
          <span className="font-display text-2xl font-extrabold text-foreground">:</span>
          <span className="font-display text-2xl font-extrabold text-foreground tabular-nums">{pad(minute)}</span>
          <span className="font-display text-2xl font-extrabold text-foreground ml-2">{period}</span>
        </div>
      </div>
      <div className="pb-8">
        <PreviewButton>
          {(config.cta_label as string) || 'Continue'}
          <ArrowRight className="w-5 h-5" />
        </PreviewButton>
      </div>
    </>
  )
}

function StatementPreview({ config }: { config: Cfg }) {
  return (
    <>
      <h1 className="font-display text-xl font-extrabold text-foreground text-center leading-snug pt-6">
        {(config.title as string) || 'Do you relate to the statement?'}
      </h1>
      <div className="flex-1 flex items-center justify-center">
        <div className="relative rounded-2xl bg-foreground/10 px-6 py-6 max-w-xs">
          <span className="absolute top-2 left-3 text-2xl text-foreground/40 leading-none">“</span>
          <p className="text-foreground text-base leading-relaxed pl-4">
            {(config.statement as string) || 'Your statement goes here.'}
          </p>
        </div>
      </div>
      <div className="flex gap-3 pb-8">
        {(['no', 'yes'] as const).map((v) => {
          const Icon = v === 'yes' ? Check : X
          const iconColor = v === 'yes' ? 'text-emerald-500' : 'text-orange-500'
          return (
            <div
              key={v}
              className="flex-1 py-4 rounded-xl font-semibold flex flex-col items-center gap-1 bg-foreground/5 border border-foreground/15 text-foreground"
            >
              <Icon className={cn('w-5 h-5', iconColor)} />
              <span className="text-sm capitalize">{v}</span>
            </div>
          )
        })}
      </div>
    </>
  )
}

function GenrePickerPreview({ config }: { config: Cfg }) {
  const genres = Array.isArray(config.genres) ? (config.genres as QuizOption[]) : []
  const min = (config.min as number) ?? 1
  return (
    <>
      <h1 className="font-display text-xl font-extrabold text-foreground text-center leading-snug pt-6 mb-2">
        {(config.title as string) || 'Pick genres'}
      </h1>
      {config.subtitle ? (
        <p className="text-sm text-muted-foreground text-center mb-6 leading-relaxed">
          {config.subtitle as string}
        </p>
      ) : null}
      <div className="flex-1 overflow-y-auto no-scrollbar py-4">
        <div className="flex flex-wrap justify-center gap-2.5">
          {genres.map((g, i) => (
            <div
              key={i}
              className="px-4 py-2 rounded-full border-2 border-border/60 bg-card/50 flex items-center gap-2 text-[0.9rem] font-semibold text-foreground"
            >
              {g.emoji ? <span className="text-base">{g.emoji}</span> : null}
              <span>{g.label || g.value}</span>
            </div>
          ))}
        </div>
      </div>
      <p className="text-sm text-muted-foreground text-center mt-2">Select at least {min} to continue</p>
      <div className="pt-4 pb-2">
        <PreviewButton disabled>Continue</PreviewButton>
      </div>
    </>
  )
}

function CraftingPreview({ config }: { config: Cfg }) {
  const messages = Array.isArray(config.messages) && config.messages.length > 0
    ? (config.messages as string[])
    : ['Loading…']
  return (
    <>
      <h1 className="font-display text-[1.6rem] font-extrabold text-foreground leading-tight text-left pt-10">
        We are crafting your{' '}
        <span className="bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-text text-transparent">
          experience
        </span>
        ...
      </h1>
      <div className="mt-10 space-y-4 flex-1">
        {messages.map((msg, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-xl border border-border/50 p-4 bg-card/80 text-muted-foreground"
          >
            <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center">
              <span className="w-3 h-3 rounded-full border-2 border-muted-foreground/40" />
            </span>
            <span className="text-[15px] font-semibold">{msg}</span>
          </div>
        ))}
      </div>
      <div className="px-2 pb-6">
        <div className="h-1.5 w-full bg-secondary/60 rounded-full overflow-hidden">
          <div className="h-full w-1/3 bg-gradient-to-r from-orange-500 to-rose-500 rounded-full" />
        </div>
      </div>
    </>
  )
}

// Virtual "trial" interval mirrors funnel PaywallStep.
type PaywallIntervalKey = 'trial' | 'year' | 'quarter' | 'month'

const PAYWALL_INTERVAL_LABEL: Record<PaywallIntervalKey, string> = {
  trial: 'Free trial',
  year: 'Annual',
  quarter: 'Quarterly',
  month: 'Monthly',
}

const PAYWALL_INTERVAL_ORDER: PaywallIntervalKey[] = ['trial', 'year', 'quarter', 'month']

function intervalOf(plan: PlanOption): PaywallIntervalKey {
  if (plan.trialDays && plan.trialDays > 0) return 'trial'
  return (plan.interval ?? 'year') as PaywallIntervalKey
}

function PaywallPreview({
  config,
  funnelDefaults,
}: {
  config: Cfg
  funnelDefaults: PreviewFunnelDefaults
}) {
  const features = Array.isArray(config.features) ? (config.features as string[]) : []
  const stepPlanKeys = Array.isArray(config.plan_keys) ? (config.plan_keys as string[]) : []

  // Resolve which plans light up on this paywall. Matches the funnel
  // PaywallStep logic: step-level plan_keys subset, or full enabled
  // catalog if empty.
  const enabledPlans: PlanOption[] = useMemo(() => {
    if (stepPlanKeys.length > 0) {
      return stepPlanKeys
        .map((k) => funnelDefaults.planOptions.find((p) => p.planKey === k))
        .filter((p): p is PlanOption => Boolean(p))
    }
    return funnelDefaults.planOptions
  }, [funnelDefaults.planOptions, stepPlanKeys])

  const plansByInterval = useMemo(() => {
    const m = new Map<PaywallIntervalKey, PlanOption[]>()
    for (const p of enabledPlans) {
      const k = intervalOf(p)
      const arr = m.get(k) ?? []
      arr.push(p)
      m.set(k, arr)
    }
    return m
  }, [enabledPlans])

  const availableIntervals = PAYWALL_INTERVAL_ORDER.filter(
    (k) => (plansByInterval.get(k) ?? []).length > 0,
  )

  const stepDefaultKey = (config.default_plan_key as string) || null
  const adminDefaultPlan = enabledPlans.find(
    (p) => p.planKey === (stepDefaultKey ?? funnelDefaults.defaultPlanKey ?? ''),
  )
  const adminDefaultInterval = funnelDefaults.defaultInterval as PaywallIntervalKey | null

  const initialInterval: PaywallIntervalKey =
    (adminDefaultInterval && availableIntervals.includes(adminDefaultInterval)
      ? adminDefaultInterval
      : null) ??
    (adminDefaultPlan ? intervalOf(adminDefaultPlan) : null) ??
    availableIntervals[0] ??
    'trial'

  const [interval, setInterval] = useState<PaywallIntervalKey>(initialInterval)
  const currentIntervalPlans = plansByInterval.get(interval) ?? []

  const [planKey, setPlanKey] = useState<string>(
    adminDefaultPlan && intervalOf(adminDefaultPlan) === initialInterval
      ? adminDefaultPlan.planKey
      : currentIntervalPlans[0]?.planKey ?? '',
  )
  const selectedPlan =
    currentIntervalPlans.find((p) => p.planKey === planKey) ?? currentIntervalPlans[0]

  const handleIntervalChange = (next: PaywallIntervalKey) => {
    setInterval(next)
    const first = plansByInterval.get(next)?.[0]
    if (first) setPlanKey(first.planKey)
  }

  if (enabledPlans.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto no-scrollbar py-6 space-y-5">
        <h1 className="font-display text-2xl font-extrabold text-foreground text-center leading-tight">
          {(config.title as string) || 'Unlock your experience'}
        </h1>
        <div className="rounded-xl border border-dashed border-border/50 px-4 py-6 text-xs text-muted-foreground text-center">
          No plans enabled yet. Toggle some on the Plans tab.
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar py-6 space-y-4">
      <h1 className="font-display text-2xl font-extrabold text-foreground text-center leading-tight">
        {(config.title as string) || 'Unlock your experience'}
      </h1>

      {availableIntervals.length > 1 ? (
        <div className="inline-flex self-center gap-1 rounded-full bg-foreground/5 p-1 mx-auto">
          {availableIntervals.map((k) => {
            const active = interval === k
            return (
              <button
                key={k}
                type="button"
                onClick={() => handleIntervalChange(k)}
                className={cn(
                  'px-3 py-1 text-[11px] font-semibold rounded-full transition-all',
                  active
                    ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-sm'
                    : 'text-muted-foreground',
                )}
              >
                {PAYWALL_INTERVAL_LABEL[k]}
              </button>
            )
          })}
        </div>
      ) : null}

      {currentIntervalPlans.length > 1 ? (
        <label className="block">
          <span className="text-[10px] font-semibold text-foreground/70 uppercase tracking-wider">
            Choose your credit pack
          </span>
          <div className="mt-1 relative">
            <select
              value={planKey}
              onChange={(e) => setPlanKey(e.target.value)}
              className="w-full appearance-none rounded-xl border-2 border-border/60 bg-card/80 px-4 py-2.5 pr-9 text-sm font-semibold text-foreground focus:border-orange-400 focus:outline-none"
            >
              {currentIntervalPlans.map((p) => {
                const fallback = getLovifyPlanById(p.planKey)
                return (
                  <option key={p.planKey} value={p.planKey}>
                    {p.credits?.toLocaleString() ?? fallback?.credits.toLocaleString() ?? '?'}{' '}
                    credits — {formatPrice(p)}
                  </option>
                )
              })}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
        </label>
      ) : null}

      {selectedPlan ? (
        <div className="rounded-2xl border-2 border-orange-400 bg-orange-500/10 px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1">
              <p className="font-display font-bold text-foreground">{selectedPlan.label}</p>
              {selectedPlan.credits ? (
                <p className="mt-1 text-[13px] text-foreground/70 font-medium">
                  {selectedPlan.credits.toLocaleString()} credits
                  {selectedPlan.interval === 'year'
                    ? '/year'
                    : selectedPlan.interval === 'quarter'
                      ? '/3mo'
                      : selectedPlan.interval === 'month'
                        ? '/month'
                        : ''}
                </p>
              ) : null}
              {selectedPlan.trialDays > 0 ? (
                <p className="mt-1 text-[13px] text-orange-500 font-semibold">
                  {selectedPlan.trialDays}-day free trial · cancel anytime
                </p>
              ) : null}
            </div>
            <div className="text-right">
              <div className="text-xl font-extrabold text-foreground">
                ${(selectedPlan.amountCents / 100).toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <ul className="space-y-2">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-foreground">
            <Check className="w-4 h-4 mt-0.5 text-orange-500 flex-shrink-0" />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <PreviewButton>
        {selectedPlan?.trialDays ? 'Start my free trial' : 'Continue to payment'}
      </PreviewButton>
      {config.guarantee_copy ? (
        <p className="text-xs text-muted-foreground text-center">
          {config.guarantee_copy as string}
        </p>
      ) : null}
    </div>
  )
}

function formatPrice(p: PlanOption): string {
  const price = `$${(p.amountCents / 100).toFixed(2)}`
  if (p.interval === 'year') return `${price}/yr`
  if (p.interval === 'quarter') return `${price}/3mo`
  if (p.interval === 'month') return `${price}/mo`
  return price
}

function SuccessPreview({ config }: { config: Cfg }) {
  return (
    <>
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-rose-500 text-white shadow-[0_0_60px_hsl(15_85%_60%_/_0.4)]">
          <CheckCircle className="h-8 w-8" />
        </div>

        <h1 className="font-display text-2xl font-extrabold text-foreground leading-tight">
          {(config.headline as string) || "You're in."}
        </h1>

        {config.body_md ? (
          <p className="mt-3 max-w-sm text-muted-foreground leading-relaxed text-sm">
            {config.body_md as string}
          </p>
        ) : null}

        {config.show_set_password_cta !== false ? (
          <div className="mt-7 w-full max-w-xs rounded-2xl border border-orange-200/60 bg-orange-50/60 px-4 py-3">
            <div className="flex items-start gap-3 text-left">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
              <div>
                <p className="text-[13px] font-semibold text-foreground">
                  Check your email (you@example.com)
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
                  We&apos;ve sent you a link to set your password and log into the
                  app. It can take a minute or two to arrive.
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="pb-8 flex flex-col gap-2 sm:flex-row">
        <div className="flex-1 rounded-full border border-border bg-card px-5 py-2.5 text-center text-xs font-semibold text-foreground shadow-soft">
          Download on App Store
        </div>
        <div className="flex-1 rounded-full border border-border bg-card px-5 py-2.5 text-center text-xs font-semibold text-foreground shadow-soft">
          Get it on Google Play
        </div>
      </div>
    </>
  )
}

function UnknownPreview({ stepKey }: { stepKey: string }) {
  return (
    <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
      No preview available for “{stepKey}”.
    </div>
  )
}
