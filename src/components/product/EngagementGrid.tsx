import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  usePlaysDistribution,
  useReListenRate,
  useSongsPerActiveUser,
  useCohortSummary,
  type ProductFilters,
} from '@/hooks/use-product-dashboard'
import { MissingDataCard } from './MissingDataCard'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CheckCircle2, AlertTriangle, AlertCircle, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AiInsightPanel } from './AiInsightPanel'
import type { MetricContext } from '@/lib/cro-prompts'

function ChartCard({
  question,
  goal,
  goodWhen,
  children,
  onAskAi,
}: {
  question: string
  goal: string
  goodWhen: string
  children: React.ReactNode
  onAskAi?: () => void
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">{question}</CardTitle>
        <p className="text-[11px] text-tertiary mt-0.5 leading-snug">{goodWhen}</p>
      </CardHeader>
      <CardContent>
        {children}
        <p className="text-[11px] text-emerald-700 font-medium mt-3">🎯 {goal}</p>
        {onAskAi && (
          <button
            onClick={onAskAi}
            className="mt-3 w-full flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-[11px] font-medium border border-accent/20 bg-accent/5 text-accent hover:bg-accent/15 transition-colors cursor-pointer"
          >
            <Sparkles className="h-3 w-3" />
            Ask AI why
          </button>
        )}
      </CardContent>
    </Card>
  )
}

function StatusBadge({ status }: { status: 'good' | 'ok' | 'bad' }) {
  if (status === 'good') {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold">
        <CheckCircle2 className="h-2.5 w-2.5" />
        HEALTHY
      </span>
    )
  }
  if (status === 'ok') {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-semibold">
        <AlertTriangle className="h-2.5 w-2.5" />
        WORK NEEDED
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-semibold">
      <AlertCircle className="h-2.5 w-2.5" />
      CRITICAL
    </span>
  )
}

function PlaysPerSongChart({ filters }: { filters: ProductFilters }) {
  const { data, isLoading } = usePlaysDistribution(filters)
  if (isLoading) return <Skeleton className="h-[200px] w-full" />
  if (!data || data.every((b) => b.count === 0)) {
    return <p className="text-xs text-tertiary py-12 text-center">No songs in this cohort.</p>
  }
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(30 15% 92%)" />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'hsl(27 7% 48%)' }} />
        <YAxis tick={{ fontSize: 11, fill: 'hsl(27 7% 48%)' }} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(25 100% 97%)',
            border: '1px solid hsl(30 15% 92%)',
            borderRadius: '12px',
            fontSize: '13px',
          }}
        />
        <Bar dataKey="count" name="Songs" fill="hsl(15 85% 60%)" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

function ReListenCard({ filters }: { filters: ProductFilters }) {
  const { data, isLoading } = useReListenRate(filters)
  if (isLoading) return <Skeleton className="h-[200px] w-full" />
  const rate = data?.rate ?? 0
  let status: 'good' | 'ok' | 'bad' = 'bad'
  if (rate >= 0.3) status = 'good'
  else if (rate >= 0.2) status = 'ok'

  return (
    <div className="h-[200px] flex flex-col justify-center">
      <div className="flex items-center gap-2 mb-2">
        <StatusBadge status={status} />
      </div>
      <p className={cn('text-5xl font-bold tracking-tight', status === 'good' ? 'text-emerald-700' : status === 'ok' ? 'text-amber-700' : 'text-rose-700')}>
        {(rate * 100).toFixed(0)}%
      </p>
      <p className="text-xs text-muted-foreground mt-2">
        {data?.reListened.toLocaleString() ?? 0} of {data?.totalSongs.toLocaleString() ?? 0} songs
        played 3+ times by their creator
      </p>
    </div>
  )
}

function SongsPerActiveUserCard({ filters }: { filters: ProductFilters }) {
  const { data, isLoading } = useSongsPerActiveUser(filters)
  if (isLoading) return <Skeleton className="h-[200px] w-full" />
  const ratio = data?.ratio ?? 0
  const noData = (data?.activeUsers ?? 0) === 0

  if (noData) {
    return (
      <div className="h-[200px] flex flex-col justify-center">
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-semibold">
            <AlertTriangle className="h-2.5 w-2.5" />
            NO DATA YET
          </span>
        </div>
        <p className="text-5xl font-bold tracking-tight text-muted-foreground/60">—</p>
        <p className="text-xs text-muted-foreground mt-2">
          {data?.songsCreated.toLocaleString() ?? 0} new songs were made, but we can't tell how
          many users were active because the app isn't logging sessions yet.
        </p>
        <p className="text-[11px] text-slate-600 mt-2 leading-snug">
          ⚙️ One-line fix in lovifymusic to start writing user_sessions on app open.
        </p>
      </div>
    )
  }

  let status: 'good' | 'ok' | 'bad' = 'bad'
  if (ratio >= 0.5) status = 'good'
  else if (ratio >= 0.2) status = 'ok'

  return (
    <div className="h-[200px] flex flex-col justify-center">
      <div className="flex items-center gap-2 mb-2">
        <StatusBadge status={status} />
      </div>
      <p className={cn('text-5xl font-bold tracking-tight', status === 'good' ? 'text-emerald-700' : status === 'ok' ? 'text-amber-700' : 'text-rose-700')}>
        {ratio.toFixed(2)}
      </p>
      <p className="text-xs text-muted-foreground mt-2">
        {data?.songsCreated.toLocaleString() ?? 0} new songs ÷{' '}
        {data?.activeUsers.toLocaleString() ?? 0} active users (last 28 days)
      </p>
    </div>
  )
}

