import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

interface DashboardStats {
  totalUsers: number
  activeToday: number
  totalSongs: number
  totalVisions: number
  totalCreditsConsumed: number
  activeSubscriptions: number
}

async function safeCount(
  query: PromiseLike<{ count: number | null; error: unknown }>
): Promise<number> {
  try {
    const { count, error } = await query
    if (error) return 0
    return count ?? 0
  } catch {
    return 0
  }
}

async function fetchDashboardStats(): Promise<DashboardStats> {
  const today = new Date().toISOString().split('T')[0]

  const [
    totalUsers,
    activeToday,
    totalSongs,
    totalVisions,
    activeSubscriptions,
  ] = await Promise.all([
    safeCount(supabase.from('profiles').select('id', { count: 'exact', head: true })),
    safeCount(supabase.from('user_sessions').select('user_id', { count: 'exact', head: true }).gte('date', today)),
    safeCount(supabase.from('generated_songs').select('id', { count: 'exact', head: true })),
    safeCount(supabase.from('generated_visions').select('id', { count: 'exact', head: true })),
    safeCount(supabase.from('subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'active')),
  ])

  // Credits consumed — sum of negative transactions (limit to recent for perf)
  let totalCreditsConsumed = 0
  try {
    const { data } = await supabase
      .from('credit_transactions')
      .select('amount')
      .lt('amount', 0)
      .order('created_at', { ascending: false })
      .limit(1000)

    if (data) {
      totalCreditsConsumed = data.reduce((sum, t) => sum + Math.abs(t.amount), 0)
    }
  } catch {
    // silently fail
  }

  return {
    totalUsers,
    activeToday,
    totalSongs,
    totalVisions,
    totalCreditsConsumed,
    activeSubscriptions,
  }
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: fetchDashboardStats,
    staleTime: 60_000,
  })
}

interface RevenueDataPoint {
  date: string
  revenue: number
  costs: number
}

async function fetchRevenueChart(): Promise<RevenueDataPoint[]> {
  const { data } = await supabase
    .from('daily_pnl_stats')
    .select('date, total_revenue_usd, total_costs_usd')
    .order('date', { ascending: true })
    .limit(30)

  if (!data) return []

  return data.map((row) => ({
    date: row.date,
    revenue: Number(row.total_revenue_usd ?? 0),
    costs: Number(row.total_costs_usd ?? 0),
  }))
}

export function useRevenueChart() {
  return useQuery({
    queryKey: ['revenue-chart'],
    queryFn: fetchRevenueChart,
    staleTime: 5 * 60_000,
  })
}
