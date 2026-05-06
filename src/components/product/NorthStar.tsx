import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Activity, AlertTriangle, Sparkles } from 'lucide-react'
import { AiInsightPanel } from './AiInsightPanel'
import type { MetricContext } from '@/lib/cro-prompts'
import type { ProductFilters } from '@/hooks/use-product-dashboard'
import { useCohortSummary } from '@/hooks/use-product-dashboard'

export function NorthStar({ filters }: { filters: ProductFilters }) {
  const [aiOpen, setAiOpen] = useState(false)
  const summary = useCohortSummary(filters)
  const ctx: MetricContext = {
    question: 'How long are users listening each day?',
    metric: 'Daily Active Listening Minutes per User (DALM)',
    currentValue: '— (NO DATA)',
    healthyRange: 'No fixed target — directionally we want this trending UP week-over-week',
    status: 'NO DATA YET',
    isNoData: true,
    noDataReason:
      'No listening_events table exists in lovifymusic. We have play_count aggregates per song but no per-play timestamps or listen-duration data, so we can\'t compute minutes-listened-per-day.',
    cohortFrom: filters.cohortFrom,
    cohortTo: filters.cohortTo,
    cohortSize: summary.data?.users.length ?? 0,
    excludedTestUsers: summary.data?.excludedTestUsers,
    manuallyExcluded: summary.data?.manuallyExcluded,
  }

  return (
    <Card className="border-2 border-accent/20 bg-gradient-to-br from-accent/5 to-transparent">
      <CardContent className="p-8">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div className="flex-1 min-w-[260px]">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-lg bg-accent/15 text-accent flex items-center justify-center">
                <Activity className="h-4 w-4" />
              </div>
              <p className="text-xs font-bold uppercase tracking-wider text-accent">
                The one number that matters most
              </p>
            </div>
            <h2 className="text-xl font-bold text-foreground">
              How long are users listening each day?
            </h2>
            <p className="text-sm text-tertiary mt-1">
              If this is going up, the product is working. If it's flat or going down, nothing
              else matters — we have a problem.
            </p>

            {/* Hero number — placeholder until event tracking exists */}
            <div className="mt-6 flex items-baseline gap-3">
              <span className="text-5xl font-bold tracking-tight text-muted-foreground/60">—</span>
              <span className="text-sm text-muted-foreground">minutes per user, per day</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">vs last 28 days: —</p>

            <p className="text-[11px] text-emerald-700 mt-3 font-medium">
              🎯 Goal: trending UP, week over week.
            </p>
          </div>

          {/* Right: trend placeholder */}
          <div className="flex-1 min-w-[280px]">
            <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 h-[180px] flex items-center justify-center">
              <div className="text-center max-w-xs">
                <AlertTriangle className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs font-semibold text-foreground">
                  We can't measure this yet
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  The app needs to log every time a user plays a song or video, and for how long.
                  Once that's wired up, this number lights up.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 pt-5 border-t border-border/60 flex items-center justify-between gap-3 flex-wrap">
          <p className="text-[11px] text-muted-foreground leading-relaxed flex-1 min-w-[280px]">
            <strong className="text-foreground">In plain English:</strong> Add up all the minutes
            every user listened to songs or Mind Movies in the last 28 days. Divide by how many
            different users opened the app. That's the average daily listening time per user.
          </p>
          <button
            onClick={() => setAiOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium border border-accent/20 bg-accent/5 text-accent hover:bg-accent/15 transition-colors cursor-pointer shrink-0"
          >
            <Sparkles className="h-3 w-3" />
            Ask AI: how do I unlock this?
          </button>
        </div>
      </CardContent>
      <AiInsightPanel open={aiOpen} onClose={() => setAiOpen(false)} context={ctx} />
    </Card>
  )
}
