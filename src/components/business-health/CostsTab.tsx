import { useMemo } from 'react'
import { useCostRatios, useDailyCostBreakdown, type DateRange } from '@/hooks/use-business-health'
import { useAICosts } from '@/hooks/use-finance'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Info } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { format, parseISO } from 'date-fns'

interface CostsTabProps {
  range: DateRange
}

const FLOW_COLORS = {
  song: 'hsl(142 76% 36%)',
  vision: 'hsl(15 85% 60%)',
  mindMovie: 'hsl(262 83% 58%)',
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

// ─── Tile ───

interface TileProps {
  title: string
  loading: boolean
  value: string
  subtitle?: string
}

const Tile = ({ title, loading, value, subtitle }: TileProps) => {
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
            <p className="text-2xl font-bold mt-1.5 text-foreground">{value}</p>
            {subtitle && <p className="text-xs text-tertiary mt-1">{subtitle}</p>}
          </>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Placeholder Tile (for infra + burn rate) ───

interface PlaceholderTileProps {
  title: string
  note: string
}

const PlaceholderTile = ({ title, note }: PlaceholderTileProps) => {
  return (
    <Card className="border-dashed bg-card/50">
      <CardContent className="p-5">
        <p className="text-xs font-semibold text-tertiary uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-bold mt-1.5 text-tertiary/60">—</p>
        <p className="text-[11px] text-tertiary/70 italic mt-1 flex items-center gap-1">
          <Info className="h-3 w-3" />
          {note}
        </p>
      </CardContent>
    </Card>
  )
}

export const CostsTab = ({ range }: CostsTabProps) => {
  const days = daysInRange(range)
  const ratios = useCostRatios(range)
  const dailyChart = useDailyCostBreakdown(range)
  // useAICosts still pulls raw rows for the top-models table. The 2000-row
  // cap is fine here because we only display the top 10 models — even if
  // older rows fall off the page, the high-cost ones we care about
  // dominate the recent window.
  const aiCosts = useAICosts(days)

  const tooltipStyle = {
    backgroundColor: 'hsl(25 100% 97%)',
    border: '1px solid hsl(30 15% 92%)',
    borderRadius: '12px',
    fontSize: '13px',
    padding: '8px 12px',
  }

  // Fill missing days in the rollup so the bar chart has a continuous
  // x-axis (no holes when nothing was spent on a given day).
  const dailyTrend = useMemo(() => {
    const points = dailyChart.data ?? []
    if (points.length === 0) return points

    const byDate = new Map(points.map((p) => [p.date, p]))
    const start = new Date(range.from)
    const end = new Date(range.to)
    const out: typeof points = []
    const cursor = new Date(start)
    while (cursor <= end) {
      const key = cursor.toISOString().split('T')[0]
      out.push(byDate.get(key) ?? { date: key, song: 0, vision: 0, mindMovie: 0 })
      cursor.setDate(cursor.getDate() + 1)
    }
    return out
  }, [dailyChart.data, range.from, range.to])

  // Top 10 models by spend — straight reduce over raw api_costs.
  const byModel = useMemo(() => {
    const costs = aiCosts.data ?? []
    const modelMap = new Map<string, { count: number; cost: number }>()
    for (const c of costs) {
      const entry = modelMap.get(c.model_name) ?? { count: 0, cost: 0 }
      entry.count += 1
      entry.cost += c.cost_usd
      modelMap.set(c.model_name, entry)
    }
    return Array.from(modelMap.entries())
      .map(([model, data]) => ({ model, ...data }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 10)
  }, [aiCosts.data])

  return (
    <div className="space-y-6">
      {/* Ratio + placeholder tile row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Tile
          title="Cost per Active User"
          loading={ratios.isLoading}
          value={`$${(ratios.data?.costPerUser ?? 0).toFixed(2)}`}
          subtitle={
            ratios.data
              ? `${ratios.data.activeUserCount.toLocaleString()} active · $${ratios.data.totalCostUsd.toFixed(2)} spend`
              : undefined
          }
        />
        <Tile
          title="Cost per Song"
          loading={ratios.isLoading}
          value={`$${(ratios.data?.costPerSong ?? 0).toFixed(3)}`}
          subtitle={
            ratios.data
              ? `${ratios.data.songCount.toLocaleString()} songs generated`
              : undefined
          }
        />
        <Tile
          title="Cost % of Revenue"
          loading={ratios.isLoading}
          value={`${(ratios.data?.costPctOfRevenue ?? 0).toFixed(1)}%`}
          subtitle={
            ratios.data
              ? `$${ratios.data.totalCostUsd.toFixed(2)} of $${ratios.data.totalRevenueUsd.toFixed(2)}`
              : undefined
          }
        />
        <PlaceholderTile
          title="Infra Costs"
          note="Needs Supabase/Vercel entry"
        />
        <PlaceholderTile
          title="Total Burn Rate"
          note="Needs infra costs"
        />
      </div>

      {/* Daily stacked chart */}
      <Card>
        <CardHeader>
          <CardTitle>Daily AI Costs by Flow — {rangeLabel(days)}</CardTitle>
        </CardHeader>
        <CardContent>
          {dailyChart.isLoading ? (
            <Skeleton className="h-75 w-full rounded-lg" />
          ) : dailyTrend.length === 0 ? (
            <p className="text-sm text-tertiary text-center py-12">No cost data in this range</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyTrend}>
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
                  formatter={(v) => [`$${Number(v).toFixed(4)}`, '']}
                  labelFormatter={(l) => format(parseISO(l as string), 'MMM d, yyyy')}
                />
                <Legend />
                <Bar dataKey="song" stackId="a" fill={FLOW_COLORS.song} name="Song" />
                <Bar dataKey="vision" stackId="a" fill={FLOW_COLORS.vision} name="Vision" />
                <Bar dataKey="mindMovie" stackId="a" fill={FLOW_COLORS.mindMovie} name="Mind Movie" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Top models by cost */}
      <Card>
        <CardHeader>
          <CardTitle>Top Models by Cost</CardTitle>
        </CardHeader>
        <CardContent>
          {aiCosts.isLoading ? (
            <Skeleton className="h-48 w-full rounded-lg" />
          ) : byModel.length === 0 ? (
            <p className="text-sm text-tertiary text-center py-6">No model usage in this range</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Model</TableHead>
                  <TableHead className="text-right">Requests</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right">Avg per Request</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byModel.map((m) => (
                  <TableRow key={m.model}>
                    <TableCell>
                      <Badge variant="outline" className="text-xs font-mono">{m.model}</Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm">{m.count.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-sm font-mono">${m.cost.toFixed(4)}</TableCell>
                    <TableCell className="text-right text-sm font-mono text-tertiary">
                      ${(m.cost / Math.max(1, m.count)).toFixed(4)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
