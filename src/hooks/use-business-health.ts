import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

const DAYS_PER_MONTH = 30.4375 // 365.25 / 12

interface SubRow {
  id: string
  user_id: string
  plan_id: string | null
  status: string
  price_cents: number | null
  current_period_start: string | null
  current_period_end: string | null
  created_at: string
}

function periodDays(s: SubRow): number {
  if (!s.current_period_start || !s.current_period_end) return 30 // assume monthly
  const days =
    (new Date(s.current_period_end).getTime() -
      new Date(s.current_period_start).getTime()) /
    86400000
  if (days < 6) return 30 // trial periods (1 day) — don't divide; just treat as monthly
  return Math.round(days)
}

// Given a subscription, return its MRR contribution in dollars.
// Yearly plans → /12, weekly → *4.33, etc. Excludes price=0 and non-active.
function subMrrUsd(s: SubRow): number {
  if (s.status !== 'active') return 0
  const cents = s.price_cents ?? 0
  if (cents <= 0) return 0
  const days = periodDays(s)
  const usdPerDay = cents / 100 / days
  return usdPerDay * DAYS_PER_MONTH
}

// ─── 1. MRR + growth rate ─────────────────────────────────────────

export interface MrrSummary {
  mrr: number
  priorMrr: number
  growthPct: number // (current-prior)/prior, 0..n
  activePayingSubs: number
  arpu: number // average revenue per paying user
}

export function useMrr() {
  return useQuery({
    queryKey: ['biz-mrr'],
    queryFn: async (): Promise<MrrSummary> => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('id, user_id, plan_id, status, price_cents, current_period_start, current_period_end, created_at')
        .limit(20000)
      if (error) throw error
      const subs = (data ?? []) as SubRow[]

      const now = Date.now()
      const monthAgo = now - 30 * 86400000

      let mrr = 0
      let activePaying = 0
      let priorMrr = 0
      for (const s of subs) {
        const value = subMrrUsd(s)
        if (value > 0) {
          mrr += value
          activePaying += 1
        }
        // Prior MRR estimate: subs created before 30d ago that were active then.
        // Approximation: if it's still active, it counted then; if it ended in
        // the last 30d, it was active 30d ago and contributed to priorMrr.
        const created = new Date(s.created_at).getTime()
        if (created <= monthAgo && (s.price_cents ?? 0) > 0) {
          // Was it active at monthAgo? Status='active' → yes (still active).
          // Status='cancelled' but current_period_end > monthAgo → also yes.
          if (s.status === 'active') {
            // Use current price as proxy
            priorMrr += subMrrUsd(s)
          } else if (s.status === 'cancelled' && s.current_period_end) {
            const end = new Date(s.current_period_end).getTime()
            if (end > monthAgo) {
              const days = periodDays(s)
              priorMrr += ((s.price_cents ?? 0) / 100 / days) * DAYS_PER_MONTH
            }
          }
        }
      }

      return {
        mrr,
        priorMrr,
        growthPct: priorMrr > 0 ? (mrr - priorMrr) / priorMrr : 0,
        activePayingSubs: activePaying,
        arpu: activePaying > 0 ? mrr / activePaying : 0,
      }
    },
    staleTime: 5 * 60_000,
  })
}

// ─── 2. Gross margin (from daily_pnl_stats) ───────────────────────

export interface MarginSummary {
  windowDays: number
  revenue: number
  costs: number
  margin: number // (revenue-costs)/revenue
  costAsPctOfRevenue: number // costs/revenue
}

