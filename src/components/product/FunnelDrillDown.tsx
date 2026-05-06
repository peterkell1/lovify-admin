import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Dialog, DialogHeader, DialogTitle, DialogContent } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { useFunnelUsers, type ProductFilters, type FunnelUserRow } from '@/hooks/use-product-dashboard'
import { Check, X, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ExcludeUserButton } from '@/components/users/ExcludeUserButton'

interface Props {
  open: boolean
  onClose: () => void
  filters: ProductFilters
  stepKey: string | null
  stepLabel: string | null
}

type ViewMode = 'reached' | 'dropped'

const DAY_MS = 24 * 60 * 60 * 1000

function predicateForStep(stepKey: string): {
  reached: (u: FunnelUserRow) => boolean
  nextLabel: string
  reachedNext: (u: FunnelUserRow) => boolean
} {
  switch (stepKey) {
    case 'signed_up':
      return {
        reached: () => true,
        nextLabel: 'Made first song',
        reachedNext: (u) => u.first_song_at !== null,
      }
    case 'first_song':
      return {
        reached: (u) => u.first_song_at !== null,
        nextLabel: 'Made first vision',
        reachedNext: (u) => u.first_vision_at !== null,
      }
    case 'first_vision':
      return {
        reached: (u) => u.first_vision_at !== null,
        nextLabel: 'Subscribed',
        reachedNext: (u) => u.subscribed_at !== null,
      }
    case 'exhausted_credits':
      return {
        reached: (u) => u.ran_out_of_credits,
        nextLabel: 'Subscribed',
        reachedNext: (u) => u.subscribed_at !== null,
      }
    case 'subscribed':
      return {
        reached: (u) => u.subscribed_at !== null,
        nextLabel: '—',
        reachedNext: () => true,
      }

    // Causal-chain tile drill-downs
    case 'activation':
      return {
        reached: (u) => u.activated_in_first_week,
        nextLabel: 'Formed a habit (4+ days in 14)',
        reachedNext: (u) => u.activated_in_first_week && u.session_days_in_first_14 >= 4,
      }
    case 'habit_formation':
      return {
        reached: (u) => u.activated_in_first_week && u.session_days_in_first_14 >= 4,
        nextLabel: 'Came back at day 7+',
        reachedNext: (u) => u.has_session_at_day_7_or_later,
      }
    case 'd7_retention':
      return {
        // Eligible: signed up 7+ days ago. Reached: had a session at day 7+
        reached: (u) =>
          Date.now() - new Date(u.signed_up_at).getTime() >= 7 * DAY_MS &&
          u.has_session_at_day_7_or_later,
        nextLabel: 'Came back at day 30+',
        reachedNext: (u) => u.has_session_at_day_30_or_later,
      }
    case 'd30_retention':
      return {
        reached: (u) =>
          Date.now() - new Date(u.signed_up_at).getTime() >= 30 * DAY_MS &&
          u.has_session_at_day_30_or_later,
        nextLabel: 'Came back at day 90+',
        reachedNext: (u) => u.has_session_at_day_90_or_later,
      }
    case 'd90_retention':
      return {
        reached: (u) =>
          Date.now() - new Date(u.signed_up_at).getTime() >= 90 * DAY_MS &&
          u.has_session_at_day_90_or_later,
        nextLabel: '—',
        reachedNext: () => true,
      }

    default:
      return {
        reached: () => true,
        nextLabel: '—',
        reachedNext: () => true,
      }
  }
}

function YesNo({ ok }: { ok: boolean }) {
  return ok ? (
    <Check className="h-3.5 w-3.5 text-emerald-600" />
  ) : (
    <X className="h-3.5 w-3.5 text-rose-400" />
  )
}

function relTime(iso: string) {
  const ms = Date.now() - new Date(iso).getTime()
  const days = Math.floor(ms / (24 * 60 * 60 * 1000))
  if (days === 0) return 'today'
  if (days === 1) return '1d ago'
  if (days < 30) return `${days}d ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`
  return `${Math.floor(days / 365)}y ago`
}

