// Lovify plan catalog (mirrored from lovifymusic/src/lib/pricing.ts).
//
// Marketers pick plans from this catalog on the funnel Plans tab — they
// never touch Stripe Price IDs. Keep in sync with lovifymusic when prices
// or credit amounts change; drift is obvious (funnel sells the wrong
// price) but not automatic. Topup packs are intentionally excluded — ad
// funnels sell subscriptions, not one-time credit packs.

export type LovifyPlanInterval = 'month' | 'quarter' | 'year'

export type LovifyPlan = {
  id: string
  name: string
  stripePriceId: string
  interval: LovifyPlanInterval
  credits: number
  price: number // web USD
  pricePerMonth?: number
  trialDays?: number
  trialCredits?: number
  perceivedSavings?: string
  features?: string[]
}

// The three intervals that drive the admin's first dropdown. "trial" is a
// virtual interval — it just filters to trial-bearing plans.
export type LovifyIntervalKey = 'trial' | 'year' | 'month' | 'quarter'

export const INTERVAL_LABEL: Record<LovifyIntervalKey, string> = {
  trial: 'Trial (Annual + 7-day free)',
  year: 'Annual',
  month: 'Monthly',
  quarter: 'Quarterly',
}

// ─── Trial-bearing plans ─────────────────────────────────────────────
const TRIAL_PLANS: LovifyPlan[] = [
  {
    id: 'yearly_premium_trial',
    name: 'Annual Premium + 7-day free trial',
    stripePriceId: 'price_1TMNStEtyqLO7bbyJnIDUlH9',
    interval: 'year',
    credits: 8999,
    trialCredits: 1000,
    price: 89.99,
    pricePerMonth: 7.5,
    trialDays: 7,
    perceivedSavings: 'SAVE 50%',
    features: [
      '7-day free trial (1,000 trial credits)',
      '8,999 credits/year',
      'Cancel anytime during trial',
    ],
  },
]

// ─── Annual ladder ───────────────────────────────────────────────────
const ANNUAL_PLANS: LovifyPlan[] = [
  {
    id: 'annual_9000',
    name: '9,000 credits/year',
    stripePriceId: 'price_1TMsn7EtyqLO7bby10vUxEJ3',
    interval: 'year',
    credits: 9000,
    price: 89.99,
    pricePerMonth: 7.5,
    perceivedSavings: 'SAVE 50%',
  },
  {
    id: 'annual_18000',
    name: '18,000 credits/year',
    stripePriceId: 'price_1TMsdNEtyqLO7bby12gT3BwA',
    interval: 'year',
    credits: 18000,
    price: 169.99,
    pricePerMonth: 14.17,
  },
  {
    id: 'annual_36000',
    name: '36,000 credits/year',
    stripePriceId: 'price_1TMse0EtyqLO7bbyR4XrdVLL',
    interval: 'year',
    credits: 36000,
    price: 329.99,
    pricePerMonth: 27.5,
  },
  {
    id: 'annual_60000',
    name: '60,000 credits/year',
    stripePriceId: 'price_1TMseVEtyqLO7bbyZGK0yWI2',
    interval: 'year',
    credits: 60000,
    price: 539.99,
    pricePerMonth: 45,
  },
]

// ─── Monthly ladder ──────────────────────────────────────────────────
const MONTHLY_PLANS: LovifyPlan[] = [
  {
    id: 'monthly_1500',
    name: '1,500 credits/month',
    stripePriceId: 'price_1THNOdEtyqLO7bbyZWwRCnNQ',
    interval: 'month',
    credits: 1500,
    price: 14.99,
  },
  {
    id: 'monthly_3000',
    name: '3,000 credits/month',
    stripePriceId: 'price_1TMsZfEtyqLO7bbyUnoAfwRm',
    interval: 'month',
    credits: 3000,
    price: 28.99,
  },
  {
    id: 'monthly_5000',
    name: '5,000 credits/month',
    stripePriceId: 'price_1TMsaOEtyqLO7bby71HK5zx1',
    interval: 'month',
    credits: 5000,
    price: 47.99,
  },
  {
    id: 'monthly_8000',
    name: '8,000 credits/month',
    stripePriceId: 'price_1TMsb0EtyqLO7bbySQ6ubDqp',
    interval: 'month',
    credits: 8000,
    price: 74.99,
  },
  {
    id: 'monthly_15000',
    name: '15,000 credits/month',
    stripePriceId: 'price_1TMsbkEtyqLO7bbyHUU5F5En',
    interval: 'month',
    credits: 15000,
    price: 139.99,
  },
  {
    id: 'monthly_25000',
    name: '25,000 credits/month',
    stripePriceId: 'price_1TMscJEtyqLO7bbyxRIcF7ZJ',
    interval: 'month',
    credits: 25000,
    price: 224.99,
  },
]

// ─── Quarterly ──────────────────────────────────────────────────────
const QUARTERLY_PLANS: LovifyPlan[] = [
  {
    id: 'quarterly',
    name: '3 Months — 2,999 credits',
    stripePriceId: 'price_1TMNOkEtyqLO7bbynWEwbV3i',
    interval: 'quarter',
    credits: 2999,
    price: 29.99,
    pricePerMonth: 10,
    perceivedSavings: 'SAVE 33%',
  },
]

export const LOVIFY_PLANS_BY_INTERVAL: Record<LovifyIntervalKey, LovifyPlan[]> = {
  trial: TRIAL_PLANS,
  year: ANNUAL_PLANS,
  month: MONTHLY_PLANS,
  quarter: QUARTERLY_PLANS,
}

export const ALL_LOVIFY_PLANS: LovifyPlan[] = [
  ...TRIAL_PLANS,
  ...ANNUAL_PLANS,
  ...MONTHLY_PLANS,
  ...QUARTERLY_PLANS,
]

export function getLovifyPlanById(id: string): LovifyPlan | undefined {
  return ALL_LOVIFY_PLANS.find((p) => p.id === id)
}

export function formatPlanPrice(plan: LovifyPlan): string {
  const base = `$${plan.price.toFixed(2)}`
  if (plan.interval === 'year') {
    return plan.pricePerMonth
      ? `${base}/yr ($${plan.pricePerMonth.toFixed(2)}/mo)`
      : `${base}/yr`
  }
  if (plan.interval === 'quarter') return `${base}/3mo`
  return `${base}/mo`
}
