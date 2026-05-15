import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

const STALE = 5 * 60_000

export interface DateRange {
  from: string  // YYYY-MM-DD
  to: string    // YYYY-MM-DD
}

// ─── Helpers ───

const isoDaysAgo = (days: number): string => {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

const dateOnlyDaysAgo = (days: number): string => {
  return isoDaysAgo(days).split('T')[0]
}

// A subscription is "active" for MRR purposes when its status is active OR
// trialing and Stripe hasn't already scheduled it to end before today.
const ACTIVE_STATUSES = ['active', 'trialing'] as const

// Canonical plan price + interval map. Mirrors
// lovifymusic/supabase/migrations/20260427000000_backfill_subscription_price_cents.sql
// AND lovifymusic/src/lib/pricing.ts. Used as fallback when a subscription
// row has price_cents=0 (most commonly RevenueCat / iOS IAP rows, where
// our DB doesn't receive the price from RevenueCat at write time).
//
// If you change a plan's price in lovifymusic/src/lib/pricing.ts, update
// this map AND re-run the backfill migration on prod.
type PlanInterval = 'month' | 'quarter' | 'year'

const PLAN_MAP: Record<string, { priceCents: number; interval: PlanInterval }> = {
  // ── Buy-now subscriptions ─────────────────
  monthly:              { priceCents: 1499,  interval: 'month' },
  quarterly:            { priceCents: 2999,  interval: 'quarter' },
  yearly:               { priceCents: 5999,  interval: 'year' },
  yearly_premium_trial: { priceCents: 8999,  interval: 'year' },

  // ── Monthly ladder ────────────────────────
  monthly_1500:  { priceCents: 1499,  interval: 'month' },
  monthly_3000:  { priceCents: 2899,  interval: 'month' },
  monthly_5000:  { priceCents: 4799,  interval: 'month' },
  monthly_8000:  { priceCents: 7499,  interval: 'month' },
  monthly_15000: { priceCents: 13999, interval: 'month' },
  monthly_25000: { priceCents: 22499, interval: 'month' },

  // ── Annual ladder (yearly_* and annual_* alias the same Stripe prices) ──
  yearly_9000:   { priceCents: 8999,  interval: 'year' },
  yearly_18000:  { priceCents: 16999, interval: 'year' },
  yearly_36000:  { priceCents: 32999, interval: 'year' },
  yearly_60000:  { priceCents: 53999, interval: 'year' },
  annual_9000:   { priceCents: 8999,  interval: 'year' },
  annual_18000:  { priceCents: 16999, interval: 'year' },
  annual_36000:  { priceCents: 32999, interval: 'year' },
  annual_60000:  { priceCents: 53999, interval: 'year' },

  // ── Legacy (grandfathered subscribers still renew) ──
  legacy_yearly_trial:    { priceCents: 8999, interval: 'year' },
  legacy_yearly:          { priceCents: 5999, interval: 'year' },
  legacy_quarterly:       { priceCents: 2999, interval: 'quarter' },
  legacy_monthly:         { priceCents: 1299, interval: 'month' },
  legacy_yearly_discount: { priceCents: 4999, interval: 'year' },
  legacy_boost_250:       { priceCents: 799,  interval: 'month' },
  legacy_boost_500:       { priceCents: 1499, interval: 'month' },
  legacy_boost_750:       { priceCents: 1999, interval: 'month' },
  legacy_boost_1000:      { priceCents: 2499, interval: 'month' },
  legacy_boost_1500:      { priceCents: 3499, interval: 'month' },

  // ── Pre-revamp legacy plan id still present in dev data ──
  pro: { priceCents: 1499, interval: 'month' },
}

// Returns the monthly-normalized cents contribution to MRR for a sub row.
// Prefers explicit price_cents from the DB (Stripe-source-of-truth post-
// backfill); falls back to PLAN_MAP for RevenueCat rows that store 0.
const monthlyMrrCents = (row: { price_cents?: number | null; plan_id?: string | null }): number => {
  const plan = row.plan_id ? PLAN_MAP[row.plan_id] : undefined
  const cents = row.price_cents && row.price_cents > 0 ? row.price_cents : (plan?.priceCents ?? 0)
  const interval = plan?.interval

  if (cents <= 0) return 0
  if (interval === 'year') return Math.round(cents / 12)
  if (interval === 'quarter') return Math.round(cents / 3)
  if (interval === 'month') return cents

  // Unknown plan_id: heuristic fall-through. Prices >= ~$60 are almost
  // certainly yearly (lovifymusic monthly tops out around $30/mo).
  return cents >= 6000 ? Math.round(cents / 12) : cents
}

// ─── Current MRR ───

export const useCurrentMrr = () => {
  return useQuery({
    queryKey: ['business-health', 'current-mrr'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('price_cents, plan_id, status, cancel_at')
        .in('status', ACTIVE_STATUSES as unknown as string[])

      if (error) throw error
      const now = new Date()

      const activeSubs = (data ?? []).filter((s) => {
        if (!s.cancel_at) return true
        return new Date(s.cancel_at) > now
      })

      const totalCents = activeSubs.reduce((sum, s) => sum + monthlyMrrCents(s), 0)
      return {
        mrrCents: totalCents,
        activeCount: activeSubs.length,
      }
    },
    staleTime: STALE,
  })
}

// ─── MRR Growth (vs prior period) ───
//
// Comparison: current MRR vs MRR 30 days ago. We approximate "MRR 30 days
// ago" as the MRR contribution from subscriptions that were created on or
// before that date and that hadn't already been cancelled by that date.

export const useMrrGrowth = () => {
  return useQuery({
    queryKey: ['business-health', 'mrr-growth'],
    queryFn: async () => {
      const thirtyDaysAgo = isoDaysAgo(30)

      const [currentRes, priorRes] = await Promise.all([
        supabase
          .from('subscriptions')
          .select('price_cents, plan_id, status, cancel_at')
          .in('status', ACTIVE_STATUSES as unknown as string[]),
        supabase
          .from('subscriptions')
          .select('price_cents, plan_id, created_at, cancel_at, status')
          .lte('created_at', thirtyDaysAgo),
      ])

      if (currentRes.error) throw currentRes.error
      if (priorRes.error) throw priorRes.error

      const now = new Date()
      const priorCutoff = new Date(thirtyDaysAgo)

      const currentCents = (currentRes.data ?? [])
        .filter((s) => !s.cancel_at || new Date(s.cancel_at) > now)
        .reduce((sum, s) => sum + monthlyMrrCents(s), 0)

      const priorCents = (priorRes.data ?? [])
        .filter((s) => {
          // Was the subscription active at the cutoff date?
          if (s.cancel_at && new Date(s.cancel_at) <= priorCutoff) return false
          if (!ACTIVE_STATUSES.includes(s.status as typeof ACTIVE_STATUSES[number])) {
            // Allow canceled rows only if cancellation happened after cutoff
            if (!s.cancel_at || new Date(s.cancel_at) <= priorCutoff) return false
          }
          return true
        })
        .reduce((sum, s) => sum + monthlyMrrCents(s), 0)

      const growthPct = priorCents > 0 ? ((currentCents - priorCents) / priorCents) * 100 : 0
      return {
        currentCents,
        priorCents,
        growthPct,
      }
    },
    staleTime: STALE,
  })
}

// ─── Net Revenue Retention ───
//
// NRR = (current MRR from a cohort) / (cohort's MRR 90 days ago).
// We approximate using the 90-day-old MRR base and asking how much of it
// is still active today. Expansion is captured if those users upgraded
// plans (their current price_cents went up).

export const useNetRevenueRetention = () => {
  return useQuery({
    queryKey: ['business-health', 'nrr'],
    queryFn: async () => {
      const ninetyDaysAgo = isoDaysAgo(90)

      const { data, error } = await supabase
        .from('subscriptions')
        .select('user_id, price_cents, plan_id, status, cancel_at, created_at')
        .lte('created_at', ninetyDaysAgo)

      if (error) throw error
      const now = new Date()
      const cutoff = new Date(ninetyDaysAgo)

      // Cohort = subs that existed at cutoff
      const cohort = (data ?? []).filter((s) => {
        if (s.cancel_at && new Date(s.cancel_at) <= cutoff) return false
        return true
      })

      const baseCents = cohort.reduce((sum, s) => sum + monthlyMrrCents(s), 0)

      const retained = cohort.filter((s) => {
        if (!ACTIVE_STATUSES.includes(s.status as typeof ACTIVE_STATUSES[number])) return false
        if (s.cancel_at && new Date(s.cancel_at) <= now) return false
        return true
      })

      const retainedCents = retained.reduce((sum, s) => sum + monthlyMrrCents(s), 0)

      const nrrPct = baseCents > 0 ? (retainedCents / baseCents) * 100 : 0
      return {
        baseCents,
        retainedCents,
        nrrPct,
        cohortSize: cohort.length,
      }
    },
    staleTime: STALE,
  })
}

// ─── Gross Margin (date range) ───

export const useGrossMargin = (range: DateRange) => {
  return useQuery({
    queryKey: ['business-health', 'gross-margin', range.from, range.to],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_pnl_stats')
        .select('total_revenue_usd, total_costs_usd')
        .gte('date', range.from)
        .lte('date', range.to)

      if (error) throw error

      const totalRevenue = (data ?? []).reduce((s, d) => s + Number(d.total_revenue_usd ?? 0), 0)
      const totalCosts = (data ?? []).reduce((s, d) => s + Number(d.total_costs_usd ?? 0), 0)
      const grossProfit = totalRevenue - totalCosts
      const marginPct = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0

      return { totalRevenue, totalCosts, grossProfit, marginPct }
    },
    staleTime: STALE,
  })
}