export function useGrossMargin(days = 30) {
  return useQuery({
    queryKey: ['biz-margin', days],
    queryFn: async (): Promise<MarginSummary> => {
      const since = new Date()
      since.setDate(since.getDate() - days)
      const { data, error } = await supabase
        .from('daily_pnl_stats')
        .select('total_revenue_usd, total_costs_usd')
        .gte('date', since.toISOString().split('T')[0])
      if (error) throw error
      let rev = 0
      let cost = 0
      for (const r of data ?? []) {
        rev += Number(r.total_revenue_usd ?? 0)
        cost += Number(r.total_costs_usd ?? 0)
      }
      return {
        windowDays: days,
        revenue: rev,
        costs: cost,
        margin: rev > 0 ? (rev - cost) / rev : 0,
        costAsPctOfRevenue: rev > 0 ? cost / rev : 0,
      }
    },
    staleTime: 5 * 60_000,
  })
}

// ─── 3. Monthly churn rate ────────────────────────────────────────

export interface ChurnSummary {
  windowDays: number
  cancelledInWindow: number
  activeAtStart: number
  churnRate: number
}

export function useMonthlyChurn(days = 30) {
  return useQuery({
    queryKey: ['biz-churn', days],
    queryFn: async (): Promise<ChurnSummary> => {
      const since = new Date()
      since.setDate(since.getDate() - days)

      const { data, error } = await supabase
        .from('subscriptions')
        .select('id, status, created_at, current_period_end, price_cents')
        .limit(20000)
      if (error) throw error
      const subs = (data ?? []) as SubRow[]

      // Cancelled in window: status='cancelled' AND current_period_end >= sinceISO
      // Active at start of window: created before sinceISO AND (still active OR ended after sinceISO)
      let cancelledInWindow = 0
      let activeAtStart = 0
      for (const s of subs) {
        if ((s.price_cents ?? 0) <= 0) continue // free/trial — not churnable
        const createdAtStart = new Date(s.created_at).getTime() <= since.getTime()
        if (!createdAtStart) continue
        if (s.status === 'active') {
          activeAtStart += 1
        } else if (s.status === 'cancelled' && s.current_period_end) {
          const end = new Date(s.current_period_end).getTime()
          if (end >= since.getTime()) {
            activeAtStart += 1
            cancelledInWindow += 1
          }
        } else if (s.status === 'past_due') {
          activeAtStart += 1
          cancelledInWindow += 1
        }
      }
      return {
        windowDays: days,
        cancelledInWindow,
        activeAtStart,
        churnRate: activeAtStart > 0 ? cancelledInWindow / activeAtStart : 0,
      }
    },
    staleTime: 5 * 60_000,
  })
}

// ─── 4. Compute cost per song / per user ──────────────────────────

export interface CostPerOutput {
  windowDays: number
  totalCostUsd: number
  totalSongs: number
  totalUsers: number
  costPerSongUsd: number
  costPerActiveUserUsd: number
}

export function useComputeCostPerOutput(days = 30) {
  return useQuery({
    queryKey: ['biz-cost-per-output', days],
    queryFn: async (): Promise<CostPerOutput> => {
      const since = new Date()
      since.setDate(since.getDate() - days)
      const sinceISO = since.toISOString()

      const [costsRes, songsRes, sessionsRes] = await Promise.all([
        supabase.from('api_costs').select('cost_usd').gte('created_at', sinceISO).limit(50000),
        supabase
          .from('generated_songs')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', sinceISO),
        supabase
          .from('user_sessions')
          .select('user_id')
          .gte('date', since.toISOString().split('T')[0])
          .limit(100000),
      ])
      if (costsRes.error) throw costsRes.error
      if (songsRes.error) throw songsRes.error
      if (sessionsRes.error) throw sessionsRes.error

      const totalCost = (costsRes.data ?? []).reduce(
        (s, r) => s + Number(r.cost_usd ?? 0),
        0
      )
      const totalSongs = songsRes.count ?? 0
      const totalUsers = new Set((sessionsRes.data ?? []).map((r) => r.user_id)).size

      return {
        windowDays: days,
        totalCostUsd: totalCost,
        totalSongs,
        totalUsers,
        costPerSongUsd: totalSongs > 0 ? totalCost / totalSongs : 0,
        costPerActiveUserUsd: totalUsers > 0 ? totalCost / totalUsers : 0,
      }
    },
    staleTime: 5 * 60_000,
  })
}

