import { useState, useCallback, useRef } from 'react'
import { getAnthropicClient, isAiConfigured } from '@/lib/anthropic'
import { CRO_SYSTEM_PROMPT, buildMetricUserPrompt, type MetricContext } from '@/lib/cro-prompts'

export interface CroInsightState {
  text: string
  isStreaming: boolean
  error: string | null
  cached: boolean
  startedAt: number | null
}

const initial: CroInsightState = {
  text: '',
  isStreaming: false,
  error: null,
  cached: false,
  startedAt: null,
}

export function useCroInsight() {
  const [state, setState] = useState<CroInsightState>(initial)
  const abortRef = useRef<AbortController | null>(null)

  const reset = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    setState(initial)
  }, [])

  const run = useCallback(async (ctx: MetricContext) => {
    if (!isAiConfigured()) {
      setState({
        ...initial,
        error:
          'VITE_ANTHROPIC_API_KEY is not set. Add it to .env.local and reload.',
      })
      return
    }

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
          max_tokens: 2048,
          system: [
            {
              type: 'text',
              text: CRO_SYSTEM_PROMPT,
              cache_control: { type: 'ephemeral' },
            },
          ],
          messages: [
            {
              role: 'user',
              content: buildMetricUserPrompt(ctx),
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
        (final.usage as { cache_read_input_tokens?: number }).cache_read_input_tokens ?? 0
      setState((s) => ({
        ...s,
        isStreaming: false,
        cached: cacheRead > 0,
      }))
    } catch (err) {
      if (ac.signal.aborted) return
      const msg = err instanceof Error ? err.message : String(err)
      setState((s) => ({ ...s, isStreaming: false, error: msg }))
    }
  }, [])

  return { state, run, reset }
}
