import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

function useStatQuery(key: string, fn: () => Promise<number>) {
  return useQuery({
    queryKey: ['dashboard', key],
    queryFn: fn,
    staleTime: 60_000,
  })
}

export function useTotalUsers() {
  return useStatQuery('totalUsers', async () => {
    const { count } = await supabase.from('profiles').select('id', { count: 'exact', head: true })
    return count ?? 0
  })
}

export function useActiveToday() {
  return useStatQuery('activeToday', async () => {
    const today = new Date().toISOString().split('T')[0]
    const { count } = await supabase.from('user_sessions').select('user_id', { count: 'exact', head: true }).gte('date', today)
    return count ?? 0
  })
}

export function useTotalSongs() {
  return useStatQuery('totalSongs', async () => {
    const { count } = await supabase.from('generated_songs').select('id', { count: 'exact', head: true })
    return count ?? 0
  })
}

export function useTotalVisions() {
  return useStatQuery('totalVisions', async () => {
    const { count } = await supabase.from('generated_visions').select('id', { count: 'exact', head: true })
    return count ?? 0
  })
}

export function useActiveSubscriptions() {
  return useStatQuery('activeSubs', async () => {
    const { count } = await supabase.from('subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'active')
    return count ?? 0
  })
}

export function useCreditsConsumed() {
  return useStatQuery('creditsConsumed', async () => {
    const { data } = await supabase
      .from('credit_transactions')
      .select('amount')
      .lt('amount', 0)
      .order('created_at', { ascending: false })
      .limit(1000)
    return data?.reduce((sum, t) => sum + Math.abs(t.amount), 0) ?? 0
  })
}

// Revenue chart — separate hook with date range
interface RevenueDataPoint {
  date: string
  revenue: number
  costs: number
}

export interface DateRange {
  from: string  // YYYY-MM-DD
  to: string    // YYYY-MM-DD
}

export function useRevenueChart(range: DateRange) {
  return useQuery({
    queryKey: ['revenue-chart', range.from, range.to],
    queryFn: async (): Promise<RevenueDataPoint[]> => {
      const { data } = await supabase
        .from('daily_pnl_stats')
        .select('date, total_revenue_usd, total_costs_usd')
        .gte('date', range.from)
        .lte('date', range.to)
        .order('date', { ascending: true })

      // Build a map of existing data by date
      const dataMap = new Map<string, { revenue: number; costs: number }>()
      for (const row of data ?? []) {
        dataMap.set(row.date, {
          revenue: Number(row.total_revenue_usd ?? 0),
          costs: Number(row.total_costs_usd ?? 0),
        })
      }

      // Fill ALL days in the range so the timeline is continuous
      const result: RevenueDataPoint[] = []
      const start = new Date(range.from)
      const end = new Date(range.to)
      const cursor = new Date(start)

      while (cursor <= end) {
        const dateStr = cursor.toISOString().split('T')[0]
        const existing = dataMap.get(dateStr)
        result.push({
          date: dateStr,
          revenue: existing?.revenue ?? 0,
          costs: existing?.costs ?? 0,
        })
        cursor.setDate(cursor.getDate() + 1)
      }

      return result
    },
    staleTime: 5 * 60_000,
  })
}
