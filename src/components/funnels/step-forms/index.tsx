import { useEffect, type ReactElement } from 'react'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import type { QuizOption, StepType } from '@/types/funnels'
import { Field, OptionList, StringListInput } from './shared'
import { EmojiInput } from '../EmojiInput'

type Config = Record<string, unknown>

type FormProps = {
  value: Config
  onChange: (next: Config) => void
}

// Every form is a controlled component. The parent (StepEditor) holds the
// config in state and saves it when the user clicks Save.
//
// NOTE ON PROFILE COLUMNS — answers are landed on profiles.quiz_* columns
// by the Stripe webhook using a central step_key → column map
// (see stripe-webhook/index.ts). The admin no longer picks a column here:
// the standard step_keys (mindset, gender, age, goals, mood, monthly,
// notification_time, …) are projected automatically; anything else stays
// funnel-only.

function EmailCaptureForm({ value, onChange }: FormProps) {
  return (
    <>
      <Field label="Title">
        <Input
          value={(value.title as string) ?? ''}
          onChange={(e) => onChange({ ...value, title: e.target.value })}
          placeholder="Start your Lovify journey"
        />
      </Field>
      <Field label="Subtitle">
        <Input
          value={(value.subtitle as string) ?? ''}
          onChange={(e) => onChange({ ...value, subtitle: e.target.value })}
          placeholder="We'll send your account here."
        />
      </Field>
      <Field label="CTA label">
        <Input
          value={(value.cta_label as string) ?? ''}
          onChange={(e) => onChange({ ...value, cta_label: e.target.value })}
          placeholder="Continue"
        />
      </Field>
      <Field label="Consent copy (optional)">
        <Input
          value={(value.consent_copy as string) ?? ''}
          onChange={(e) => onChange({ ...value, consent_copy: e.target.value })}
          placeholder="By continuing you agree to our Terms."
        />
      </Field>
    </>
  )
}

function WelcomeForm({ value, onChange }: FormProps) {
  return (
    <>
      <Field label="Title">
        <Input
          value={(value.title as string) ?? ''}
          onChange={(e) => onChange({ ...value, title: e.target.value })}
        />
      </Field>
      <Field label="Subtitle">
        <Input
          value={(value.subtitle as string) ?? ''}
          onChange={(e) => onChange({ ...value, subtitle: e.target.value })}
        />
      </Field>
      <Field label="Body">
        <textarea
          value={(value.body_md as string) ?? ''}
          onChange={(e) => onChange({ ...value, body_md: e.target.value })}
          className="min-h-[80px] w-full rounded-lg border border-input bg-secondary px-3 py-2 text-sm"
        />
      </Field>
      <Field label="Hero emoji">
        <EmojiInput
          value={(value.hero_emoji as string) ?? ''}
          onChange={(next) => onChange({ ...value, hero_emoji: next })}
          placeholder="🎵"
          ariaLabel="Pick hero emoji"
        />
      </Field>
      <Field label="Character image URL (optional)" hint="Replaces the hero emoji if provided.">
        <Input
          value={(value.character_image_url as string) ?? ''}
          onChange={(e) => onChange({ ...value, character_image_url: e.target.value })}
          placeholder="https://…/character.png"
        />
      </Field>
      <Field label="CTA label">
        <Input
          value={(value.cta_label as string) ?? ''}
          onChange={(e) => onChange({ ...value, cta_label: e.target.value })}
          placeholder="Continue"
        />
      </Field>
    </>
  )
}