export function EngagementGrid({ filters }: { filters: ProductFilters }) {
  const summary = useCohortSummary(filters)
  const reListen = useReListenRate(filters)
  const songsPerActive = useSongsPerActiveUser(filters)
  const plays = usePlaysDistribution(filters)
  const [aiContext, setAiContext] = useState<MetricContext | null>(null)

  const baseCtx = (overrides: Partial<MetricContext> & {
    question: string
    metric: string
    currentValue: string
    healthyRange: string
    status: string
  }): MetricContext => ({
    cohortFrom: filters.cohortFrom,
    cohortTo: filters.cohortTo,
    cohortSize: summary.data?.users.length ?? 0,
    excludedTestUsers: summary.data?.excludedTestUsers,
    manuallyExcluded: summary.data?.manuallyExcluded,
    ...overrides,
  })

  return (
    <div>
      <div className="mb-3">
        <h3 className="text-base font-semibold text-foreground">
          Are users actually using the app?
        </h3>
        <p className="text-xs text-tertiary mt-0.5">
          Creating a song doesn't matter if no one listens to it. These metrics show whether
          users are getting real value.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <ChartCard
          question="Are users replaying their songs?"
          goodWhen="Big bars on the right (3+, 6+, 26+) = users come back to favorites. Big bar at 0–1 = songs aren't resonating."
          goal="Want most songs played 3+ times"
          onAskAi={() =>
            setAiContext(
              baseCtx({
                question: 'Are users replaying their songs?',
                metric: 'Plays-per-song distribution',
                currentValue: plays.data
                  ? plays.data.map((b) => `${b.label}=${b.count}`).join(' · ')
                  : 'loading',
                healthyRange:
                  'Most songs should land in 3+, 6–10, 11–25, or 26+ buckets. Heavy 0–1 bucket = songs not resonating.',
                status: plays.data ? 'computed' : 'unknown',
              })
            )
          }
        >
          <PlaysPerSongChart filters={filters} />
        </ChartCard>

        <ChartCard
          question="Are users coming back to favorites?"
          goodWhen="The strongest signal that the rewiring is working. If users replay their songs, the product is doing its job."
          goal="Want 30%+ · &lt;30% after 60 days = no core value"
          onAskAi={() =>
            setAiContext(
              baseCtx({
                question: 'Are users coming back to favorites?',
                metric: 'Re-Listen Rate',
                currentValue:
                  reListen.data !== undefined
                    ? `${(reListen.data.rate * 100).toFixed(1)}%`
                    : 'loading',
                healthyRange: '30%+ healthy · <20% means songs aren\'t resonating',
                status:
                  reListen.data === undefined
                    ? 'unknown'
                    : reListen.data.rate >= 0.3
                      ? 'HEALTHY'
                      : reListen.data.rate >= 0.2
                        ? 'WORK NEEDED'
                        : 'CRITICAL',
                numerator: reListen.data?.reListened,
                denominator: reListen.data?.totalSongs,
              })
            )
          }
        >
          <ReListenCard filters={filters} />
        </ChartCard>

        <ChartCard
          question="Are users creating new songs over time?"
          goodWhen="If this drops to 0 after month 2, the product isn't growing with users' goals."
          goal="Want 0.5+ new songs per active user per month"
          onAskAi={() =>
            setAiContext(
              baseCtx({
                question: 'Are users creating new songs over time?',
                metric: 'Songs created per active user (rolling 28d)',
                currentValue:
                  songsPerActive.data?.activeUsers === 0
                    ? '— (NO DATA)'
                    : songsPerActive.data
                      ? songsPerActive.data.ratio.toFixed(2)
                      : 'loading',
                healthyRange: '0.5+ per active user per month',
                status:
                  songsPerActive.data?.activeUsers === 0
                    ? 'NO DATA YET'
                    : songsPerActive.data
                      ? songsPerActive.data.ratio >= 0.5
                        ? 'HEALTHY'
                        : songsPerActive.data.ratio >= 0.2
                          ? 'WORK NEEDED'
                          : 'CRITICAL'
                      : 'unknown',
                isNoData: songsPerActive.data?.activeUsers === 0,
                noDataReason:
                  songsPerActive.data?.activeUsers === 0
                    ? 'Active users denominator is 0 because user_sessions table is empty.'
                    : undefined,
                numerator: songsPerActive.data?.songsCreated,
                denominator: songsPerActive.data?.activeUsers,
              })
            )
          }
        >
          <SongsPerActiveUserCard filters={filters} />
        </ChartCard>

        <MissingDataCard
          title="Are users telling others? (viral coefficient)"
          reason="We don't track shares yet. Once we do, this shows how many new users each existing user brings — the closer to 1.0, the closer to viral growth."
          hint="Add a share_events table + log every share button tap in lovifymusic. Goal: K=0.3 healthy · K=1.0+ is viral."
        />
        <MissingDataCard
          title="Do users skip songs early?"
          reason="We need to log when a user starts a song and when they stop, to detect first-30s skips."
          hint="Capture play_start + play_end events. Goal: skip rate <20%."
        />
        <MissingDataCard
          title="How long is a typical session?"
          reason="We only track daily app opens, not session duration."
          hint="Log session_start + session_end events. Goal: most sessions ≥2 minutes."
        />
        <MissingDataCard
          title="When during the day do users listen?"
          reason="No per-play timestamps yet, so we can't make a time-of-day chart."
          hint="Capture played_at on each listen. Use it to time push notifications."
        />
        <MissingDataCard
          title="Do users open push notifications?"
          reason="No notification send/open events tracked."
          hint="Log notification_sent + notification_opened. Goal: >15% open rate."
        />
      </div>

      <AiInsightPanel
        open={aiContext !== null}
        onClose={() => setAiContext(null)}
        context={aiContext}
      />
    </div>
  )
}