// ─── Monthly Churn ───
//
// Churn = (subs whose cancel_at fell in the last 30 days) / (subs active 30 days ago).

export const useMonthlyChurn = () => {
  return useQuery({
    queryKey: ['business-health', 'monthly-churn'],
    queryFn: async () => {
      const thirtyDaysAgo = isoDaysAgo(30)
      const cutoffDate = new Date(thirtyDaysAgo)

      const [cancelledRes, allRes] = await Promise.all([
        supabase
          .from('subscriptions')
          .select('id, cancel_at')
          .gte('cancel_at', thirtyDaysAgo)
          .lte('cancel_at', new Date().toISOString()),
        supabase
          .from('subscriptions')
          .select('id, created_at, cancel_at, status')
          .lte('created_at', thirtyDaysAgo),
      ])

      if (cancelledRes.error) throw cancelledRes.error
      if (allRes.error) throw allRes.error

      const cancelledCount = cancelledRes.data?.length ?? 0

      const activeAtCutoffCount = (allRes.data ?? []).filter((s) => {
        // Was active at cutoff if either still active or cancellation happened after cutoff
        if (!s.cancel_at) return true
        return new Date(s.cancel_at) > cutoffDate
      }).length

      const churnPct = activeAtCutoffCount > 0 ? (cancelledCount / activeAtCutoffCount) * 100 : 0
      return {
        cancelledCount,
        activeAtCutoffCount,
        churnPct,
      }
    },
    staleTime: STALE,
  })
}

