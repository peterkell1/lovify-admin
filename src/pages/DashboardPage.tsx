import {
  useTotalUsers,
  useActiveToday,
  useTotalSongs,
  useTotalVisions,
  useCreditsConsumed,
  useActiveSubscriptions,
} from '@/hooks/use-dashboard-stats'
import { LiveStatCard } from '@/components/dashboard/LiveStatCard'
import { RevenueChart } from '@/components/dashboard/RevenueChart'
import { Users, Music, ImageIcon, CreditCard, Zap, Crown } from 'lucide-react'

export default function DashboardPage() {
  const totalUsers = useTotalUsers()
  const activeToday = useActiveToday()
  const totalSongs = useTotalSongs()
  const totalVisions = useTotalVisions()
  const creditsConsumed = useCreditsConsumed()
  const activeSubs = useActiveSubscriptions()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-tertiary text-sm mt-1">Overview of Lovify platform metrics</p>
      </div>

      {/* KPI Grid — each card loads independently */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <LiveStatCard
          title="Total Users"
          value={totalUsers.data}
          isLoading={totalUsers.isLoading}
          icon={<Users className="h-5 w-5" />}
          subtitle={activeToday.isLoading ? undefined : `${activeToday.data ?? 0} active today`}
        />
        <LiveStatCard
          title="Songs Created"
          value={totalSongs.data}
          isLoading={totalSongs.isLoading}
          icon={<Music className="h-5 w-5" />}
        />
        <LiveStatCard
          title="Visions Created"
          value={totalVisions.data}
          isLoading={totalVisions.isLoading}
          icon={<ImageIcon className="h-5 w-5" />}
        />
        <LiveStatCard
          title="Credits Consumed"
          value={creditsConsumed.data}
          isLoading={creditsConsumed.isLoading}
          icon={<Zap className="h-5 w-5" />}
        />
        <LiveStatCard
          title="Active Subscriptions"
          value={activeSubs.data}
          isLoading={activeSubs.isLoading}
          icon={<Crown className="h-5 w-5" />}
        />
        <LiveStatCard
          title="MRR (Est.)"
          value={activeSubs.data ? activeSubs.data * 14.99 : undefined}
          isLoading={activeSubs.isLoading}
          icon={<CreditCard className="h-5 w-5" />}
          format={(n) => `$${n.toFixed(0)}`}
        />
      </div>

      {/* Revenue Chart — has its own loading internally */}
      <RevenueChart />
    </div>
  )
}
