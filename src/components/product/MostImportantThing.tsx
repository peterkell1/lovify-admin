import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Zap, RefreshCw, MessageSquare, AlertTriangle, Loader2 } from 'lucide-react'
import { useMostImportantThing } from '@/hooks/use-most-important-thing'
import { isAiConfigured } from '@/lib/anthropic'
import type { DashboardSnapshot } from '@/lib/cro-prompts'
import { renderMarkdown } from '@/lib/markdown'

interface Props {
  snapshot: DashboardSnapshot | null
  snapshotLoading: boolean
  onDiscuss: () => void
}

export function MostImportantThing({ snapshot, snapshotLoading, onDiscuss }: Props) {
  const { state, regenerate } = useMostImportantThing(snapshot)
  const configured = isAiConfigured()

  return (
    <Card className="border-2 border-accent/30 bg-gradient-to-br from-accent/8 via-accent/4 to-transparent shadow-dreamy">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-accent/20 text-accent flex items-center justify-center">
              <Zap className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-accent">
                The one thing to fix this week
              </p>
              <p className="text-[11px] text-tertiary">
                CRO AI&rsquo;s read on your live data — updates when the numbers move
              </p>
            </div>
          </div>
          {configured && state.text && !state.isStreaming && (
            <button
              onClick={regenerate}
              className="h-7 w-7 inline-flex items-center justify-center rounded-md text-tertiary hover:text-accent hover:bg-accent/10 transition-colors cursor-pointer shrink-0"
              title="Regenerate"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {!configured ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-700 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-amber-900">
                Add your Anthropic API key to see this
              </p>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                This panel uses Claude Opus 4.7 to read the live dashboard and tell you the
                single highest-leverage fix. Without a key, the rest of the dashboard still
                works — you just lose this directive.
              </p>
              <pre className="mt-2 p-2 bg-amber-100 rounded text-[11px] font-mono text-amber-900 overflow-x-auto">
                VITE_ANTHROPIC_API_KEY=sk-ant-...
              </pre>
            </div>
          </div>
        ) : snapshotLoading || (state.isStreaming && state.text.length === 0) ? (
          <div className="space-y-3">
            <Skeleton className="h-7 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <div className="flex items-center gap-2 text-xs text-tertiary mt-4">
              <Loader2 className="h-3 w-3 animate-spin" />
              {snapshotLoading ? 'Loading dashboard data…' : 'Reading the data…'}
            </div>
          </div>
        ) : state.error ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-700 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-rose-900">AI request failed</p>
                <p className="text-xs text-rose-800 mt-1 break-words">{state.error}</p>
                <button
                  onClick={regenerate}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-rose-900 hover:text-rose-700"
                >
                  <RefreshCw className="h-3 w-3" />
                  Retry
                </button>
              </div>
            </div>
          </div>
        ) : state.text ? (
          <div className="space-y-1">{renderMarkdown(state.text)}</div>
        ) : null}

        {configured && state.text && !state.isStreaming && (
          <div className="mt-5 pt-4 border-t border-accent/15 flex items-center justify-between gap-3 flex-wrap">
            <button
              onClick={onDiscuss}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent/90 transition-colors cursor-pointer"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Discuss with CRO AI
            </button>
            <p className="text-[10px] text-muted-foreground">
              Claude Opus 4.7 · {state.cached ? 'cache hit' : 'fresh'} ·{' '}
              {state.startedAt
                ? `${((Date.now() - state.startedAt) / 1000).toFixed(1)}s`
                : ''}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
