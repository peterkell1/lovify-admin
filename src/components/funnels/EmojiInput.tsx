import { useEffect, useRef, useState } from 'react'
import { Smile, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EMOJI_GROUPS, searchEmojis } from '@/config/emoji-catalog'

// Single-emoji input. Click the button to open a curated popover with
// search + categories; paste / type still works for any emoji outside
// the catalog. Small footprint on purpose — marketers pick mostly from
// the shortlist, power users can drop any character in.
export function EmojiInput({
  value,
  onChange,
  placeholder = '🙂',
  className,
  ariaLabel = 'Pick an emoji',
}: {
  value: string
  onChange: (next: string) => void
  placeholder?: string
  className?: string
  ariaLabel?: string
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  // Autofocus search on open so typing feels instant.
  useEffect(() => {
    if (open) {
      setQuery('')
      // next tick — input isn't mounted until after state flips.
      requestAnimationFrame(() => searchRef.current?.focus())
    }
  }, [open])

  const pick = (char: string) => {
    onChange(char)
    setOpen(false)
  }

  const searchResults = searchEmojis(query)

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={ariaLabel}
        aria-expanded={open}
        className={cn(
          'flex h-10 w-14 items-center justify-center rounded-lg border border-input bg-secondary text-xl transition-colors',
          'hover:border-orange-300 hover:bg-secondary/80',
          open && 'border-orange-400 ring-2 ring-orange-400/30',
        )}
      >
        {value ? (
          <span className="leading-none">{value}</span>
        ) : (
          <Smile className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {open ? (
        <div className="absolute left-0 top-full z-30 mt-1 w-[280px] rounded-xl border border-border bg-card shadow-dreamy">
          <div className="flex items-center gap-2 border-b border-border p-2">
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder ? `Search — or paste: ${placeholder}` : 'Search emoji…'}
              className="flex-1 h-8 px-2 rounded-md bg-secondary text-sm outline-none focus:ring-2 focus:ring-orange-400/40"
            />
            {value ? (
              <button
                type="button"
                onClick={() => {
                  onChange('')
                  setOpen(false)
                }}
                className="rounded-md p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                aria-label="Clear emoji"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
          <div className="max-h-60 overflow-y-auto p-2">
            {/* None option — always visible so marketers can opt out of an
                emoji without hunting for the X button. */}
            <button
              type="button"
              onClick={() => pick('')}
              className={cn(
                'mb-2 flex w-full items-center gap-2 rounded-md border px-2 py-1.5 text-xs font-semibold transition-colors',
                !value
                  ? 'border-orange-400 bg-orange-500/10 text-orange-600'
                  : 'border-border text-muted-foreground hover:border-orange-300 hover:text-foreground',
              )}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded border border-dashed border-current text-[10px]">
                —
              </span>
              No emoji
            </button>
            {searchResults ? (
              searchResults.length === 0 ? (
                <p className="px-2 py-4 text-center text-xs text-muted-foreground">
                  No matches. Paste any emoji into the search box.
                </p>
              ) : (
                <div className="grid grid-cols-8 gap-1">
                  {searchResults.map((e) => (
                    <EmojiButton
                      key={e.char}
                      char={e.char}
                      selected={e.char === value}
                      onPick={pick}
                    />
                  ))}
                </div>
              )
            ) : (
              EMOJI_GROUPS.map((group) => (
                <div key={group.name} className="mb-3 last:mb-0">
                  <p className="px-1 mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {group.name}
                  </p>
                  <div className="grid grid-cols-8 gap-1">
                    {group.emojis.map((e) => (
                      <EmojiButton
                        key={e.char}
                        char={e.char}
                        selected={e.char === value}
                        onPick={pick}
                      />
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function EmojiButton({
  char,
  selected,
  onPick,
}: {
  char: string
  selected: boolean
  onPick: (c: string) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onPick(char)}
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-md text-lg leading-none transition-colors',
        selected
          ? 'bg-orange-500/15 ring-1 ring-orange-400/60'
          : 'hover:bg-foreground/5',
      )}
    >
      {char}
    </button>
  )
}
