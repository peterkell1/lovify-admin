import type { StepType } from '@/types/funnels'

// ─────────────────────────────────────────────────────────────────────
// Step presets — marketer-facing catalog.
//
// Marketers don't see raw step_types or step_keys anymore. They pick a
// named preset ("Mindset question", "Welcome screen", "Custom multi-
// select") and we materialise the right step_type + step_key + initial
// config behind the scenes.
//
// Magic presets have a locked step_key that the Stripe webhook knows
// about (mindset → profiles.quiz_mindset_key, etc.). Custom presets
// generate a key from the title so marketers never type one.
// ─────────────────────────────────────────────────────────────────────

export type StepPresetGroup =
  | 'standard-quiz'
  | 'content'
  | 'system'
  | 'custom'

export type StepPreset = {
  id: string
  label: string
  description?: string
  group: StepPresetGroup
  stepType: StepType
  /**
   * Fixed step_key. If set, this preset uses that key verbatim and can
   * only be added once per funnel (enforced by the editor).
   * If omitted, the key is auto-generated from the title / type.
   */
  fixedKey?: string
  /**
   * Patch applied on top of defaultConfigFor(stepType) when the preset
   * is picked. Lets each preset ship with sensible copy + layout.
   */
  configPatch?: Record<string, unknown>
}

export const STEP_PRESET_GROUP_LABEL: Record<StepPresetGroup, string> = {
  'standard-quiz': 'Standard quiz (lands on user profile)',
  content: 'Content & interstitials',
  system: 'System steps',
  custom: 'Advanced / custom',
}

