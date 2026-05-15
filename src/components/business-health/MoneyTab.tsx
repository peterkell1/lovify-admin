import {
  useCurrentMrr,
  useMrrGrowth,
  useNetRevenueRetention,
  useGrossMargin,
  useMonthlyChurn,
  useMrrTrend,
  type DateRange,
} from '@/hooks/use-business-health'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { format, parseISO } from 'date-fns'

interface MoneyTabProps {
  range: DateRange
}

const formatMrr = (cents: number): string => {
  const dollars = cents / 100
  if (dollars >= 1_000_000) return `$${(dollars / 1_000_000).toFixed(2)}M`
  if (dollars >= 10_000) return `$${(dollars / 1_000).toFixed(1)}K`
  return `$${dollars.toFixed(2)}`
}

const formatPct = (pct: number, digits = 1): string => {
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(digits)}%`
}

const ChangeIndicator = ({ pct, inverse = false }: { pct: number; inverse?: boolean }) => {
  const positive = inverse ? pct < 0 : pct > 0
  const negative = inverse ? pct > 0 : pct < 0
  const colorClass = positive ? 'text-success' : negative ? 'text-destructive' : 'text-tertiary'
  const Icon = pct > 0 ? TrendingUp : pct < 0 ? TrendingDown : Minus
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-medium', colorClass)}>
      <Icon className="h-3 w-3" />
      {formatPct(pct)}
    </span>
  )
}

interface HeroProps {
  loading: boolean
  mrrCents: number
  activeCount: number
  growthPct: number
}

const MrrHero = ({ loading, mrrCents, activeCount, growthPct }: HeroProps) => {
  return (
    <Card>
      <CardContent className="p-6">
        <p className="text-xs font-semibold text-tertiary uppercase tracking-wider">Monthly Recurring Revenue</p>
        {loading ? (
          <>
            <Skeleton className="h-10 w-40 mt-2" />
            <Skeleton className="h-4 w-32 mt-2" />
          </>
        ) : (
          <>
            <div className="mt-1.5 flex items-baseline gap-3">
              <p className="text-4xl font-bold text-foreground">{formatMrr(mrrCents)}</p>
              <ChangeIndicator pct={growthPct} />
            </div>
            <p className="text-xs text-tertiary mt-2">
              From {activeCount.toLocaleString()} active {activeCount === 1 ? 'subscription' : 'subscriptions'} · vs prior 30 days
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}

interface TileProps {
  title: string
  loading: boolean
  value: string
  subtitle?: string
  changePct?: number
  inverseChange?: boolean
}

const Tile = ({ title, loading, value, subtitle, changePct, inverseChange }: TileProps) => {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-xs font-semibold text-tertiary uppercase tracking-wider">{title}</p>
        {loading ? (
          <>
            <Skeleton className="h-7 w-24 mt-2" />
            <Skeleton className="h-3 w-20 mt-2" />
          </>
        ) : (
          <>
            <div className="mt-1.5 flex items-baseline gap-2">
              <p className="text-2xl font-bold text-foreground">{value}</p>
              {changePct !== undefined && <ChangeIndicator pct={changePct} inverse={inverseChange} />}
            </div>
            {subtitle && <p className="text-xs text-tertiary mt-1">{subtitle}</p>}
          </>
        )}
      </CardContent>
    </Card>
  )
}

const daysInRange = (range: DateRange): number => {
  const from = new Date(range.from)
  const to = new Date(range.to)
  const ms = to.getTime() - from.getTime()
  return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)))
}

const rangeLabel = (days: number): string => {
  if (days <= 7) return 'Last 7 days'
  if (days <= 30) return 'Last 30 days'
  if (days <= 90) return 'Last 90 days'
  if (days <= 365) return 'Last 12 months'
  return `Last ${days} days`
}

export const MoneyTab = ({ range }: MoneyTabProps) => {
  const days = daysInRange(range)
  const mrr = useCurrentMrr()
  const growth = useMrrGrowth()
  const nrr = useNetRevenueRetention()
  const margin = useGrossMargin(range)
  const churn = useMonthlyChurn()
  const trend = useMrrTrend(days)

  const tooltipStyle = {
    backgroundColor: 'hsl(25 100% 97%)',
    border: '1px solid hsl(30 15% 92%)',
    borderRadius: '12px',
    fontSize: '13px',
    padding: '8px 12px',
  }

  const chartData = (trend.data ?? []).map((p) => ({
    date: p.date,
    mrr: p.mrrCents / 100,
  }))

  return (
    <div className="space-y-6">
      {/* MRR hero */}
      <MrrHero
        loading={mrr.isLoading || growth.isLoading}
        mrrCents={mrr.data?.mrrCents ?? 0}
        activeCount={mrr.data?.activeCount ?? 0}
        growthPct={growth.data?.growthPct ?? 0}
      />

      {/* Tile row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Tile
          title="MRR Growth (30d)"
          loading={growth.isLoading}
          value={formatPct(growth.data?.growthPct ?? 0)}
          subtitle={
            growth.data
              ? `${formatMrr(growth.data.priorCents)} → ${formatMrr(growth.data.currentCents)}`
              : undefined
          }
        />
        <Tile
          title="Net Revenue Retention"
          loading={nrr.isLoading}
          value={`${(nrr.data?.nrrPct ?? 0).toFixed(1)}%`}
          subtitle={
            nrr.data
              ? `90-day cohort · ${nrr.data.cohortSize.toLocaleString()} subs`
              : undefined
          }
        />
        <Tile
          title="Gross Margin"
          loading={margin.isLoading}
          value={`${(margin.data?.marginPct ?? 0).toFixed(1)}%`}
          subtitle={
            margin.data
              ? `$${margin.data.grossProfit.toFixed(2)} profit`
              : undefined
          }
        />
        <Tile
          title="Monthly Churn"
          loading={churn.isLoading}
          value={`${(churn.data?.churnPct ?? 0).toFixed(1)}%`}
          subtitle={
            churn.data
              ? `${churn.data.cancelledCount} of ${churn.data.activeAtCutoffCount} subs`
              : undefined
          }
        />
      </div>

      {/* MRR trend (window matches active date range) */}
      <Card>
        <CardHeader>
          <CardTitle>MRR — {rangeLabel(days)}</CardTitle>
        </CardHeader>
        <CardContent>
          {trend.isLoading ? (
            <Skeleton className="h-[280px] w-full rounded-lg" />
          ) : chartData.length === 0 ? (
            <p className="text-sm text-tertiary text-center py-12">No subscription history yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="mrr-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(15 85% 60%)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(15 85% 60%)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(30 15% 92%)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: 'hsl(27 7% 48%)' }}
                  tickFormatter={(v) => format(parseISO(v), 'MMM d')}
                  interval="preserveStartEnd"
                  minTickGap={48}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'hsl(27 7% 48%)' }}
                  tickFormatter={(v) => `$${v}`}
                  width={56}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v) => [`$${Number(v).toFixed(2)}`, 'MRR']}
                  labelFormatter={(l) => format(parseISO(l as string), 'MMM d, yyyy')}
                />
                <Area
                  type="monotone"
                  dataKey="mrr"
                  stroke="hsl(15 85% 60%)"
                  strokeWidth={2}
                  fill="url(#mrr-fill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
