import { useCallback, useEffect, useRef, useState } from 'react'
import { getAnthropicClient, isAiConfigured } from '@/lib/anthropic'
import { buildChatSystemPrompt, type DashboardSnapshot } from '@/lib/cro-prompts'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export interface CroChatState {
  messages: ChatMessage[]
  isStreaming: boolean
  error: string | null
}

const STORAGE_KEY = 'lovify-admin:cro-chat'

function loadFromStorage(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (m): m is ChatMessage =>
        typeof m === 'object' &&
        m !== null &&
        (m.role === 'user' || m.role === 'assistant') &&
        typeof m.content === 'string' &&
        typeof m.timestamp === 'number'
    )
  } catch {
    return []
  }
}

function saveToStorage(messages: ChatMessage[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
  } catch {
    // ignore quota / disabled storage
  }
}

export function useCroChat(snapshot: DashboardSnapshot | null) {
  const [state, setState] = useState<CroChatState>(() => ({
    messages: loadFromStorage(),
    isStreaming: false,
    error: null,
  }))
  const abortRef = useRef<AbortController | null>(null)

  // Persist on every change
  useEffect(() => {
    saveToStorage(state.messages)
  }, [state.messages])

  const send = useCallback(
    async (userText: string) => {
      const text = userText.trim()
      if (!text) return
      if (!isAiConfigured()) {
        setState((s) => ({
          ...s,
          error:
            'VITE_ANTHROPIC_API_KEY is not set. Add it to .env.local and restart the dev server.',
        }))
        return
      }
      if (!snapshot) {
        setState((s) => ({
          ...s,
          error: 'Dashboard data is still loading — try again in a second.',
        }))
        return
      }

      abortRef.current?.abort()
      const ac = new AbortController()
      abortRef.current = ac

      const userMsg: ChatMessage = {
        role: 'user',
        content: text,
        timestamp: Date.now(),
      }
      const assistantPlaceholder: ChatMessage = {
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
      }

      setState((s) => ({
        ...s,
        messages: [...s.messages, userMsg, assistantPlaceholder],
        isStreaming: true,
        error: null,
      }))

      try {
        const client = getAnthropicClient()
        // Build the messages payload from history (excluding the placeholder)
        const historyForApi = [...state.messages, userMsg].map((m) => ({
          role: m.role,
          content: m.content,
        }))

        const stream = await client.messages.stream(
          {
            model: 'claude-opus-4-7',
            max_tokens: 2048,
            system: [
              {
                type: 'text',
                text: buildChatSystemPrompt(snapshot),
                cache_control: { type: 'ephemeral' },
              },
            ],
            messages: historyForApi,
          },
          { signal: ac.signal }
        )

        stream.on('text', (delta) => {
          if (ac.signal.aborted) return
          setState((s) => {
            const last = s.messages[s.messages.length - 1]
            if (!last || last.role !== 'assistant') return s
            const updated = { ...last, content: last.content + delta }
            return {
              ...s,
              messages: [...s.messages.slice(0, -1), updated],
            }
          })
        })

        await stream.finalMessage()
        if (ac.signal.aborted) return
        setState((s) => ({ ...s, isStreaming: false }))
      } catch (err) {
        if (ac.signal.aborted) return
        const msg = err instanceof Error ? err.message : String(err)
        setState((s) => ({
          ...s,
          isStreaming: false,
          error: msg,
          // Remove the empty assistant placeholder on error so it doesn't show
          messages: s.messages.filter(
            (m, i) => !(i === s.messages.length - 1 && m.role === 'assistant' && !m.content)
          ),
        }))
      }
    },
    [snapshot, state.messages]
  )

  const clear = useCallback(() => {
    abortRef.current?.abort()
    setState({ messages: [], isStreaming: false, error: null })
  }, [])

  const stop = useCallback(() => {
    abortRef.current?.abort()
    setState((s) => ({ ...s, isStreaming: false }))
  }, [])

  return { state, send, clear, stop }
}
