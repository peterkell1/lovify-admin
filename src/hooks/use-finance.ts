import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

// ─── P&L ───

export interface PnLDay {
  date: string
  total_revenue_usd: number
  total_costs_usd: number
  subscription_revenue_usd: number
  credit_pack_revenue_usd: number
  gift_revenue_usd: number
  other_revenue_usd: number
  image_costs_usd: number
  video_costs_usd: number
  music_costs_usd: number
  text_costs_usd: number
  image_count: number
  video_count: number
  song_count: number
  token_count: number
}

export function usePnL(days = 30) {
  return useQuery({
    queryKey: ['finance-pnl', days],
    queryFn: async () => {
      const since = new Date()
      since.setDate(since.getDate() - days)

      const { data, error } = await supabase
        .from('daily_pnl_stats')
        .select('*')
        .gte('date', since.toISOString().split('T')[0])
        .order('date', { ascending: true })

      if (error) throw error
      return (data ?? []) as PnLDay[]
    },
    staleTime: 5 * 60_000,
  })
}

// ─── AI Costs ───

export interface AICostRow {
  id: string
  cost_type: string
  cost_usd: number
  model_name: string
  created_at: string
  user_id: string
}

export function useAICosts(days = 30) {
  return useQuery({
    queryKey: ['finance-ai-costs', days],
    queryFn: async () => {
      const since = new Date()
      since.setDate(since.getDate() - days)

      const { data, error } = await supabase
        .from('api_costs')
        .select('id, cost_type, cost_usd, model_name, created_at, user_id')
        .gte('created_at', since.toISOString())
        .order('created_at', { ascending: false })
        .limit(2000)

      if (error) throw error
      return (data ?? []) as AICostRow[]
    },
    staleTime: 5 * 60_000,
  })
}

// ─── Subscriptions ───

export interface SubscriptionRow {
  id: string
  user_id: string
  plan_id: string
  status: string
  price_cents: number
  credits_per_month: number
  stripe_subscription_id: string | null
  stripe_customer_id: string | null
  current_period_start: string | null
  current_period_end: string | null
  created_at: string
  // joined
  email: string | null
  display_name: string | null
}

interface UseSubscriptionsParams {
  status?: string
  page?: number
  pageSize?: number
}

export function useSubscriptions({ status, page = 1, pageSize = 25 }: UseSubscriptionsParams) {
  return useQuery({
    queryKey: ['finance-subscriptions', status, page],
    queryFn: async () => {
      let query = supabase
        .from('subscriptions')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1)

      if (status && status !== 'all') {
        query = query.eq('status', status)
      }

      const { data: subs, count, error } = await query
      if (error) throw error
      if (!subs || subs.length === 0) return { subscriptions: [], total: 0 }

      // Join profile data
      const userIds = [...new Set(subs.map((s) => s.user_id))]
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, display_name')
        .in('id', userIds)

      const profileMap = new Map(profiles?.map((p) => [p.id, p]) ?? [])

      const subscriptions: SubscriptionRow[] = subs.map((s) => {
        const profile = profileMap.get(s.user_id)
        return {
          ...s,
          email: profile?.email ?? null,
          display_name: profile?.display_name ?? null,
        }
      })

      return { subscriptions, total: count ?? 0 }
    },
    staleTime: 30_000,
  })
}

// ─── Credit Economy ───

export interface CreditSummary {
  totalBalance: number
  totalGranted: number
  totalConsumed: number
  byType: { type: string; total: number; count: number }[]
}

export function useCreditEconomy(days = 30) {
  return useQuery({
    queryKey: ['finance-credit-economy', days],
    queryFn: async () => {
      const since = new Date()
      since.setDate(since.getDate() - days)

      const [balanceRes, txRes] = await Promise.all([
        supabase.from('user_credits').select('credit_balance'),
        supabase
          .from('credit_transactions')
          .select('amount, transaction_type, created_at')
          .gte('created_at', since.toISOString())
          .order('created_at', { ascending: false })
          .limit(5000),
      ])

      const totalBalance = balanceRes.data?.reduce((s, r) => s + (r.credit_balance ?? 0), 0) ?? 0

      const transactions = txRes.data ?? []
      let totalGranted = 0
      let totalConsumed = 0
      const typeMap = new Map<string, { total: number; count: number }>()

      for (const tx of transactions) {
        if (tx.amount >= 0) {
          totalGranted += tx.amount
        } else {
          totalConsumed += Math.abs(tx.amount)
        }
        const entry = typeMap.get(tx.transaction_type) ?? { total: 0, count: 0 }
        entry.total += tx.amount
        entry.count += 1
        typeMap.set(tx.transaction_type, entry)
      }

      const byType = Array.from(typeMap.entries())
        .map(([type, data]) => ({ type, ...data }))
        .sort((a, b) => Math.abs(b.total) - Math.abs(a.total))

      return { totalBalance, totalGranted, totalConsumed, byType } as CreditSummary
    },
    staleTime: 60_000,
  })
}
