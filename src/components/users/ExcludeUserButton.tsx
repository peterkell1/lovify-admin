import { useState, type MouseEvent } from 'react'
import { X, RotateCcw } from 'lucide-react'
import {
  useExcludedUserIds,
  useExcludeUser,
  useIncludeUser,
} from '@/hooks/use-user-exclusions'
import { cn } from '@/lib/utils'

interface Props {
  userId: string
  size?: 'sm' | 'md'
  /** Visual style — `icon` is just the X, `chip` adds a label. */
  variant?: 'icon' | 'chip'
  /** Stop the click event from propagating (use when row is also clickable) */
  stopPropagation?: boolean
}

export function ExcludeUserButton({
  userId,
  size = 'sm',
  variant = 'icon',
  stopPropagation = true,
}: Props) {
  const { data: excludedIds } = useExcludedUserIds()
  const exclude = useExcludeUser()
  const include = useIncludeUser()
  const isExcluded = excludedIds?.has(userId) ?? false
  const [confirming, setConfirming] = useState(false)

  const sizePx = size === 'md' ? 'h-7 w-7' : 'h-6 w-6'
  const iconSize = size === 'md' ? 'h-3.5 w-3.5' : 'h-3 w-3'

  const handleExclude = (e: MouseEvent) => {
    if (stopPropagation) e.stopPropagation()
    if (!confirming) {
      setConfirming(true)
      setTimeout(() => setConfirming(false), 2500)
      return
    }
    setConfirming(false)
    exclude.mutate({ userId })
  }

  const handleInclude = (e: MouseEvent) => {
    if (stopPropagation) e.stopPropagation()
    include.mutate(userId)
  }

  if (isExcluded) {
    if (variant === 'chip') {
      return (
        <button
          onClick={handleInclude}
          disabled={include.isPending}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 text-[10px] font-semibold transition-colors disabled:opacity-50 cursor-pointer"
          title="Restore this user to metrics"
        >
          <RotateCcw className={iconSize} />
          EXCLUDED — undo
        </button>
      )
    }
    return (
      <button
        onClick={handleInclude}
        disabled={include.isPending}
        className={cn(
          sizePx,
          'inline-flex items-center justify-center rounded-md text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors disabled:opacity-50 cursor-pointer'
        )}
        title="Excluded from metrics — click to restore"
      >
        <RotateCcw className={iconSize} />
      </button>
    )
  }

  if (variant === 'chip') {
    return (
      <button
        onClick={handleExclude}
        disabled={exclude.isPending}
        className={cn(
          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold transition-colors disabled:opacity-50 cursor-pointer',
          confirming
            ? 'bg-rose-600 text-white'
            : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
        )}
        title={
          confirming
            ? 'Click again to confirm — this user will be hidden from all metrics'
            : 'Mark as not a real customer — exclude from all metrics'
        }
      >
        <X className={iconSize} />
        {confirming ? 'Click again to confirm' : 'Exclude'}
      </button>
    )
  }

  return (
    <button
      onClick={handleExclude}
      disabled={exclude.isPending}
      className={cn(
        sizePx,
        'inline-flex items-center justify-center rounded-md transition-colors disabled:opacity-50 cursor-pointer',
        confirming
          ? 'bg-rose-600 text-white'
          : 'text-tertiary hover:text-rose-700 hover:bg-rose-50'
      )}
      title={
        confirming
          ? 'Click again to confirm exclusion'
          : 'Not a real customer? Click to exclude from all metrics.'
      }
    >
      <X className={iconSize} />
    </button>
  )
}
