import { useMemo } from 'react'
import { useAICosts } from '@/hooks/use-finance'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { StatCard } from '@/components/dashboard/StatCard'
import { SkeletonCard, SkeletonChart } from '@/components/ui/skeleton'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Cpu, DollarSign, Layers, Activity } from 'lucide-react'
import {
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { format, parseISO } from 'date-fns'

const COST_TYPE_COLORS: Record<string, string> = {
  image_generation: 'hsl(15 85% 60%)',
  video_generation: 'hsl(262 83% 58%)',
  music_generation: 'hsl(142 76% 36%)',
  text_generation: 'hsl(38 92% 50%)',
}

export function AICostsTab() {
  const { data: costs, isLoading } = useAICosts(30)

  const analytics = useMemo(() => {
    if (!costs) return null

    const totalCost = costs.reduce((s, c) => s + c.cost_usd, 0)
    const totalItems = costs.length

    // By cost type
    const typeMap = new Map<string, { count: number; cost: number }>()
    for (const c of costs) {
      const entry = typeMap.get(c.cost_type) ?? { count: 0, cost: 0 }
      entry.count += 1
      entry.cost += c.cost_usd
      typeMap.set(c.cost_type, entry)
    }
    const byCostType = Array.from(typeMap.entries())
      .map(([type, data]) => ({ type, ...data, pct: totalCost > 0 ? (data.cost / totalCost) * 100 : 0 }))
      .sort((a, b) => b.cost - a.cost)

    // By model
    const modelMap = new Map<string, { count: number; cost: number }>()
    for (const c of costs) {
      const entry = modelMap.get(c.model_name) ?? { count: 0, cost: 0 }
      entry.count += 1
      entry.cost += c.cost_usd
      modelMap.set(c.model_name, entry)
    }
    const byModel = Array.from(modelMap.entries())
      .map(([model, data]) => ({ model, ...data }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 10)

    // Daily trend
    const dayMap = new Map<string, { image: number; video: number; music: number; text: number }>()
    for (const c of costs) {
      const day = c.created_at.split('T')[0]
      const entry = dayMap.get(day) ?? { image: 0, video: 0, music: 0, text: 0 }
      if (c.cost_type.includes('image')) entry.image += c.cost_usd
      else if (c.cost_type.includes('video')) entry.video += c.cost_usd
      else if (c.cost_type.includes('music')) entry.music += c.cost_usd
      else entry.text += c.cost_usd
      dayMap.set(day, entry)
    }
    const dailyTrend = Array.from(dayMap.entries())
      .map(([date, data]) => ({ date, ...data, total: data.image + data.video + data.music + data.text }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Today
    const today = new Date().toISOString().split('T')[0]
    const todayCost = costs.filter((c) => c.created_at.startsWith(today)).reduce((s, c) => s + c.cost_usd, 0)

    return { totalCost, totalItems, todayCost, byCostType, byModel, dailyTrend }
  }, [costs])

  if (isLoading || !analytics) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <SkeletonChart />
      </div>
    )
  }

  const tooltipStyle = {
    backgroundColor: 'hsl(25 100% 97%)',
    border: '1px solid hsl(30 15% 92%)',
    borderRadius: '12px',
    fontSize: '13px',
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Cost (30d)" value={`$${analytics.totalCost.toFixed(2)}`} icon={<DollarSign className="h-5 w-5" />} />
        <StatCard title="Total Requests" value={analytics.totalItems.toLocaleString()} icon={<Layers className="h-5 w-5" />} />
        <StatCard title="Today's Cost" value={`$${analytics.todayCost.toFixed(2)}`} icon={<Activity className="h-5 w-5" />} />
        <StatCard title="Avg Cost/Request" value={`$${analytics.totalItems > 0 ? (analytics.totalCost / analytics.totalItems).toFixed(4) : '0'}`} icon={<Cpu className="h-5 w-5" />} />
      </div>

      {/* Stacked daily cost chart */}
      <Card>
        <CardHeader><CardTitle>Daily AI Costs by Type</CardTitle></CardHeader>
        <CardContent>
          {analytics.dailyTrend.length === 0 ? (
            <p className="text-sm text-tertiary text-center py-12">No cost data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.dailyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(30 15% 92%)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(27 7% 48%)' }} tickFormatter={(v) => format(parseISO(v), 'MMM d')} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(27 7% 48%)' }} tickFormatter={(v) => `$${v}`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`$${Number(v).toFixed(4)}`, '']} labelFormatter={(l) => format(parseISO(l as string), 'MMM d, yyyy')} />
                <Legend />
                <Bar dataKey="image" stackId="a" fill={COST_TYPE_COLORS.image_generation} name="Image" radius={[0, 0, 0, 0]} />
                <Bar dataKey="video" stackId="a" fill={COST_TYPE_COLORS.video_generation} name="Video" />
                <Bar dataKey="music" stackId="a" fill={COST_TYPE_COLORS.music_generation} name="Music" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* By cost type */}
        <Card>
          <CardHeader><CardTitle>By Cost Type</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.byCostType.map((t) => (
                <div key={t.type} className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium">{t.type.replace(/_/g, ' ')}</span>
                    <span className="text-xs text-tertiary ml-2">({t.count})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-accent rounded-full" style={{ width: `${t.pct}%` }} />
                    </div>
                    <span className="text-sm font-mono w-20 text-right">${t.cost.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* By model */}
        <Card>
          <CardHeader><CardTitle>Top Models by Cost</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Model</TableHead>
                  <TableHead className="text-right">Requests</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics.byModel.map((m) => (
                  <TableRow key={m.model}>
                    <TableCell><Badge variant="outline" className="text-xs font-mono">{m.model}</Badge></TableCell>
                    <TableCell className="text-right text-sm">{m.count}</TableCell>
                    <TableCell className="text-right text-sm font-mono">${m.cost.toFixed(4)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
