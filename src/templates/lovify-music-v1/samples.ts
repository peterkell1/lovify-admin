import type { TemplateSample } from '@/templates/types'

// Hand-picked configs the gallery + preview dialog use to demonstrate
// what this template renders. Don't tie these to any one funnel —
// they should look reasonable for any music-onboarding funnel a
// marketer might build on top of v1.
export const LOVIFY_MUSIC_V1_SAMPLES: TemplateSample[] = [
  {
    label: 'Welcome',
    stepType: 'welcome',
    stepKey: 'welcome',
    config: {
      title: 'Lovify',
      subtitle: 'Music that moves with your mood',
      cta_label: 'Get started',
      hero_emoji: '🎵',
    },
  },
  {
    label: 'Quiz',
    stepType: 'quiz-single',
    stepKey: 'mindset',
    config: {
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
    label: 'Narrative',
    stepType: 'narrative',
    stepKey: 'narrative',
    config: {
      title: "You're already listening — switch to Lovify",
      subtitle: 'Personalized to how you feel, not what you searched.',
      cta_label: 'Continue',
      hero_emoji: '🌅',
    },
  },
  {
    label: 'Paywall',
    stepType: 'paywall',
    stepKey: 'paywall',
    config: {
      title: 'Start your 7-day free trial',
      features: [
        '7-day free trial (1,000 trial credits)',
        '8,999 credits/year',
        'Cancel anytime during trial',
      ],
      guarantee_copy: 'Cancel anytime during trial.',
    },
    // Realistic plan catalog so the paywall preview shows the interval
    // tabs + credit-tier dropdown + selected-plan summary card, instead
    // of the empty "no plans enabled" fallback. Pulled from the
    // production lovify-plans catalog so the prices match what
    // marketers actually sell.
    funnelDefaults: {
      planOptions: [
        {
          planKey: 'yearly_premium_trial',
          stripePriceId: 'price_1TMNStEtyqLO7bbyJnIDUlH9',
          label: 'Annual Premium + 7-day free trial',
          trialDays: 7,
          amountCents: 8999,
          credits: 8999,
          interval: 'year',
        },
        {
          planKey: 'annual_9000',
          stripePriceId: 'price_1TMNStEtyqLO7bbyJnIDUlH9',
          label: '9,000 credits/year',
          trialDays: 0,
          amountCents: 8999,
          credits: 9000,
          interval: 'year',
        },
        {
          planKey: 'monthly_1500',
          stripePriceId: 'price_monthly_1500',
          label: '1,500 credits/month',
          trialDays: 0,
          amountCents: 1499,
          credits: 1500,
          interval: 'month',
        },
        {
          planKey: 'monthly_3000',
          stripePriceId: 'price_monthly_3000',
          label: '3,000 credits/month',
          trialDays: 0,
          amountCents: 2899,
          credits: 3000,
          interval: 'month',
        },
      ],
      defaultPlanKey: 'yearly_premium_trial',
      defaultInterval: 'trial',
    },
  },
  {
    label: 'Success',
    stepType: 'success',
    stepKey: 'success',
    config: {
      title: 'Done',
      headline: "You're in.",
      body_md: 'Check your email to set your password, then download the app.',
      show_set_password_cta: true,
    },
  },
]
