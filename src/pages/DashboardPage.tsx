import { useDashboardStats } from '@/hooks/use-dashboard-stats'
import { StatCard } from '@/components/dashboard/StatCard'
import { RevenueChart } from '@/components/dashboard/RevenueChart'
import { Spinner } from '@/components/ui/spinner'
import { formatNumber } from '@/lib/utils'
import { Users, Music, ImageIcon, CreditCard, Zap, Crown } from 'lucide-react'

export default function DashboardPage() {
  const { data: stats, isLoading } = useDashboardStats()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-tertiary text-sm mt-1">Overview of Lovify platform metrics</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Total Users"
          value={formatNumber(stats?.totalUsers ?? 0)}
          icon={<Users className="h-5 w-5" />}
          subtitle={`${formatNumber(stats?.activeToday ?? 0)} active today`}
        />
        <StatCard
          title="Songs Created"
          value={formatNumber(stats?.totalSongs ?? 0)}
          icon={<Music className="h-5 w-5" />}
        />
        <StatCard
          title="Visions Created"
          value={formatNumber(stats?.totalVisions ?? 0)}
          icon={<ImageIcon className="h-5 w-5" />}
        />
        <StatCard
          title="Credits Consumed"
          value={formatNumber(stats?.totalCreditsConsumed ?? 0)}
          icon={<Zap className="h-5 w-5" />}
        />
        <StatCard
          title="Active Subscriptions"
          value={formatNumber(stats?.activeSubscriptions ?? 0)}
          icon={<Crown className="h-5 w-5" />}
        />
        <StatCard
          title="MRR (Est.)"
          value={`$${((stats?.activeSubscriptions ?? 0) * 14.99).toFixed(0)}`}
          icon={<CreditCard className="h-5 w-5" />}
          subtitle="Based on $14.99/mo avg"
        />
      </div>

      {/* Revenue Chart */}
      <RevenueChart />
    </div>
  )
}