function NarrativeForm({ value, onChange }: FormProps) {
  type Bullet = { emoji?: string; text: string }
  const bullets: Bullet[] = Array.isArray(value.bullets)
    ? (value.bullets as Bullet[])
    : []
  const setBullets = (
    next: Bullet[] | ((prev: Bullet[]) => Bullet[]),
  ) =>
    onChange({
      ...value,
      bullets:
        typeof next === 'function' ? (next as (p: Bullet[]) => Bullet[])(bullets) : next,
    })

  const update = (i: number, patch: Partial<Bullet>) =>
    setBullets((curr) => curr.map((b, idx) => (idx === i ? { ...b, ...patch } : b)))
  const remove = (i: number) =>
    setBullets((curr) => curr.filter((_, idx) => idx !== i))
  const add = () => setBullets((curr) => [...curr, { text: '' }])

  return (
    <>
      <Field
        label="Title"
        hint="Supports {{answer.<step_key>}} tokens — e.g. switch to Lovify for {{answer.monthly}} minutes a day."
      >
        <Input
          value={(value.title as string) ?? ''}
          onChange={(e) => onChange({ ...value, title: e.target.value })}
        />
      </Field>
      <Field label="Subtitle">
        <Input
          value={(value.subtitle as string) ?? ''}
          onChange={(e) => onChange({ ...value, subtitle: e.target.value })}
        />
      </Field>
      <Field label="Character image URL (optional)">
        <Input
          value={(value.character_image_url as string) ?? ''}
          onChange={(e) => onChange({ ...value, character_image_url: e.target.value })}
          placeholder="https://…/character.png"
        />
      </Field>
      <Field label="Hero emoji (optional)">
        <EmojiInput
          value={(value.hero_emoji as string) ?? ''}
          onChange={(next) => onChange({ ...value, hero_emoji: next })}
          placeholder="✨"
          ariaLabel="Pick hero emoji"
        />
      </Field>
      <Field label="Bullets (optional)">
        <div className="space-y-2">
          {bullets.map((b, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-lg border border-border bg-card p-2"
            >
              <EmojiInput
                value={b.emoji ?? ''}
                onChange={(next) => update(i, { emoji: next })}
                ariaLabel={`Emoji for bullet ${i + 1}`}
              />
              <Input
                placeholder="Make your music journey tailored"
                value={b.text}
                onChange={(e) => update(i, { text: e.target.value })}
                className="flex-1"
              />
              <button
                type="button"
                onClick={() => remove(i)}
                className="rounded-md p-2 text-destructive hover:bg-destructive/10"
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={add}
            className="text-xs text-primary hover:underline"
          >
            + Add bullet
          </button>
        </div>
      </Field>
      <Field label="Footer note (optional)">
        <Input
          value={(value.footer_note as string) ?? ''}
          onChange={(e) => onChange({ ...value, footer_note: e.target.value })}
          placeholder="We won't share your data with third parties"
        />
      </Field>
      <Field label="CTA label">
        <Input
          value={(value.cta_label as string) ?? ''}
          onChange={(e) => onChange({ ...value, cta_label: e.target.value })}
          placeholder="Continue"
        />
      </Field>
    </>
  )
}

function QuizSingleForm({ value, onChange }: FormProps) {
  // Drive options directly from `value` — a local useState would
  // initialize once on mount and then leak stale options into the
  // parent when the dialog is reopened for a different preset.
  const options: QuizOption[] = Array.isArray(value.options)
    ? (value.options as QuizOption[])
    : []
  const setOptions = (next: QuizOption[] | ((prev: QuizOption[]) => QuizOption[])) =>
    onChange({
      ...value,
      options: typeof next === 'function' ? (next as (p: QuizOption[]) => QuizOption[])(options) : next,
    })

  return (
    <>
      <Field label="Title">
        <Input
          value={(value.title as string) ?? ''}
          onChange={(e) => onChange({ ...value, title: e.target.value })}
        />
      </Field>
      <Field label="Subtitle">
        <Input
          value={(value.subtitle as string) ?? ''}
          onChange={(e) => onChange({ ...value, subtitle: e.target.value })}
        />
      </Field>
      <Field label="Layout">
        <Select
          value={(value.layout as string) ?? 'vertical'}
          onChange={(e) => onChange({ ...value, layout: e.target.value })}
        >
          <option value="vertical">Vertical</option>
          <option value="horizontal">Horizontal</option>
        </Select>
      </Field>
      <Field label="Required">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={value.required !== false}
            onChange={(e) => onChange({ ...value, required: e.target.checked })}
          />
          Must answer to continue
        </label>
      </Field>
      <Field label="Options">
        <OptionList options={options} setOptions={setOptions} />
      </Field>
    </>
  )
}

function QuizMultiForm({ value, onChange }: FormProps) {
  const options: QuizOption[] = Array.isArray(value.options)
    ? (value.options as QuizOption[])
    : []
  const setOptions = (next: QuizOption[] | ((prev: QuizOption[]) => QuizOption[])) =>
    onChange({
      ...value,
      options: typeof next === 'function' ? (next as (p: QuizOption[]) => QuizOption[])(options) : next,
    })

  return (
    <>
      <Field label="Title">
        <Input
          value={(value.title as string) ?? ''}
          onChange={(e) => onChange({ ...value, title: e.target.value })}
        />
      </Field>
      <Field label="Subtitle">
        <Input
          value={(value.subtitle as string) ?? ''}
          onChange={(e) => onChange({ ...value, subtitle: e.target.value })}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Min selections">
          <Input
            type="number"
            value={(value.min as number) ?? 1}
            onChange={(e) => onChange({ ...value, min: Number(e.target.value) })}
          />
        </Field>
        <Field label="Max selections">
          <Input
            type="number"
            value={(value.max as number) ?? 5}
            onChange={(e) => onChange({ ...value, max: Number(e.target.value) })}
          />
        </Field>
      </div>
      <Field label="Options">
        <OptionList options={options} setOptions={setOptions} />
      </Field>
    </>
  )
}

function NumberPickerForm({ value, onChange }: FormProps) {
  return (
    <>
      <Field label="Title">
        <Input
          value={(value.title as string) ?? ''}
          onChange={(e) => onChange({ ...value, title: e.target.value })}
        />
      </Field>
      <Field label="Subtitle">
        <Input
          value={(value.subtitle as string) ?? ''}
          onChange={(e) => onChange({ ...value, subtitle: e.target.value })}
        />
      </Field>
      <div className="grid grid-cols-3 gap-2">
        <Field label="Min">
          <Input
            type="number"
            value={(value.min as number) ?? 0}
            onChange={(e) => onChange({ ...value, min: Number(e.target.value) })}
          />
        </Field>
        <Field label="Max">
          <Input
            type="number"
            value={(value.max as number) ?? 100}
            onChange={(e) => onChange({ ...value, max: Number(e.target.value) })}
          />
        </Field>
        <Field label="Step">
          <Input
            type="number"
            value={(value.step as number) ?? 1}
            onChange={(e) => onChange({ ...value, step: Number(e.target.value) })}
          />
        </Field>
      </div>
      <Field label="Default">
        <Input
          type="number"
          value={(value.default as number) ?? 0}
          onChange={(e) => onChange({ ...value, default: Number(e.target.value) })}
        />
      </Field>
      <Field label="Unit label">
        <Input
          value={(value.unit_label as string) ?? ''}
          onChange={(e) => onChange({ ...value, unit_label: e.target.value })}
          placeholder="minutes"
        />
      </Field>
    </>
  )
}

function TimePickerForm({ value, onChange }: FormProps) {
  return (
    <>
      <Field label="Title">
        <Input
          value={(value.title as string) ?? ''}
          onChange={(e) => onChange({ ...value, title: e.target.value })}
          placeholder="21 days is a great start to building healthy habits"
        />
      </Field>
      <Field label="Subtitle">
        <Input
          value={(value.subtitle as string) ?? ''}
          onChange={(e) => onChange({ ...value, subtitle: e.target.value })}
          placeholder="Notifications will help you stay on track"
        />
      </Field>
      <div className="grid grid-cols-3 gap-2">
        <Field label="Default hour (1-12)">
          <Input
            type="number"
            min={1}
            max={12}
            value={(value.default_hour as number) ?? 9}
            onChange={(e) => onChange({ ...value, default_hour: Number(e.target.value) })}
          />
        </Field>
        <Field label="Default minute (0-59)">
          <Input
            type="number"
            min={0}
            max={59}
            value={(value.default_minute as number) ?? 0}
            onChange={(e) => onChange({ ...value, default_minute: Number(e.target.value) })}
          />
        </Field>
        <Field label="Default period">
          <Select
            value={(value.default_period as string) ?? 'AM'}
            onChange={(e) => onChange({ ...value, default_period: e.target.value })}
          >
            <option value="AM">AM</option>
            <option value="PM">PM</option>
          </Select>
        </Field>
      </div>
      <Field label="Minute step" hint="How far minutes snap on the wheel (5, 10, 15).">
        <Input
          type="number"
          min={1}
          max={30}
          value={(value.minute_step as number) ?? 5}
          onChange={(e) => onChange({ ...value, minute_step: Number(e.target.value) })}
        />
      </Field>
      <Field label="CTA label">
        <Input
          value={(value.cta_label as string) ?? ''}
          onChange={(e) => onChange({ ...value, cta_label: e.target.value })}
          placeholder="Continue"
        />
      </Field>
    </>
  )
}

function StatementForm({ value, onChange }: FormProps) {
  return (
    <>
      <Field label="Title" hint="The question above the quote, e.g. Do you relate to the statement?">
        <Input
          value={(value.title as string) ?? ''}
          onChange={(e) => onChange({ ...value, title: e.target.value })}
        />
      </Field>
      <Field label="Statement">
        <textarea
          value={(value.statement as string) ?? ''}
          onChange={(e) => onChange({ ...value, statement: e.target.value })}
          className="min-h-[80px] w-full rounded-lg border border-input bg-secondary px-3 py-2 text-sm"
          placeholder="I enjoy music, but it's hard for me to make my own"
        />
      </Field>
      <Field label="Required">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={value.required !== false}
            onChange={(e) => onChange({ ...value, required: e.target.checked })}
          />
          Must answer to continue
        </label>
      </Field>
    </>
  )
}

function GenrePickerForm({ value, onChange }: FormProps) {
  const genres: QuizOption[] = Array.isArray(value.genres)
    ? (value.genres as QuizOption[])
    : []
  const setGenres = (next: QuizOption[] | ((prev: QuizOption[]) => QuizOption[])) =>
    onChange({
      ...value,
      genres:
        typeof next === 'function' ? (next as (p: QuizOption[]) => QuizOption[])(genres) : next,
    })

  return (
    <>
      <Field label="Title">
        <Input
          value={(value.title as string) ?? ''}
          onChange={(e) => onChange({ ...value, title: e.target.value })}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Min">
          <Input
            type="number"
            value={(value.min as number) ?? 1}
            onChange={(e) => onChange({ ...value, min: Number(e.target.value) })}
          />
        </Field>
        <Field label="Max">
          <Input
            type="number"
            value={(value.max as number) ?? 5}
            onChange={(e) => onChange({ ...value, max: Number(e.target.value) })}
          />
        </Field>
      </div>
      <Field label="Genres">
        <OptionList options={genres} setOptions={setGenres} />
      </Field>
    </>
  )
}

function CraftingForm({ value, onChange }: FormProps) {
  const messages: string[] = Array.isArray(value.messages)
    ? (value.messages as string[])
    : []
  const setMessages = (next: string[] | ((prev: string[]) => string[])) =>
    onChange({
      ...value,
      messages:
        typeof next === 'function' ? (next as (p: string[]) => string[])(messages) : next,
    })

  return (
    <>
      <Field label="Title">
        <Input
          value={(value.title as string) ?? ''}
          onChange={(e) => onChange({ ...value, title: e.target.value })}
        />
      </Field>
      <Field label="Duration (ms)">
        <Input
          type="number"
          value={(value.duration_ms as number) ?? 4000}
          onChange={(e) => onChange({ ...value, duration_ms: Number(e.target.value) })}
        />
      </Field>
      <Field label="Messages (shown in sequence)">
        <StringListInput
          values={messages}
          setValues={setMessages}
          placeholder="Analyzing your story…"
        />
      </Field>
    </>
  )
}

function PaywallForm({ value, onChange }: FormProps) {
  // plan_keys and default_plan_key are funnel-level now (see Plans tab).
  // We clear any legacy per-step values on first render so the step's
  // paywall shows every enabled plan instead of an old allowlist subset.
  const features: string[] = Array.isArray(value.features)
    ? (value.features as string[])
    : []
  const setFeatures = (next: string[] | ((prev: string[]) => string[])) => {
    const nextFeatures =
      typeof next === 'function' ? (next as (p: string[]) => string[])(features) : next
    const merged: Record<string, unknown> = { ...value, features: nextFeatures }
    if ('plan_keys' in merged) delete merged.plan_keys
    if ('default_plan_key' in merged) delete merged.default_plan_key
    onChange(merged)
  }
  // One-shot cleanup of legacy step-level plan keys carried over from
  // older funnels — the Plans tab is the source of truth now.
  useEffect(() => {
    if ('plan_keys' in value || 'default_plan_key' in value) {
      const cleaned: Record<string, unknown> = { ...value }
      delete cleaned.plan_keys
      delete cleaned.default_plan_key
      onChange(cleaned)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <Field label="Title">
        <Input
          value={(value.title as string) ?? ''}
          onChange={(e) => onChange({ ...value, title: e.target.value })}
        />
      </Field>
      <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
        <p className="font-semibold text-foreground">Plans are funnel-level now.</p>
        <p className="mt-1">
          The paywall will show every plan you enabled on the <strong>Plans</strong> tab, with
          interval tabs + credit-tier dropdown. Default interval and default plan come from the
          Plans tab too.
        </p>
      </div>
      <Field label="Features bullet list">
        <StringListInput
          values={features}
          setValues={setFeatures}
          placeholder="7-day free trial"
        />
      </Field>
      <Field label="Guarantee copy">
        <Input
          value={(value.guarantee_copy as string) ?? ''}
          onChange={(e) => onChange({ ...value, guarantee_copy: e.target.value })}
          placeholder="Cancel anytime during trial."
        />
      </Field>
    </>
  )
}

function SuccessForm({ value, onChange }: FormProps) {
  return (
    <>
      <Field label="Title">
        <Input
          value={(value.title as string) ?? ''}
          onChange={(e) => onChange({ ...value, title: e.target.value })}
        />
      </Field>
      <Field label="Headline">
        <Input
          value={(value.headline as string) ?? ''}
          onChange={(e) => onChange({ ...value, headline: e.target.value })}
        />
      </Field>
      <Field label="Body">
        <textarea
          value={(value.body_md as string) ?? ''}
          onChange={(e) => onChange({ ...value, body_md: e.target.value })}
          className="min-h-[60px] w-full rounded-lg border border-input bg-secondary px-3 py-2 text-sm"
        />
      </Field>
      <Field label="App Store URL">
        <Input
          value={(value.app_store_url as string) ?? ''}
          onChange={(e) => onChange({ ...value, app_store_url: e.target.value })}
        />
      </Field>
      <Field label="Play Store URL">
        <Input
          value={(value.play_store_url as string) ?? ''}
          onChange={(e) => onChange({ ...value, play_store_url: e.target.value })}
        />
      </Field>
      <Field label="Show 'Set password' CTA">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={value.show_set_password_cta !== false}
            onChange={(e) => onChange({ ...value, show_set_password_cta: e.target.checked })}
          />
          Display a CTA that links users to the password-set page
        </label>
      </Field>
    </>
  )
}

export const STEP_FORMS: Record<StepType, (props: FormProps) => ReactElement> = {
  'email-capture': EmailCaptureForm,
  welcome: WelcomeForm,
  narrative: NarrativeForm,
  'quiz-single': QuizSingleForm,
  'quiz-multi': QuizMultiForm,
  'number-picker': NumberPickerForm,
  'time-picker': TimePickerForm,
  statement: StatementForm,
  'genre-picker': GenrePickerForm,
  crafting: CraftingForm,
  paywall: PaywallForm,
  success: SuccessForm,
}

export function defaultConfigFor(type: StepType): Config {
  switch (type) {
    case 'email-capture':
      return { title: 'Start here', subtitle: "We'll send your account here.", cta_label: 'Continue' }
    case 'welcome':
      return { title: 'Welcome', body_md: '', cta_label: 'Continue' }
    case 'narrative':
      return {
        title: "Let's make this adventure about you",
        subtitle: '',
        bullets: [],
        cta_label: 'Continue',
      }
    case 'quiz-single':
      return {
        title: 'Quiz question',
        required: true,
        layout: 'vertical',
        options: [{ value: 'a', label: 'Option A' }, { value: 'b', label: 'Option B' }],
      }
    case 'quiz-multi':
      return {
        title: 'Quiz question',
        min: 1,
        max: 3,
        options: [{ value: 'a', label: 'Option A' }],
      }
    case 'number-picker':
      return { title: 'Pick a number', min: 0, max: 10, default: 5, step: 1, unit_label: '' }
    case 'time-picker':
      return {
        title: '21 days is a great start to building healthy habits',
        subtitle: 'Notifications will help you stay on track',
        default_hour: 9,
        default_minute: 0,
        default_period: 'AM',
        minute_step: 5,
        cta_label: 'Continue',
      }
    case 'statement':
      return {
        title: 'Do you relate to the statement?',
        statement: "I enjoy music, but it's hard for me to make my own",
        required: true,
      }
    case 'genre-picker':
      return { title: 'Pick genres', min: 1, max: 5, genres: [] }
    case 'crafting':
      return { title: 'Crafting your experience…', duration_ms: 5000, messages: ['Loading…'] }
    case 'paywall':
      return { title: 'Upgrade', features: [] }
    case 'success':
      return {
        title: 'Done',
        headline: "You're in.",
        body_md: 'Check your email to set your password.',
        app_store_url: '',
        play_store_url: '',
        show_set_password_cta: true,
      }
  }
}