export function FunnelDrillDown({ open, onClose, filters, stepKey, stepLabel }: Props) {
  const { data, isLoading } = useFunnelUsers(filters)
  const [view, setView] = useState<ViewMode>('reached')

  const rows = useMemo(() => {
    if (!data || !stepKey) return []
    const { reached, reachedNext } = predicateForStep(stepKey)
    if (view === 'reached') return data.filter(reached)
    // dropped: reached this step but did NOT reach next
    return data.filter((u) => reached(u) && !reachedNext(u))
  }, [data, stepKey, view])

  const meta = stepKey ? predicateForStep(stepKey) : null

  return (
    <Dialog open={open} onClose={onClose} className="max-w-5xl">
      <DialogHeader onClose={onClose}>
        <DialogTitle>{stepLabel ?? 'Drill down'}</DialogTitle>
        <p className="text-xs text-tertiary mt-1">
          Cohort: {filters.cohortFrom} → {filters.cohortTo}
          {filters.excludeTestUsers && ' · real users only'}
        </p>
      </DialogHeader>
      <DialogContent className="space-y-4">
        {/* Tabs */}
        {meta && (
          <div className="flex items-center gap-1 bg-secondary rounded-xl p-1 w-fit">
            <button
              onClick={() => setView('reached')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all',
                view === 'reached'
                  ? 'bg-card text-foreground shadow-soft'
                  : 'text-tertiary hover:text-foreground'
              )}
            >
              Reached this step
            </button>
            {stepKey !== 'subscribed' && (
              <button
                onClick={() => setView('dropped')}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all',
                  view === 'dropped'
                    ? 'bg-card text-foreground shadow-soft'
                    : 'text-tertiary hover:text-foreground'
                )}
              >
                Dropped before "{meta.nextLabel}"
              </button>
            )}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          {isLoading ? 'Loading…' : `${rows.length.toLocaleString()} users`}
        </p>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="text-center py-12 text-sm text-tertiary">
            No users match this view.
          </div>
        ) : (
          <div className="border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr className="text-left text-[11px] uppercase tracking-wider text-tertiary">
                  <th className="px-3 py-2 font-medium">User</th>
                  <th className="px-3 py-2 font-medium">Signed up</th>
                  <th className="px-3 py-2 font-medium text-center">Song</th>
                  <th className="px-3 py-2 font-medium text-center">Vision</th>
                  <th className="px-3 py-2 font-medium text-center">Out of credits</th>
                  <th className="px-3 py-2 font-medium text-center">Subscribed</th>
                  <th className="px-3 py-2 font-medium text-center">Hide</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 200).map((u) => (
                  <tr key={u.id} className="border-t border-border hover:bg-muted/30">
                    <td className="px-3 py-2">
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium text-foreground truncate max-w-[260px]">
                          {u.display_name ?? 'No name'}
                        </span>
                        <span className="text-[11px] text-muted-foreground truncate max-w-[260px]">
                          {u.email ?? '—'}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">
                      {relTime(u.signed_up_at)}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <YesNo ok={u.first_song_at !== null} />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <YesNo ok={u.first_vision_at !== null} />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <YesNo ok={u.ran_out_of_credits} />
                    </td>
                    <td className="px-3 py-2 text-center">
                      {u.subscribed_at ? (
                        <span
                          className={cn(
                            'inline-block px-1.5 py-0.5 rounded text-[10px] font-medium',
                            u.subscription_status === 'active'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-amber-100 text-amber-700'
                          )}
                        >
                          {u.subscription_status}
                        </span>
                      ) : (
                        <X className="h-3.5 w-3.5 text-rose-400 mx-auto" />
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <ExcludeUserButton userId={u.id} stopPropagation={false} />
                    </td>
                    <td className="px-3 py-2">
                      <Link
                        to={`/users/${u.id}`}
                        onClick={onClose}
                        className="text-accent hover:underline inline-flex items-center gap-1 text-xs"
                      >
                        View <ExternalLink className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 200 && (
              <div className="px-3 py-2 text-[11px] text-muted-foreground bg-muted/40 border-t border-border">
                Showing first 200 of {rows.length.toLocaleString()} — narrow the cohort window to see fewer.
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
