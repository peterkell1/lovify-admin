import { useState, useEffect, type ReactElement } from 'react'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import type { QuizOption, StepType } from '@/types/funnels'
import { Field, OptionList, StringListInput } from './shared'

type Config = Record<string, unknown>

type FormProps = {
  value: Config
  onChange: (next: Config) => void
}

// Every form is a controlled component. The parent (StepEditor) holds the
// config in state and saves it when the user clicks Save.

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
        <Input
          value={(value.hero_emoji as string) ?? ''}
          onChange={(e) => onChange({ ...value, hero_emoji: e.target.value })}
          placeholder="🎵"
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

const SINGLE_PROFILE_COLUMNS = ['', 'quiz_mindset_key', 'quiz_gender', 'quiz_age_range'] as const
const MULTI_PROFILE_COLUMNS = ['', 'quiz_goals', 'quiz_mood_boosters'] as const

function QuizSingleForm({ value, onChange }: FormProps) {
  const [options, setOptions] = useState<QuizOption[]>(
    Array.isArray(value.options) ? (value.options as QuizOption[]) : [],
  )
  useEffect(() => {
    onChange({ ...value, options })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options])

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
      <Field label="Profile column" hint="Quiz answer writes to this profiles column at purchase time.">
        <Select
          value={(value.profile_column as string) ?? ''}
          onChange={(e) =>
            onChange({ ...value, profile_column: e.target.value || null })
          }
        >
          {SINGLE_PROFILE_COLUMNS.map((c) => (
            <option key={c || 'none'} value={c}>
              {c || '— (none)'}
            </option>
          ))}
        </Select>
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
  const [options, setOptions] = useState<QuizOption[]>(
    Array.isArray(value.options) ? (value.options as QuizOption[]) : [],
  )
  useEffect(() => {
    onChange({ ...value, options })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options])

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
      <Field label="Profile column">
        <Select
          value={(value.profile_column as string) ?? ''}
          onChange={(e) =>
            onChange({ ...value, profile_column: e.target.value || null })
          }
        >
          {MULTI_PROFILE_COLUMNS.map((c) => (
            <option key={c || 'none'} value={c}>
              {c || '— (none)'}
            </option>
          ))}
        </Select>
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
      <Field label="Profile column (optional)">
        <Input
          value={(value.profile_column as string) ?? ''}
          onChange={(e) =>
            onChange({ ...value, profile_column: e.target.value || undefined })
          }
          placeholder="monthly_goal"
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

function GenrePickerForm({ value, onChange }: FormProps) {
  const [genres, setGenres] = useState<QuizOption[]>(
    Array.isArray(value.genres) ? (value.genres as QuizOption[]) : [],
  )
  useEffect(() => {
    onChange({ ...value, genres })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [genres])

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
  const [messages, setMessages] = useState<string[]>(
    Array.isArray(value.messages) ? (value.messages as string[]) : [],
  )
  useEffect(() => {
    onChange({ ...value, messages })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages])

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
  const [planKeys, setPlanKeys] = useState<string[]>(
    Array.isArray(value.plan_keys) ? (value.plan_keys as string[]) : [],
  )
  const [features, setFeatures] = useState<string[]>(
    Array.isArray(value.features) ? (value.features as string[]) : [],
  )
  useEffect(() => {
    onChange({ ...value, plan_keys: planKeys, features })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planKeys, features])

  return (
    <>
      <Field label="Title">
        <Input
          value={(value.title as string) ?? ''}
          onChange={(e) => onChange({ ...value, title: e.target.value })}
        />
      </Field>
      <Field label="Plan keys shown on paywall" hint="Keys must exist in the funnel's Plans section.">
        <StringListInput values={planKeys} setValues={setPlanKeys} placeholder="yearly_premium_trial" />
      </Field>
      <Field label="Default plan key">
        <Input
          value={(value.default_plan_key as string) ?? ''}
          onChange={(e) => onChange({ ...value, default_plan_key: e.target.value })}
          placeholder="yearly_premium_trial"
        />
      </Field>
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
  'quiz-single': QuizSingleForm,
  'quiz-multi': QuizMultiForm,
  'number-picker': NumberPickerForm,
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
    case 'quiz-single':
      return {
        title: 'Quiz question',
        profile_column: null,
        required: true,
        layout: 'vertical',
        options: [{ value: 'a', label: 'Option A' }, { value: 'b', label: 'Option B' }],
      }
    case 'quiz-multi':
      return {
        title: 'Quiz question',
        profile_column: null,
        min: 1,
        max: 3,
        options: [{ value: 'a', label: 'Option A' }],
      }
    case 'number-picker':
      return { title: 'Pick a number', min: 0, max: 10, default: 5, step: 1, unit_label: '' }
    case 'genre-picker':
      return { title: 'Pick genres', min: 1, max: 5, genres: [] }
    case 'crafting':
      return { title: 'Crafting your experience…', duration_ms: 5000, messages: ['Loading…'] }
    case 'paywall':
      return { title: 'Upgrade', plan_keys: [], default_plan_key: '', features: [] }
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
