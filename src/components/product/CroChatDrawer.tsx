import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { X, Send, Sparkles, AlertTriangle, Trash2, Loader2, MessageSquare } from 'lucide-react'
import { useCroChat } from '@/hooks/use-cro-chat'
import type { DashboardSnapshot } from '@/lib/cro-prompts'
import { isAiConfigured } from '@/lib/anthropic'
import { renderMarkdown } from '@/lib/markdown'
import { cn } from '@/lib/utils'

interface Props {
  open: boolean
  onClose: () => void
  snapshot: DashboardSnapshot | null
}

const SUGGESTED_QUESTIONS = [
  'What should I prioritize this week?',
  'Why is signup → first song dropping ~75%?',
  "What's the cheapest tracking to wire next that unlocks the most insights?",
  "I called 5 users from the drop-off list. They said the song generation took too long. Help me think through what to do.",
]

export function CroChatDrawer({ open, onClose, snapshot }: Props) {
  const { state, send, clear, stop } = useCroChat(snapshot)
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const configured = isAiConfigured()

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [state.messages])

  // Lock body scroll while open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      // Focus textarea when opening
      setTimeout(() => textareaRef.current?.focus(), 100)
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const handleSubmit = () => {
    if (!input.trim() || state.isStreaming) return
    send(input)
    setInput('')
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-[1px]"
        onClick={onClose}
      />
      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-card border-l border-border shadow-dreamy flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-accent/15 text-accent flex items-center justify-center">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">CRO AI</p>
              <p className="text-[11px] text-tertiary">
                Knows your live dashboard data
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {state.messages.length > 0 && (
              <button
                onClick={clear}
                className="h-7 w-7 inline-flex items-center justify-center rounded-md text-tertiary hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                title="Clear conversation"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="h-7 w-7 inline-flex items-center justify-center rounded-md text-tertiary hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4">
          {!configured ? (
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
                    Then restart the dev server.{' '}
                    <a
                      href="https://console.anthropic.com/settings/keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      Get a key →
                    </a>
                  </p>
                </div>
              </div>
            </div>
          ) : state.messages.length === 0 ? (
            <div className="space-y-4">
              <p className="text-sm text-foreground">
                Hi. I see your live dashboard — current cohort, funnel, retention, engagement,
                and what&apos;s blocked on instrumentation. Ask me anything.
              </p>
              <p className="text-xs text-tertiary">Try one of these:</p>
              <div className="space-y-2">
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => send(q)}
                    className="w-full text-left text-xs px-3 py-2 rounded-lg border border-border bg-muted/30 hover:bg-muted/60 hover:border-accent/30 transition-colors cursor-pointer text-foreground leading-relaxed"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {state.messages.map((m, i) => (
                <div key={i} className="space-y-1">
                  <p
                    className={cn(
                      'text-[10px] font-bold uppercase tracking-wider',
                      m.role === 'user' ? 'text-accent' : 'text-tertiary'
                    )}
                  >
                    {m.role === 'user' ? 'You' : 'CRO AI'}
                  </p>
                  {m.role === 'user' ? (
                    <p className="text-sm text-foreground whitespace-pre-wrap">{m.content}</p>
                  ) : m.content.length === 0 && state.isStreaming ? (
                    <div className="flex items-center gap-2 text-sm text-tertiary py-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Thinking…
                    </div>
                  ) : (
                    <div className="space-y-1">{renderMarkdown(m.content)}</div>
                  )}
                </div>
              ))}
              {state.error && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs">
                  <p className="font-semibold text-rose-900 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Error
                  </p>
                  <p className="text-rose-800 mt-1 break-words">{state.error}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="border-t border-border bg-card shrink-0 px-4 py-3">
          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                state.isStreaming
                  ? 'Generating answer…'
                  : 'Ask anything about your dashboard… (Enter to send, Shift+Enter for newline)'
              }
              disabled={!configured}
              rows={2}
              className="flex-1 resize-none rounded-lg border border-border bg-secondary px-3 py-2 text-sm placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:opacity-50"
            />
            {state.isStreaming ? (
              <button
                onClick={stop}
                className="h-9 px-3 rounded-lg bg-rose-100 text-rose-700 text-xs font-semibold hover:bg-rose-200 transition-colors cursor-pointer"
              >
                Stop
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!input.trim() || !configured}
                className="h-9 px-3 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer inline-flex items-center gap-1.5"
              >
                <Send className="h-3.5 w-3.5" />
                Send
              </button>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">
            Powered by Claude Opus 4.7 · Conversation saved locally
          </p>
        </div>
      </div>
    </>
  )
}

export function CroChatLauncher({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-30 h-14 px-5 rounded-full bg-accent text-white shadow-dreamy hover:shadow-soft hover:scale-105 transition-all cursor-pointer inline-flex items-center gap-2 font-semibold"
      title="Talk to your CRO AI"
    >
      <MessageSquare className="h-4 w-4" />
      <span className="text-sm">Talk to CRO AI</span>
    </button>
  )
}
