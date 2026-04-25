import type { TemplateSample } from '@/templates/types'

// Hand-picked samples for the gallery card + preview dialog.
//
// Voice and content match the production Lovify Music funnel:
//   - mindset / goals / mood / daily-listening-minutes quiz copy
//   - Crafting-your-experience loader
//   - 7-day trial + credit-tier paywall
// so a marketer skimming the gallery sees how their actual funnel
// content will look on this template, not generic stand-ins.
export const LOVIFY_TEMPLATE_2_SAMPLES: TemplateSample[] = [
  {
    label: 'Welcome',
    stepType: 'welcome',
    stepKey: 'welcome',
    config: {
      title: 'Music that moves with your mood',
      subtitle: 'Take the 1-minute quiz',
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
    label: 'Multi',
    stepType: 'quiz-multi',
    stepKey: 'goals',
    config: {
      title: 'What are your goals?',
      subtitle:
        'Choose up to 5 goals. You can always change them later.',
      min: 1,
      max: 5,
      cta_label: 'Next step',
      options: [
        { value: 'love', label: 'Attract love into my life', emoji: '💖' },
        { value: 'career', label: 'Find my dream career', emoji: '🎯' },
        { value: 'confidence', label: 'Become more confident', emoji: '🔥' },
        { value: 'stress', label: 'Release stress and anxiety', emoji: '🕊' },
        { value: 'wealth', label: 'Build real wealth', emoji: '💰' },
        { value: 'health', label: 'Improve my health and fitness', emoji: '💪' },
      ],
    },
  },
  {
    label: 'Statement',
    stepType: 'statement',
    stepKey: 'music_helps',
    config: {
      title: 'Music helps me feel more like myself',
      statement: 'How much do you agree?',
      scale: { max: 5, min_label: 'Strongly disagree', max_label: 'Strongly agree' },
      required: true,
    },
  },
  {
    label: 'Loader',
    stepType: 'crafting',
    stepKey: 'crafting',
    config: {
      title: 'Crafting your experience…',
      duration_ms: 5000,
      messages: [
        'Analyzing your answers',
        'Matching you with the right plan',
        'Personalizing your recommendations',
        'Finalizing your experience',
      ],
    },
  },
  {
    label: 'Paywall',
    stepType: 'paywall',
    stepKey: 'paywall',
    config: {
      title: 'Start your 7-day free trial',
      subtitle: 'Pick the plan that fits.',
      features: [
        '7-day free trial (1,000 trial credits)',
        '8,999 credits/year',
        'Cancel anytime during trial',
      ],
      guarantee_copy: 'Cancel anytime during trial.',
    },
    // Realistic Lovify plan catalog so the 3-up cards + ribbon render
    // honestly. Mirrors the production lovify-plans pricing.
    funnelDefaults: {
      planOptions: [
        {
          planKey: 'yearly_premium_trial',
          stripePriceId: 'price_demo_trial',
          label: 'Annual + 7-day trial',
          trialDays: 7,
          amountCents: 8999,
          credits: 8999,
          interval: 'year',
        },
        {
          planKey: 'monthly_1500',
          stripePriceId: 'price_demo_monthly',
          label: '1,500 credits/month',
          trialDays: 0,
          amountCents: 1499,
          credits: 1500,
          interval: 'month',
        },
        {
          planKey: 'annual_9000',
          stripePriceId: 'price_demo_annual',
          label: '9,000 credits/year',
          trialDays: 0,
          amountCents: 8999,
          credits: 9000,
          interval: 'year',
        },
      ],
      defaultPlanKey: 'yearly_premium_trial',
      mostPopularPlanKey: 'yearly_premium_trial',
      defaultInterval: 'trial',
    },
  },
  {
    label: 'Success',
    stepType: 'success',
    stepKey: 'success',
    config: {
      title: 'Welcome to Lovify',
      headline: "You're in.",
      body_md: 'Check your email to set your password, then download the app.',
      show_set_password_cta: true,
    },
  },
]
