import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useMrr, useGrossMargin, usePnlTrend } from '@/hooks/use-business-health'
import { MetricCard, type MetricStatus } from './MetricCard'
import { MissingDataCard } from '@/components/product/MissingDataCard'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from 'recharts'
import { format, parseISO } from 'date-fns'

function fmtMoney(usd: number): string {
  if (usd >= 1_000_000) return `$${(usd / 1_000_000).toFixed(2)}M`
  if (usd >= 10_000) return `$${(usd / 1_000).toFixed(1)}K`
  return `$${usd.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
}

function fmtPct(p: number): string {
  return `${(p * 100).toFixed(1)}%`
}

function statusForGrowth(growth: number): MetricStatus {
  if (growth >= 0.1) return 'good' // 10%+ MoM
  if (growth >= 0) return 'ok'
  return 'bad'
}

function statusForMargin(margin: number): MetricStatus {
  if (margin >= 0.7) return 'good'
  if (margin >= 0.4) return 'ok'
  return 'bad'
}

export function MoneySection() {
  const mrr = useMrr()
  const margin = useGrossMargin(30)
  const trend = usePnlTrend(90)

  return (
    <div>
      <div className="mb-3">
        <h3 className="text-base font-semibold text-foreground">Are we making money?</h3>
        <p className="text-xs text-tertiary mt-0.5">
          Revenue, growth, and how much of every dollar we keep.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
        <MetricCard
          question="How much money is recurring every month?"
          value={mrr.data ? fmtMoney(mrr.data.mrr) : undefined}
          isLoading={mrr.isLoading}
          detail={
            mrr.data
              ? `${mrr.data.activePayingSubs.toLocaleString()} paying subscribers · $${mrr.data.arpu.toFixed(2)} ARPU`
              : undefined
          }
          plainEnglish="The total monthly value of every active paid subscription. Yearly plans counted as 1/12 per month."
          goal="Want this growing month-over-month"
          status={mrr.data && mrr.data.mrr > 0 ? 'good' : undefined}
        />

        <MetricCard
          question="Is MRR growing?"
          value={mrr.data ? fmtPct(mrr.data.growthPct) : undefined}
          isLoading={mrr.isLoading}
          detail={
            mrr.data
              ? `${fmtMoney(mrr.data.mrr - mrr.data.priorMrr)} change vs 30 days ago`
              : undefined
          }
          plainEnglish="MRR today vs MRR 30 days ago. Positive = growth, negative = shrinking."
          goal="Want 10%+ month-over-month for early-stage"
          status={mrr.data ? statusForGrowth(mrr.data.growthPct) : undefined}
          approxNote="Approximation — uses current sub state. Will be exact once Stripe webhook history is captured."
        />

        <MetricCard
          question="How much of each dollar do we keep?"
          value={margin.data ? fmtPct(margin.data.margin) : undefined}
          isLoading={margin.isLoading}
          detail={
            margin.data
              ? `${fmtMoney(margin.data.revenue)} revenue − ${fmtMoney(margin.data.costs)} costs (last 30d)`
              : undefined
          }
          plainEnglish="Revenue minus AI compute costs, divided by revenue. Doesn't include infra or salaries — those would push it lower."
          goal="Want 70%+ for a SaaS-like business"
          status={margin.data ? statusForMargin(margin.data.margin) : undefined}
          approxNote="Costs only include AI generation costs from api_costs. Infra and ops not included."
        />

        <MissingDataCard
          title="Are existing customers paying us more over time? (NRR)"
          reason="Net revenue retention requires tracking each cohort's MRR month-over-month, including upgrades, downgrades, and churn."
          hint="Add a monthly snapshot job that records MRR per cohort. Once we have 3+ months of snapshots, NRR becomes computable."
        />

        <MissingDataCard
          title="Are we generating cash or burning it?"
          reason="Cash flow needs more than revenue/costs — refunds, deferred revenue, salaries, infra costs, etc."
          hint="Wire Stripe payouts + a manual monthly burn entry into a cash_flow_events table."
        />
      </div>

      {/* Revenue/cost trend chart */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Are we growing on the bottom line?</CardTitle>
          <p className="text-[11px] text-tertiary mt-0.5">
            Revenue (green) and costs (orange) over the last 90 days. The gap = profit.
          </p>
        </CardHeader>
        <CardContent>
          {trend.isLoading ? (
            <Skeleton className="h-[220px] w-full" />
          ) : !trend.data || trend.data.length === 0 ? (
            <p className="text-xs text-tertiary py-12 text-center">
              No revenue/cost data in the last 90 days.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={trend.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(30 15% 92%)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: 'hsl(27 7% 48%)' }}
                  tickFormatter={(v) => format(parseISO(v), 'MMM d')}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'hsl(27 7% 48%)' }}
                  tickFormatter={(v) => `$${v}`}
                />
                <Tooltip
                  formatter={(v) => [`$${Number(v).toFixed(2)}`, '']}
                  labelFormatter={(label) => format(parseISO(label as string), 'MMM d, yyyy')}
                  contentStyle={{
                    backgroundColor: 'hsl(25 100% 97%)',
                    border: '1px solid hsl(30 15% 92%)',
                    borderRadius: '12px',
                    fontSize: '13px',
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(142 76% 36%)"
                  fill="hsl(142 76% 36% / 0.1)"
                  name="Revenue"
                />
                <Area
                  type="monotone"
                  dataKey="cost"
                  stroke="hsl(15 85% 60%)"
                  fill="hsl(15 85% 60% / 0.1)"
                  name="Costs"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
