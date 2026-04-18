import { usePnL } from '@/hooks/use-finance'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { StatCard } from '@/components/dashboard/StatCard'
import { Spinner } from '@/components/ui/spinner'
import { DollarSign, TrendingUp, TrendingDown, Percent } from 'lucide-react'
import {
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { format, parseISO } from 'date-fns'

export function PnLTab() {
  const { data: days, isLoading } = usePnL(30)

  if (isLoading) {
    return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>
  }

  const pnl = days ?? []

  // Totals
  const totalRevenue = pnl.reduce((s, d) => s + Number(d.total_revenue_usd), 0)
  const totalCosts = pnl.reduce((s, d) => s + Number(d.total_costs_usd), 0)
  const grossProfit = totalRevenue - totalCosts
  const margin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0

  // Chart data
  const chartData = pnl.map((d) => ({
    date: d.date,
    revenue: Number(d.total_revenue_usd),
    costs: Number(d.total_costs_usd),
    profit: Number(d.total_revenue_usd) - Number(d.total_costs_usd),
  }))

  // Revenue breakdown (last 30d totals)
  const revBreakdown = [
    { name: 'Subscriptions', value: pnl.reduce((s, d) => s + Number(d.subscription_revenue_usd), 0) },
    { name: 'Credit Packs', value: pnl.reduce((s, d) => s + Number(d.credit_pack_revenue_usd), 0) },
    { name: 'Gifts', value: pnl.reduce((s, d) => s + Number(d.gift_revenue_usd), 0) },
    { name: 'Other', value: pnl.reduce((s, d) => s + Number(d.other_revenue_usd), 0) },
  ].filter((r) => r.value > 0)

  // Cost breakdown
  const costBreakdown = [
    { name: 'Image Gen', value: pnl.reduce((s, d) => s + Number(d.image_costs_usd), 0), count: pnl.reduce((s, d) => s + d.image_count, 0) },
    { name: 'Video Gen', value: pnl.reduce((s, d) => s + Number(d.video_costs_usd), 0), count: pnl.reduce((s, d) => s + d.video_count, 0) },
    { name: 'Music Gen', value: pnl.reduce((s, d) => s + Number(d.music_costs_usd), 0), count: pnl.reduce((s, d) => s + d.song_count, 0) },
    { name: 'Text/LLM', value: pnl.reduce((s, d) => s + Number(d.text_costs_usd), 0), count: pnl.reduce((s, d) => s + d.token_count, 0) },
  ]

  const tooltipStyle = {
    backgroundColor: 'hsl(25 100% 97%)',
    border: '1px solid hsl(30 15% 92%)',
    borderRadius: '12px',
    fontSize: '13px',
  }

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Revenue (30d)"
          value={`$${totalRevenue.toFixed(2)}`}
          icon={<DollarSign className="h-5 w-5" />}
        />
        <StatCard
          title="Costs (30d)"
          value={`$${totalCosts.toFixed(2)}`}
          icon={<TrendingDown className="h-5 w-5" />}
        />
        <StatCard
          title="Gross Profit"
          value={`$${grossProfit.toFixed(2)}`}
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <StatCard
          title="Margin"
          value={`${margin.toFixed(1)}%`}
          icon={<Percent className="h-5 w-5" />}
          subtitle={margin < 50 ? 'Below 50% target' : 'Healthy'}
        />
      </div>

      {margin > 0 && margin < 50 && (
        <div className="bg-warning/10 border border-warning/30 rounded-xl p-4 text-sm text-warning font-medium">
          Margin is {margin.toFixed(1)}% — below the 50% target. Review cost breakdown below.
        </div>
      )}

      {/* Revenue vs Costs chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue vs Costs (Daily)</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <p className="text-sm text-tertiary text-center py-12">No profit & loss data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(30 15% 92%)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(27 7% 48%)' }} tickFormatter={(v) => format(parseISO(v), 'MMM d')} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(27 7% 48%)' }} tickFormatter={(v) => `$${v}`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`$${Number(v).toFixed(2)}`, '']} labelFormatter={(l) => format(parseISO(l as string), 'MMM d, yyyy')} />
                <Legend />
                <Area type="monotone" dataKey="revenue" stroke="hsl(142 76% 36%)" fill="hsl(142 76% 36% / 0.1)" name="Revenue" />
                <Area type="monotone" dataKey="costs" stroke="hsl(9 98% 47%)" fill="hsl(9 98% 47% / 0.08)" name="Costs" />
                <Area type="monotone" dataKey="profit" stroke="hsl(15 85% 60%)" fill="hsl(15 85% 60% / 0.1)" name="Profit" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Breakdown (30d)</CardTitle>
          </CardHeader>
          <CardContent>
            {revBreakdown.length === 0 ? (
              <p className="text-sm text-tertiary text-center py-6">No revenue data</p>
            ) : (
              <div className="space-y-3">
                {revBreakdown.map((r) => (
                  <div key={r.name} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{r.name}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-success rounded-full" style={{ width: `${totalRevenue > 0 ? (r.value / totalRevenue) * 100 : 0}%` }} />
                      </div>
                      <span className="text-sm font-mono w-20 text-right">${r.value.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cost breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Cost Breakdown (30d)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {costBreakdown.map((c) => (
                <div key={c.name} className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium">{c.name}</span>
                    <span className="text-xs text-tertiary ml-2">({c.count.toLocaleString()} {c.name === 'Text/LLM' ? 'tokens' : 'items'})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-destructive/70 rounded-full" style={{ width: `${totalCosts > 0 ? (c.value / totalCosts) * 100 : 0}%` }} />
                    </div>
                    <span className="text-sm font-mono w-20 text-right">${c.value.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
