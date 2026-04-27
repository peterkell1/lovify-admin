import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, TrendingDown } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { useFunnel, useFunnelAnalytics } from '@/hooks/use-funnels'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatNumber } from '@/lib/utils'
import { STEP_TYPE_LABEL } from '@/types/funnels'
import { cn } from '@/lib/utils'

const tooltipStyle = {
  backgroundColor: 'hsl(25 100% 97%)',
  border: '1px solid hsl(30 15% 92%)',
  borderRadius: '12px',
  fontSize: '13px',
}

const formatPct = (n: number) => `${(n * 100).toFixed(1)}%`

export default function FunnelAnalyticsPage() {
  const { id } = useParams<{ id: string }>()
  const { data: funnelData, isLoading: funnelLoading } = useFunnel(id)
  const { data: analytics, isLoading: analyticsLoading } = useFunnelAnalytics(id)

  if (funnelLoading || analyticsLoading || !funnelData || !analytics) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  const { funnel } = funnelData

  // Chart rows: show each step's absolute reach (for the bar chart) plus
  // drop-off pct (for the tooltip) so advertisers can read both at a glance.
  const chartData = analytics.rows.map((r) => ({
    step: r.step_key,
    step_type: STEP_TYPE_LABEL[r.step_type],
    reached: r.reached,
    drop_off_pct: r.drop_off_from_prev * 100,
  }))

  // Biggest drop-off step (for the highlight callout). Skip the first row
  // because "prev" there is `totalSessions`, which produces a misleadingly
  // huge drop if the first step is email-capture.
  const tailRows = analytics.rows.slice(1)
  const biggestDrop = tailRows.length > 0
    ? tailRows.reduce((a, b) => (b.drop_off_from_prev > a.drop_off_from_prev ? b : a))
    : null

  return (
    <div className="space-y-6">
      <Link
        to={`/funnels/${funnel.id}`}
        className="inline-flex items-center gap-2 text-sm text-tertiary hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to funnel
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {funnel.name} — Analytics
        </h1>
        <p className="mt-1 font-mono text-sm text-tertiary">/{funnel.slug}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard
          label="Sessions"
          value={formatNumber(analytics.totalSessions)}
          hint="Unique emails captured"
        />
        <StatCard
          label="Converted"
          value={formatNumber(analytics.converted)}
          valueClass="text-success"
        />
        <StatCard
          label="In progress"
          value={formatNumber(analytics.inProgress)}
          valueClass="text-foreground/80"
        />
        <StatCard
          label="Abandoned"
          value={formatNumber(analytics.abandoned)}
          valueClass="text-destructive"
        />
        <StatCard
          label="Conversion rate"
          value={formatPct(analytics.conversionRate)}
          valueClass={
            analytics.conversionRate >= 0.05
              ? 'text-success'
              : analytics.conversionRate >= 0.02
                ? 'text-warning'
                : 'text-foreground'
          }
        />
      </div>

      {biggestDrop && biggestDrop.drop_off_from_prev > 0.1 ? (
        <Card className="border-warning/40 bg-warning/5">
          <CardContent className="flex items-start gap-3 py-4">
            <TrendingDown className="h-5 w-5 text-warning mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-foreground">
                Biggest drop-off: <span className="font-mono">{biggestDrop.step_key}</span>
              </p>
              <p className="mt-0.5 text-xs text-tertiary">
                {formatPct(biggestDrop.drop_off_from_prev)} of users who reached
                the previous step didn&apos;t answer this one.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Step reach</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 || analytics.totalSessions === 0 ? (
            <p className="py-12 text-center text-sm text-tertiary">
              No sessions yet. Send someone through the funnel to see numbers
              here.
            </p>
          ) : (
            <ResponsiveContainer
              width="100%"
              height={Math.max(220, chartData.length * 36)}
            >
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(30 15% 92%)"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: 'hsl(27 7% 48%)' }}
                />
                <YAxis
                  type="category"
                  dataKey="step"
                  tick={{ fontSize: 12, fill: 'hsl(27 7% 48%)' }}
                  width={140}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v, name) => {
                    if (name === 'reached')
                      return [formatNumber(Number(v)), 'Sessions']
                    return [v, name]
                  }}
                />
                <Bar
                  dataKey="reached"
                  fill="hsl(15 85% 60%)"
                  radius={[0, 6, 6, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Drop-off by step</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-secondary/40 text-xs uppercase tracking-wide text-tertiary">
              <tr>
                <th className="text-left font-medium px-4 py-2">#</th>
                <th className="text-left font-medium px-4 py-2">Step</th>
                <th className="text-left font-medium px-4 py-2">Type</th>
                <th className="text-right font-medium px-4 py-2">Reached</th>
                <th className="text-right font-medium px-4 py-2">
                  % of sessions
                </th>
              </tr>
            </thead>
            <tbody>
              {analytics.rows.map((r) => (
                <tr
                  key={r.step_key}
                  className="border-b border-border last:border-0"
                >
                  <td className="px-4 py-3 text-tertiary">{r.position}</td>
                  <td className="px-4 py-3 font-mono text-xs text-foreground">
                    {r.step_key}
                  </td>
                  <td className="px-4 py-3 text-xs text-tertiary">
                    {STEP_TYPE_LABEL[r.step_type]}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-foreground">
                    {formatNumber(r.reached)}
                  </td>
                  <td className={cn(
                    'px-4 py-3 text-right text-xs font-semibold',
                    r.overall_rate >= 0.8
                      ? 'text-success'
                      : r.overall_rate >= 0.4
                        ? 'text-warning'
                        : 'text-destructive',
                  )}>
                    {formatPct(r.overall_rate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({
  label,
  value,
  hint,
  valueClass,
}: {
  label: string
  value: string
  hint?: string
  valueClass?: string
}) {
  return (
    <div className="rounded-xl bg-card p-4 shadow-sm">
      <p className="text-xs font-medium text-tertiary">{label}</p>
      <p className={cn('mt-1 text-2xl font-bold', valueClass ?? 'text-foreground')}>
        {value}
      </p>
      {hint ? <p className="mt-1 text-[11px] text-tertiary">{hint}</p> : null}
    </div>
  )
}
