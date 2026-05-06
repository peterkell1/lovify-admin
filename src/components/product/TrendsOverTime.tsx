import { useState, useMemo } from 'react'
import {
  Line,
  ComposedChart,
  Bar,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useDailyTrend, type DailyTrendPoint } from '@/hooks/use-daily-trend'
import {
  useReleaseAnnotations,
  useDeleteReleaseAnnotation,
  type ReleaseAnnotation,
} from '@/hooks/use-release-annotations'
import type { ProductFilters } from '@/hooks/use-product-dashboard'
import { AddReleaseDialog } from './AddReleaseDialog'
import { Plus, Tag, Trash2, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

const RANGES = [
  { id: '14d' as const, label: '14d', days: 14 },
  { id: '30d' as const, label: '30d', days: 30 },
  { id: '60d' as const, label: '60d', days: 60 },
  { id: '90d' as const, label: '90d', days: 90 },
]

type RangeId = (typeof RANGES)[number]['id']

interface Series {
  key: keyof DailyTrendPoint
  label: string
  color: string
  isPercent: boolean
  /** Render as bar (count) instead of line (rate). */
  asBar?: boolean
}

const ALL_SERIES: Series[] = [
  { key: 'signups', label: 'Daily signups', color: 'hsl(220 70% 55%)', isPercent: false, asBar: true },
  { key: 'sameDaySongPct', label: 'Made song same day', color: 'hsl(15 85% 60%)', isPercent: true },
  { key: 'signupToFirstSongPct', label: 'Made song (any time)', color: 'hsl(15 85% 60% / 0.5)', isPercent: true },
  { key: 'signupToFirstVisionPct', label: 'Made vision (any time)', color: 'hsl(265 60% 55%)', isPercent: true },
  { key: 'signupToSubscribePct', label: 'Subscribed', color: 'hsl(142 76% 36%)', isPercent: true },
]

const KIND_COLORS: Record<string, string> = {
  release: 'hsl(15 85% 60%)',
  feature: 'hsl(220 70% 55%)',
  fix: 'hsl(265 60% 55%)',
  experiment: 'hsl(45 95% 50%)',
  marketing: 'hsl(330 80% 55%)',
  infra: 'hsl(195 70% 45%)',
  incident: 'hsl(0 80% 55%)',
}

function pct(n: number) {
  return `${(n * 100).toFixed(1)}%`
}

interface Props {
  filters: ProductFilters
}

export function TrendsOverTime({ filters }: Props) {
  const [rangeId, setRangeId] = useState<RangeId>('30d')
  const [activeSeriesKeys, setActiveSeriesKeys] = useState<Set<string>>(
    () => new Set(['signups', 'sameDaySongPct', 'signupToSubscribePct'])
  )
  const [addOpen, setAddOpen] = useState(false)

  const range = RANGES.find((r) => r.id === rangeId)!

  const trend = useDailyTrend({
    days: range.days,
    excludeTestUsers: filters.excludeTestUsers,
  })
  const sinceForReleases = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() - range.days)
    return d.toISOString()
  }, [range.days])
  const releases = useReleaseAnnotations({ since: sinceForReleases })

  const activeSeries = ALL_SERIES.filter((s) => activeSeriesKeys.has(s.key))

  const toggleSeries = (key: string) => {
    setActiveSeriesKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-base font-semibold text-foreground">
            Did our last push move the needle?
          </h3>
          <p className="text-xs text-tertiary mt-0.5">
            Daily metrics with vertical markers at every release. Hover a marker to see what
            shipped that day.
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)} size="sm" className="h-8">
          <Plus className="h-3.5 w-3.5 mr-1" />
          Log a release
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <CardTitle className="text-sm">Daily trend</CardTitle>
            <div className="flex items-center gap-1 bg-secondary rounded-xl p-1">
              {RANGES.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setRangeId(r.id)}
                  className={cn(
                    'px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer',
                    rangeId === r.id
                      ? 'bg-card text-foreground shadow-soft'
                      : 'text-tertiary hover:text-foreground'
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Series toggles */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {ALL_SERIES.map((s) => {
              const active = activeSeriesKeys.has(s.key)
              return (
                <button
                  key={s.key}
                  onClick={() => toggleSeries(s.key)}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all cursor-pointer',
                    active
                      ? 'bg-card text-foreground border-border shadow-soft'
                      : 'bg-transparent text-tertiary border-border/40 hover:text-foreground'
                  )}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: active ? s.color : 'transparent', border: `1px solid ${s.color}` }}
                  />
                  {s.label}
                </button>
              )
            })}
          </div>
        </CardHeader>
        <CardContent>
          {trend.isLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : !trend.data || trend.data.length === 0 ? (
            <p className="text-xs text-tertiary py-12 text-center">No data in this window.</p>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <ComposedChart data={trend.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(30 15% 92%)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: 'hsl(27 7% 48%)' }}
                  tickFormatter={(v) => format(parseISO(v), 'MMM d')}
                />
                {/* Left axis: counts (bars) */}
                <YAxis
                  yAxisId="count"
                  orientation="left"
                  tick={{ fontSize: 11, fill: 'hsl(27 7% 48%)' }}
                  allowDecimals={false}
                />
                {/* Right axis: percentages (lines) */}
                <YAxis
                  yAxisId="pct"
                  orientation="right"
                  tick={{ fontSize: 11, fill: 'hsl(27 7% 48%)' }}
                  tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                  domain={[0, 1]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(25 100% 97%)',
                    border: '1px solid hsl(30 15% 92%)',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                  labelFormatter={(label) => format(parseISO(label as string), 'MMM d, yyyy')}
                  formatter={(value, name) => {
                    const isPercent = ALL_SERIES.find((s) => s.label === name)?.isPercent
                    return isPercent
                      ? [pct(Number(value)), name]
                      : [Number(value).toLocaleString(), name]
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />

                {activeSeries.map((s) =>
                  s.asBar ? (
                    <Bar
                      key={s.key}
                      yAxisId="count"
                      dataKey={s.key}
                      name={s.label}
                      fill={s.color}
                      fillOpacity={0.6}
                      radius={[4, 4, 0, 0]}
                    />
                  ) : (
                    <Line
                      key={s.key}
                      yAxisId="pct"
                      type="monotone"
                      dataKey={s.key}
                      name={s.label}
                      stroke={s.color}
                      strokeWidth={2}
                      dot={false}
                      connectNulls
                    />
                  )
                )}

                {(releases.data ?? []).map((rel) => {
                  const day = rel.occurred_at.split('T')[0]
                  const color = KIND_COLORS[rel.kind] ?? 'hsl(15 85% 60%)'
                  return (
                    <ReferenceLine
                      key={rel.id}
                      yAxisId="pct"
                      x={day}
                      stroke={color}
                      strokeDasharray="3 3"
                      label={{
                        value: rel.title.length > 18 ? rel.title.slice(0, 18) + '…' : rel.title,
                        position: 'top',
                        fontSize: 9,
                        fill: color,
                      }}
                    />
                  )
                })}
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Releases list below the chart */}
      <ReleaseList
        releases={releases.data ?? []}
        isLoading={releases.isLoading}
      />

      <AddReleaseDialog open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  )
}

function ReleaseList({
  releases,
  isLoading,
}: {
  releases: ReleaseAnnotation[]
  isLoading: boolean
}) {
  const del = useDeleteReleaseAnnotation()
  if (isLoading) return null
  if (releases.length === 0) {
    return (
      <p className="mt-3 text-[11px] text-tertiary">
        No releases logged yet. Tag your next deploy with{' '}
        <strong className="text-foreground">"Log a release"</strong> above and it'll show up as a
        marker on the chart.
      </p>
    )
  }
  return (
    <div className="mt-4">
      <p className="text-[11px] uppercase tracking-wider font-semibold text-tertiary mb-2">
        Releases in this window
      </p>
      <div className="space-y-1">
        {releases.map((r) => {
          const color = KIND_COLORS[r.kind] ?? 'hsl(15 85% 60%)'
          return (
            <div
              key={r.id}
              className="flex items-center gap-3 px-3 py-2 rounded-lg border border-border bg-card text-xs"
            >
              <Tag className="h-3 w-3 shrink-0" style={{ color }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-foreground truncate">{r.title}</span>
                  <span
                    className="px-1.5 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider"
                    style={{
                      backgroundColor: `${color}1a`,
                      color,
                    }}
                  >
                    {r.kind}
                  </span>
                  <span className="text-[11px] text-tertiary">
                    {format(parseISO(r.occurred_at), 'MMM d, yyyy · h:mm a')}
                  </span>
                </div>
                {r.description && (
                  <p className="text-[11px] text-muted-foreground mt-0.5">{r.description}</p>
                )}
              </div>
              {r.external_url && (
                <a
                  href={r.external_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-tertiary hover:text-accent inline-flex items-center gap-1 text-[11px]"
                >
                  Link <ExternalLink className="h-3 w-3" />
                </a>
              )}
              <button
                onClick={() => del.mutate(r.id)}
                className="h-6 w-6 inline-flex items-center justify-center rounded-md text-tertiary hover:text-rose-700 hover:bg-rose-50 transition-colors"
                title="Remove"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
