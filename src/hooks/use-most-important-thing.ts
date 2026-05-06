import { useCallback, useEffect, useRef, useState } from 'react'
import { getAnthropicClient, isAiConfigured } from '@/lib/anthropic'
import { buildMITSystemPrompt, type DashboardSnapshot } from '@/lib/cro-prompts'

export interface MITState {
  text: string
  isStreaming: boolean
  error: string | null
  cached: boolean
  startedAt: number | null
}

const initial: MITState = {
  text: '',
  isStreaming: false,
  error: null,
  cached: false,
  startedAt: null,
}

// Stable cache key from the snapshot — re-runs only when the underlying
// numbers change meaningfully, not on every render.
function snapshotKey(s: DashboardSnapshot | null): string {
  if (!s) return 'null'
  return [
    s.cohort.from,
    s.cohort.to,
    s.cohort.size,
    s.activation?.rate.toFixed(3),
    s.habit?.rate.toFixed(3),
    s.retention?.d7.rate.toFixed(3),
    s.retention?.d30.rate.toFixed(3),
    s.retention?.d90.rate.toFixed(3),
    s.reListenRate?.rate.toFixed(3),
    s.songsPerActiveUser?.ratio.toFixed(3),
    s.funnel
      ? [
          s.funnel.signedUp,
          s.funnel.firstSong,
          s.funnel.firstVision,
          s.funnel.exhaustedCredits,
          s.funnel.subscribed,
        ].join(',')
      : '',
    s.recentReleases?.map((r) => r.occurredAt + r.title).join('|') ?? '',
  ].join('::')
}

export function useMostImportantThing(snapshot: DashboardSnapshot | null) {
  const [state, setState] = useState<MITState>(initial)
  const abortRef = useRef<AbortController | null>(null)
  const lastKeyRef = useRef<string | null>(null)

  const run = useCallback(
    async (forceRefresh = false) => {
      if (!snapshot) return
      if (!isAiConfigured()) {
        setState({ ...initial, error: 'AI not configured' })
        return
      }
      const key = snapshotKey(snapshot)
      if (!forceRefresh && key === lastKeyRef.current && state.text) {
        return // already have a result for this snapshot
      }
      lastKeyRef.current = key

      abortRef.current?.abort()
      const ac = new AbortController()
      abortRef.current = ac

      setState({
        text: '',
        isStreaming: true,
        error: null,
        cached: false,
        startedAt: Date.now(),
      })

      try {
        const client = getAnthropicClient()
        const stream = await client.messages.stream(
          {
            model: 'claude-opus-4-7',
            max_tokens: 1024,
            system: [
              {
                type: 'text',
                text: buildMITSystemPrompt(snapshot),
                cache_control: { type: 'ephemeral' },
              },
            ],
            messages: [
              {
                role: 'user',
                content:
                  "What's the single highest-leverage thing the founder should fix this week? Output the structured brief in the format above. No preamble.",
              },
            ],
          },
          { signal: ac.signal }
        )

        stream.on('text', (delta) => {
          if (ac.signal.aborted) return
          setState((s) => ({ ...s, text: s.text + delta }))
        })

        const final = await stream.finalMessage()
        if (ac.signal.aborted) return
        const cacheRead =
          (final.usage as { cache_read_input_tokens?: number })
            .cache_read_input_tokens ?? 0
        setState((s) => ({ ...s, isStreaming: false, cached: cacheRead > 0 }))
      } catch (err) {
        if (ac.signal.aborted) return
        const msg = err instanceof Error ? err.message : String(err)
        setState((s) => ({ ...s, isStreaming: false, error: msg }))
      }
    },
    [snapshot, state.text]
  )

  // Auto-run when the snapshot becomes ready or changes meaningfully.
  useEffect(() => {
    if (!snapshot) return
    const key = snapshotKey(snapshot)
    if (key === lastKeyRef.current) return
    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot])

  const regenerate = useCallback(() => run(true), [run])

  return { state, regenerate }
}
