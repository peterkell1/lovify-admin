export type FunnelStatus = 'draft' | 'live' | 'paused' | 'archived'

export type StepType =
  | 'email-capture'
  | 'welcome'
  | 'quiz-single'
  | 'quiz-multi'
  | 'number-picker'
  | 'genre-picker'
  | 'crafting'
  | 'paywall'
  | 'success'

export const STEP_TYPES: StepType[] = [
  'email-capture',
  'welcome',
  'quiz-single',
  'quiz-multi',
  'number-picker',
  'genre-picker',
  'crafting',
  'paywall',
  'success',
]

export const STEP_TYPE_LABEL: Record<StepType, string> = {
  'email-capture': 'Email capture',
  welcome: 'Welcome',
  'quiz-single': 'Quiz — single select',
  'quiz-multi': 'Quiz — multi select',
  'number-picker': 'Number picker',
  'genre-picker': 'Genre picker',
  crafting: 'Crafting loader',
  paywall: 'Paywall',
  success: 'Success',
}

export type QuizOption = { value: string; label: string; emoji?: string }

export type PlanOption = {
  planKey: string
  stripePriceId: string
  label: string
  trialDays: number
  amountCents: number
}

export type Funnel = {
  id: string
  slug: string
  name: string
  description: string | null
  status: FunnelStatus
  template: string | null
  theme: Record<string, unknown>
  meta_pixel_id: string | null
  default_plan_key: string | null
  plan_options: PlanOption[]
  created_by: string | null
  created_at: string
  updated_at: string
  published_at: string | null
}

export type FunnelStep = {
  id: string
  funnel_id: string
  step_key: string
  step_type: StepType
  position: number
  config: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type FunnelAnalyticsRow = {
  step_key: string
  step_type: StepType
  position: number
  reached: number
}