// ─── MRR 90-day trend ───
//
// Daily MRR is rebuilt by walking the subscriptions list and computing
// "what was active on this date". This is approximate (the subscriptions
// table only stores current state — there's no event log), but it's a
// faithful answer when reverse-projecting from cancel_at / created_at.

export interface MrrTrendPoint {
  date: string
  mrrCents: number
}

export const useMrrTrend = (days = 90) => {
  return useQuery({
    queryKey: ['business-health', 'mrr-trend', days],
    queryFn: async (): Promise<MrrTrendPoint[]> => {
      const start = new Date()
      start.setDate(start.getDate() - days)
      start.setHours(0, 0, 0, 0)

      const { data, error } = await supabase
        .from('subscriptions')
        .select('price_cents, plan_id, created_at, cancel_at, status')

      if (error) throw error
      const subs = data ?? []

      const points: MrrTrendPoint[] = []
      const cursor = new Date(start)
      const end = new Date()
      end.setHours(0, 0, 0, 0)

      while (cursor <= end) {
        const day = new Date(cursor)
        let cents = 0
        for (const s of subs) {
          if (!s.created_at) continue
          const createdAt = new Date(s.created_at)
          if (createdAt > day) continue
          if (s.cancel_at && new Date(s.cancel_at) <= day) continue
          // If status is canceled but cancel_at is null we can't know when
          // it ended — exclude it from historical points to stay conservative.
          if (s.status === 'canceled' && !s.cancel_at) continue
          cents += monthlyMrrCents(s)
        }
        points.push({
          date: cursor.toISOString().split('T')[0],
          mrrCents: cents,
        })
        cursor.setDate(cursor.getDate() + 1)
      }

      return points
    },
    staleTime: STALE,
  })
}