// Order matters — controls the dropdown order within each group.
export const STEP_PRESETS: StepPreset[] = [
  // ─── Standard quiz presets — keys match the webhook's profile map ───
  {
    id: 'mindset',
    label: 'Mindset question',
    description: 'Single-select. Lands on profiles.quiz_mindset_key.',
    group: 'standard-quiz',
    stepType: 'quiz-single',
    fixedKey: 'mindset',
    configPatch: {
      title: 'What do you believe is key to creating a life you love?',
      subtitle: '',
      layout: 'vertical',
      required: true,
      options: [
        { value: 'clear_dreams', label: 'Clear on my dreams', emoji: '✨' },
        { value: 'believe_self', label: 'Believe in myself', emoji: '💪' },
        { value: 'great_attitude', label: 'Great attitude', emoji: '☀️' },
      ],
    },
  },
  {
    id: 'gender',
    label: 'Gender question',
    description: 'Single-select, horizontal layout. Lands on profiles.quiz_gender.',
    group: 'standard-quiz',
    stepType: 'quiz-single',
    fixedKey: 'gender',
    configPatch: {
      title: 'Select your gender',
      subtitle: '',
      layout: 'horizontal',
      required: false,
      options: [
        { value: 'female', label: 'Female', image_asset_key: 'general/woman.svg' },
        { value: 'male', label: 'Male', image_asset_key: 'general/man.svg' },
        { value: 'other', label: 'Other', image_asset_key: 'general/other.jpg' },
      ],
    },
  },
  {
    id: 'age',
    label: 'Age range',
    description: 'Single-select. Lands on profiles.quiz_age_range.',
    group: 'standard-quiz',
    stepType: 'quiz-single',
    fixedKey: 'age',
    configPatch: {
      title: 'What is your age?',
      subtitle: '',
      layout: 'vertical',
      required: true,
      options: [
        { value: '18-24', label: '18–24' },
        { value: '25-34', label: '25–34' },
        { value: '35-44', label: '35–44' },
        { value: '45-54', label: '45–54' },
        { value: '55+', label: '55+' },
      ],
    },
  },
  {
    id: 'goals',
    label: 'Goals picker',
    description: 'Multi-select. Lands on profiles.quiz_goals.',
    group: 'standard-quiz',
    stepType: 'quiz-multi',
    fixedKey: 'goals',
    configPatch: {
      title: 'What are your goals?',
      subtitle: 'Choose up to 5 goals. You can always change goals when they become irrelevant.',
      min: 1,
      max: 5,
      options: [
        { value: 'love', label: 'Attract love into my life', emoji: '💖' },
        { value: 'career', label: 'Find my dream career', emoji: '🎯' },
        { value: 'confidence', label: 'Become more confident', emoji: '🔥' },
        { value: 'stress', label: 'Release stress & anxiety', emoji: '🕊' },
        { value: 'wealth', label: 'Build real wealth', emoji: '💰' },
        { value: 'health', label: 'Improve my health & fitness', emoji: '💪' },
      ],
    },
  },
  {
    id: 'mood',
    label: 'Mood boosters picker',
    description: 'Multi-select. Lands on profiles.quiz_mood_boosters.',
    group: 'standard-quiz',
    stepType: 'quiz-multi',
    fixedKey: 'mood',
    configPatch: {
      title: 'What puts you in the best mood?',
      min: 1,
      max: 5,
      options: [
        { value: 'music', label: 'Listening to music', emoji: '🎵' },
        { value: 'nature', label: 'Being in nature', emoji: '🌿' },
        { value: 'exercise', label: 'Exercising', emoji: '🏃' },
        { value: 'friends', label: 'Time with friends', emoji: '👯' },
      ],
    },
  },
  {
    id: 'monthly',
    label: 'Monthly listening goal',
    description: 'Number picker. Lands on profiles.monthly_goal.',
    group: 'standard-quiz',
    stepType: 'number-picker',
    fixedKey: 'monthly',
    configPatch: {
      title: 'How many minutes will you listen daily?',
      min: 5,
      max: 60,
      step: 5,
      default: 20,
      unit_label: 'minutes',
    },
  },
  {
    id: 'notification_time',
    label: 'Notification time',
    description: 'Time picker. Lands on profiles.notification_time.',
    group: 'standard-quiz',
    stepType: 'time-picker',
    fixedKey: 'notification_time',
    configPatch: {
      title: '21 days is a great start to building healthy habits',
      subtitle: 'Notifications will help you stay on track and push you to achieve your goals',
      default_hour: 9,
      default_minute: 0,
      default_period: 'AM',
      minute_step: 5,
    },
  },

  // ─── Content & interstitials ──────────────────────────────────────
  {
    id: 'email',
    label: 'Email capture',
    description: 'Lead-in. Lands the visitor on funnel_sessions.',
    group: 'content',
    stepType: 'email-capture',
    fixedKey: 'email',
    configPatch: {
      title: 'Start your Lovify journey',
      subtitle: "We'll send your account here.",
      cta_label: 'Continue',
    },
  },
  {
    id: 'welcome',
    label: 'Welcome screen',
    description: 'Character + headline + CTA. Only one per funnel.',
    group: 'content',
    stepType: 'welcome',
    fixedKey: 'welcome',
  },
  {
    id: 'narrative',
    label: 'Narrative / reassurance',
    description: 'Echo prior answers via {{answer.<step_key>}}. Key auto-generated.',
    group: 'content',
    stepType: 'narrative',
  },
  {
    id: 'statement',
    label: 'Statement (Yes/No)',
    description: 'Quote card + Yes/No. Key auto-generated.',
    group: 'content',
    stepType: 'statement',
  },
  {
    id: 'genres',
    label: 'Genre picker',
    description: 'Pill grid of music genres.',
    group: 'content',
    stepType: 'genre-picker',
    fixedKey: 'genres',
    configPatch: {
      title: "Pick the genres you listen to when you're the happiest",
      min: 1,
      max: 5,
      genres: [
        { value: 'pop', label: 'Pop', emoji: '🎤' },
        { value: 'hiphop', label: 'Hip Hop', emoji: '🎧' },
        { value: 'rnb', label: 'R&B', emoji: '🎵' },
        { value: 'rock', label: 'Rock', emoji: '🎸' },
        { value: 'electronic', label: 'Electronic', emoji: '🎹' },
        { value: 'country', label: 'Country', emoji: '🤠' },
      ],
    },
  },
  {
    id: 'crafting',
    label: 'Crafting loader',
    description: 'Fake 5s loader between quiz and paywall.',
    group: 'content',
    stepType: 'crafting',
    fixedKey: 'crafting',
    configPatch: {
      title: 'Crafting your experience…',
      duration_ms: 5000,
      messages: [
        'Analyzing your answers…',
        'Matching you with the right plan…',
        'Personalizing your recommendations…',
        'Finalizing your experience…',
      ],
    },
  },

  // ─── System (one per funnel) ───────────────────────────────────────
  {
    id: 'paywall',
    label: 'Paywall',
    description: 'Subscription picker. Only one per funnel.',
    group: 'system',
    stepType: 'paywall',
    fixedKey: 'paywall',
    configPatch: {
      title: 'Start your 7-day free trial',
      features: [
        '7-day free trial (1,000 trial credits)',
        '8,999 credits/year',
        'Cancel anytime during trial',
      ],
      guarantee_copy: 'Cancel anytime during trial.',
    },
  },
  {
    id: 'success',
    label: 'Success page',
    description: 'Post-purchase confirmation. Only one per funnel.',
    group: 'system',
    stepType: 'success',
    fixedKey: 'success',
    configPatch: {
      title: 'Done',
      headline: "You're in.",
      body_md: 'Check your email to set your password, then download the app.',
      show_set_password_cta: true,
    },
  },

  // ─── Custom (marketer's own) ───────────────────────────────────────
  {
    id: 'custom-single',
    label: 'Custom single-select',
    description: 'Your own quiz question. Answer stays in the funnel.',
    group: 'custom',
    stepType: 'quiz-single',
  },
  {
    id: 'custom-multi',
    label: 'Custom multi-select',
    description: 'Multi-choice question. Answer stays in the funnel.',
    group: 'custom',
    stepType: 'quiz-multi',
  },
  {
    id: 'custom-number',
    label: 'Custom number picker',
    description: 'Scroll-wheel numeric input.',
    group: 'custom',
    stepType: 'number-picker',
  },
  {
    id: 'custom-narrative',
    label: 'Custom narrative',
    description: 'Free-form interstitial with optional bullets.',
    group: 'custom',
    stepType: 'narrative',
  },
]

export function findPreset(id: string): StepPreset | undefined {
  return STEP_PRESETS.find((p) => p.id === id)
}

// Derive a url-safe key from a title. Used for custom presets so the
// marketer only ever sees the title — the step_key is a side-effect.
export function slugifyStepKey(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Pick a key for a custom preset. If the title slugifies to something
// non-empty and unique, use it. Otherwise fall back to `<type>-<N>`.
export function generateStepKey(
  preset: StepPreset,
  title: string,
  existingKeys: string[],
): string {
  if (preset.fixedKey) return preset.fixedKey
  const fromTitle = slugifyStepKey(title)
  const existing = new Set(existingKeys)
  if (fromTitle && !existing.has(fromTitle)) return fromTitle

  // Fall back: type-N, find the smallest N that doesn't collide.
  const base = preset.stepType
  for (let n = 1; n < 1000; n++) {
    const candidate = `${base}-${n}`
    if (!existing.has(candidate)) return candidate
  }
  // Shouldn't ever happen, but return a random suffix so we never block save.
  return `${base}-${Math.random().toString(36).slice(2, 7)}`
}
