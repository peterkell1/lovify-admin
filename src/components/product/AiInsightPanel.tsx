import { useEffect, useMemo } from 'react'
import { Dialog, DialogHeader, DialogTitle, DialogContent } from '@/components/ui/dialog'
import { useCroInsight } from '@/hooks/use-cro-insights'
import type { MetricContext } from '@/lib/cro-prompts'
import { Sparkles, Loader2, AlertTriangle, RefreshCw } from 'lucide-react'
import { isAiConfigured } from '@/lib/anthropic'
import { renderMarkdown } from '@/lib/markdown'

interface Props {
  open: boolean
  onClose: () => void
  context: MetricContext | null
}

export function AiInsightPanel({ open, onClose, context }: Props) {
  const { state, run, reset } = useCroInsight()

  const configured = useMemo(() => isAiConfigured(), [])

  useEffect(() => {
    if (open && context && configured) {
      run(context)
    }
    if (!open) {
      reset()
    }
  }, [open, context, configured, run, reset])

  return (
    <Dialog open={open} onClose={onClose} className="max-w-2xl">
      <DialogHeader onClose={onClose}>
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-accent/15 text-accent flex items-center justify-center">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <DialogTitle>CRO Insights</DialogTitle>
        </div>
        {context && (
          <p className="text-xs text-tertiary mt-1">
            {context.question} · {context.currentValue} ({context.status})
          </p>
        )}
      </DialogHeader>
      <DialogContent className="space-y-3">
        {!configured && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-700 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-amber-900">AI not configured</p>
                <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                  Add your Anthropic API key to <code>.env.local</code>:
                </p>
                <pre className="mt-2 p-2 bg-amber-100 rounded text-[11px] font-mono text-amber-900 overflow-x-auto">
                  VITE_ANTHROPIC_API_KEY=sk-ant-...
                </pre>
                <p className="text-xs text-amber-800 mt-2">
                  Then restart the dev server. Get a key at{' '}
                  <a
                    href="https://console.anthropic.com/settings/keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    console.anthropic.com
                  </a>
                  .
                </p>
              </div>
            </div>
          </div>
        )}

        {configured && state.error && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-700 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-rose-900">AI request failed</p>
                <p className="text-xs text-rose-800 mt-1 break-words">{state.error}</p>
                <button
                  onClick={() => context && run(context)}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-rose-900 hover:text-rose-700"
                >
                  <RefreshCw className="h-3 w-3" />
                  Retry
                </button>
              </div>
            </div>
          </div>
        )}

        {configured && state.isStreaming && state.text.length === 0 && (
          <div className="flex items-center gap-2 text-sm text-tertiary py-8 justify-center">
            <Loader2 className="h-4 w-4 animate-spin" />
            Thinking through your data…
          </div>
        )}

        {configured && state.text.length > 0 && (
          <div className="space-y-1">{renderMarkdown(state.text)}</div>
        )}

        {configured && !state.isStreaming && state.text.length > 0 && (
          <div className="pt-3 mt-3 border-t border-border flex items-center justify-between">
            <p className="text-[10px] text-muted-foreground">
              Powered by Claude Opus 4.7 · {state.cached ? 'cache hit' : 'cache miss'} ·{' '}
              {state.startedAt
                ? `${((Date.now() - state.startedAt) / 1000).toFixed(1)}s`
                : ''}
            </p>
            <button
              onClick={() => context && run(context)}
              className="inline-flex items-center gap-1 text-xs font-medium text-tertiary hover:text-foreground"
            >
              <RefreshCw className="h-3 w-3" />
              Re-run
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