// ─── 5. LTV by signup-month cohort ────────────────────────────────

export interface CohortLtvPoint {
  cohort: string // YYYY-MM
  signupCount: number
  payingCount: number
  totalRevenueUsd: number
  ltvPerSignup: number
  ltvPerPaying: number
}

export function useLtvByCohort(months = 12) {
  return useQuery({
    queryKey: ['biz-ltv-cohort', months],
    queryFn: async (): Promise<CohortLtvPoint[]> => {
      const since = new Date()
      since.setMonth(since.getMonth() - months)
      const sinceISO = since.toISOString()

      const [profilesRes, subsRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, created_at')
          .gte('created_at', sinceISO)
          .limit(10000),
        supabase
          .from('subscriptions')
          .select('user_id, status, price_cents, current_period_start, current_period_end, created_at')
          .limit(20000),
      ])
      if (profilesRes.error) throw profilesRes.error
      if (subsRes.error) throw subsRes.error

      const profiles = (profilesRes.data ?? []) as { id: string; created_at: string }[]
      const subs = (subsRes.data ?? []) as SubRow[]

      // Bucket users by signup month
      const cohortByUser = new Map<string, string>() // user_id → cohort
      const cohortBuckets = new Map<
        string,
        { signups: Set<string>; payingUsers: Set<string>; revenue: number }
      >()
      for (const p of profiles) {
        const d = new Date(p.created_at)
        const cohort = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
        cohortByUser.set(p.id, cohort)
        if (!cohortBuckets.has(cohort)) {
          cohortBuckets.set(cohort, {
            signups: new Set(),
            payingUsers: new Set(),
            revenue: 0,
          })
        }
        cohortBuckets.get(cohort)!.signups.add(p.id)
      }

      // Attribute revenue per sub to the user's cohort
      for (const s of subs) {
        const cohort = cohortByUser.get(s.user_id)
        if (!cohort) continue
        const cents = s.price_cents ?? 0
        if (cents <= 0) continue
        // Estimate revenue collected so far on this sub.
        // For simplicity, count one full charge if status is 'active' or
        // 'cancelled' with end date in past. Real implementation would sum
        // invoices.
        const charges = 1 // approximation
        const rev = (cents / 100) * charges
        const bucket = cohortBuckets.get(cohort)!
        bucket.payingUsers.add(s.user_id)
        bucket.revenue += rev
      }

      const points: CohortLtvPoint[] = []
      for (const [cohort, b] of cohortBuckets.entries()) {
        const signupCount = b.signups.size
        const payingCount = b.payingUsers.size
        points.push({
          cohort,
          signupCount,
          payingCount,
          totalRevenueUsd: b.revenue,
          ltvPerSignup: signupCount > 0 ? b.revenue / signupCount : 0,
          ltvPerPaying: payingCount > 0 ? b.revenue / payingCount : 0,
        })
      }
      points.sort((a, b) => a.cohort.localeCompare(b.cohort))
      return points
    },
    staleTime: 5 * 60_000,
  })
}

// ─── 6. Revenue/cost trend (reuse daily_pnl_stats) ────────────────

export interface PnlTrendPoint {
  date: string
  revenue: number
  cost: number
}

export function usePnlTrend(days = 90) {
  return useQuery({
    queryKey: ['biz-pnl-trend', days],
    queryFn: async (): Promise<PnlTrendPoint[]> => {
      const since = new Date()
      since.setDate(since.getDate() - days)
      const { data, error } = await supabase
        .from('daily_pnl_stats')
        .select('date, total_revenue_usd, total_costs_usd')
        .gte('date', since.toISOString().split('T')[0])
        .order('date', { ascending: true })
      if (error) throw error
      return (data ?? []).map((r) => ({
        date: r.date,
        revenue: Number(r.total_revenue_usd ?? 0),
        cost: Number(r.total_costs_usd ?? 0),
      }))
    },
    staleTime: 5 * 60_000,
  })
}