// ─── Cost ratios (Costs tab) ───
//
// Three Notion-spec ratios: compute cost per active user, per song, and
// as a percentage of revenue. All three are computed over the same date
// range as the rest of the Business Health tab.
//
// "Active user" = anyone who had an api_cost row in the window. Tighter
// than profiles.count and matches the "who actually generated something"
// definition the cost ratio is meant to express.

export interface CostRatios {
  totalCostUsd: number
  totalRevenueUsd: number
  activeUserCount: number
  songCount: number
  costPerUser: number      // dollars per active user
  costPerSong: number      // dollars per song generated
  costPctOfRevenue: number // 0-100
}

export const useCostRatios = (range: DateRange) => {
  return useQuery({
    queryKey: ['business-health', 'cost-ratios', range.from, range.to],
    queryFn: async (): Promise<CostRatios> => {
      // Convert YYYY-MM-DD → ISO timestamps so the bounds cover whole days.
      const fromIso = new Date(range.from).toISOString()
      const toIso = new Date(`${range.to}T23:59:59.999Z`).toISOString()

      const [costsRes, revenueRes, songsRes] = await Promise.all([
        supabase
          .from('api_costs')
          .select('cost_usd, user_id')
          .gte('created_at', fromIso)
          .lte('created_at', toIso),
        supabase
          .from('daily_pnl_stats')
          .select('total_revenue_usd')
          .gte('date', range.from)
          .lte('date', range.to),
        supabase
          .from('generated_songs')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', fromIso)
          .lte('created_at', toIso),
      ])

      if (costsRes.error) throw costsRes.error
      if (revenueRes.error) throw revenueRes.error
      if (songsRes.error) throw songsRes.error

      const totalCostUsd = (costsRes.data ?? []).reduce(
        (sum, c) => sum + Number(c.cost_usd ?? 0),
        0,
      )
      const totalRevenueUsd = (revenueRes.data ?? []).reduce(
        (sum, d) => sum + Number(d.total_revenue_usd ?? 0),
        0,
      )
      const activeUserIds = new Set(
        (costsRes.data ?? [])
          .map((c) => c.user_id)
          .filter((id): id is string => typeof id === 'string'),
      )
      const activeUserCount = activeUserIds.size
      const songCount = songsRes.count ?? 0

      return {
        totalCostUsd,
        totalRevenueUsd,
        activeUserCount,
        songCount,
        costPerUser: activeUserCount > 0 ? totalCostUsd / activeUserCount : 0,
        costPerSong: songCount > 0 ? totalCostUsd / songCount : 0,
        costPctOfRevenue: totalRevenueUsd > 0 ? (totalCostUsd / totalRevenueUsd) * 100 : 0,
      }
    },
    staleTime: STALE,
  })
}

// ─── Daily cost breakdown (Costs tab chart) ───
//
// Reads from `daily_pnl_stats` instead of raw `api_costs` so the chart
// covers the full date range without bumping into a 1000+ row API page
// limit. The rollup table is updated nightly and is what Money tab
// already uses for revenue + costs — keeping the two tabs consistent.

export interface DailyCostPoint {
  date: string
  song: number      // music + text + voice in USD
  vision: number    // image gen in USD
  mindMovie: number // video gen in USD
}

export const useDailyCostBreakdown = (range: DateRange) => {
  return useQuery({
    queryKey: ['business-health', 'daily-costs', range.from, range.to],
    queryFn: async (): Promise<DailyCostPoint[]> => {
      const { data, error } = await supabase
        .from('daily_pnl_stats')
        .select('date, image_costs_usd, video_costs_usd, music_costs_usd, text_costs_usd')
        .gte('date', range.from)
        .lte('date', range.to)
        .order('date', { ascending: true })

      if (error) throw error
      return (data ?? []).map((d) => ({
        date: d.date,
        // Song = music gen + text gen (lyrics-adjacent). Matches the
        // grouping the old AICostsTab used for `cost_type`-rolled-up flows.
        song: Number(d.music_costs_usd ?? 0) + Number(d.text_costs_usd ?? 0),
        vision: Number(d.image_costs_usd ?? 0),
        mindMovie: Number(d.video_costs_usd ?? 0),
      }))
    },
    staleTime: STALE,
  })
}

// ─── Date range helpers ───

export const defaultDateRange = (days = 30): DateRange => {
  return {
    from: dateOnlyDaysAgo(days),
    to: dateOnlyDaysAgo(0),
  }
}
