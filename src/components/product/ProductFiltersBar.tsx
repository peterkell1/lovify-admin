import { Card, CardContent } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import {
  type ProductFilters,
  useQuizGoalOptions,
  useCohortSummary,
} from '@/hooks/use-product-dashboard'
import { Filter, Lock, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProductFiltersBarProps {
  filters: ProductFilters
  onChange: (filters: ProductFilters) => void
}

type RangePreset = '24h' | '7d' | '30d' | '90d' | '1y' | 'custom'

const PRESETS: { id: RangePreset; label: string; days: number | null }[] = [
  { id: '24h', label: 'Last 24h', days: 1 },
  { id: '7d', label: 'Last 7d', days: 7 },
  { id: '30d', label: 'Last 30d', days: 30 },
  { id: '90d', label: 'Last 90d', days: 90 },
  { id: '1y', label: 'Last year', days: 365 },
  { id: 'custom', label: 'Custom', days: null },
]

function todayISO() {
  return new Date().toISOString().split('T')[0]
}

function daysAgoISO(days: number) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().split('T')[0]
}

function detectPreset(from: string, to: string): RangePreset {
  if (to !== todayISO()) return 'custom'
  for (const p of PRESETS) {
    if (p.days === null) continue
    if (from === daysAgoISO(p.days)) return p.id
  }
  return 'custom'
}

export function ProductFiltersBar({ filters, onChange }: ProductFiltersBarProps) {
  const update = <K extends keyof ProductFilters>(key: K, value: ProductFilters[K]) => {
    onChange({ ...filters, [key]: value })
  }
  const quizGoals = useQuizGoalOptions()
  const summary = useCohortSummary(filters)
  const activePreset = detectPreset(filters.cohortFrom, filters.cohortTo)

  const setPreset = (p: RangePreset) => {
    if (p === 'custom') {
      onChange({ ...filters }) // no-op; user edits dates manually
      return
    }
    const def = PRESETS.find((x) => x.id === p)!
    onChange({
      ...filters,
      cohortFrom: daysAgoISO(def.days!),
      cohortTo: todayISO(),
    })
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-tertiary" />
            <span className="text-xs font-semibold uppercase tracking-wider text-tertiary">
              Filters
            </span>
          </div>

          {/* Quick range chips */}
          <div className="flex items-center gap-1 bg-secondary rounded-xl p-1">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPreset(p.id)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer',
                  activePreset === p.id
                    ? 'bg-card text-foreground shadow-soft'
                    : 'text-tertiary hover:text-foreground'
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Test users toggle */}
          <button
            onClick={() => update('excludeTestUsers', !filters.excludeTestUsers)}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer',
              filters.excludeTestUsers
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                : 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
            )}
            title={
              filters.excludeTestUsers
                ? 'Hiding internal/test/mash emails (admin@trylovify.com, test*, +aliases, gibberish)'
                : 'Showing ALL signups including internal/test accounts'
            }
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            {filters.excludeTestUsers ? 'Real users only' : 'All users (raw)'}
            {filters.excludeTestUsers && summary.data && (
              <span className="text-[10px] text-emerald-600">
                · {summary.data.excludedTestUsers} excluded
              </span>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-tertiary mb-1">From</label>
            <Input
              type="date"
              value={filters.cohortFrom}
              onChange={(e) => update('cohortFrom', e.target.value)}
              className="h-9 text-sm"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-tertiary mb-1">To</label>
            <Input
              type="date"
              value={filters.cohortTo}
              onChange={(e) => update('cohortTo', e.target.value)}
              className="h-9 text-sm"
            />
          </div>
          <div title="attribution_data column exists but is empty across all profiles. Wire up attribution capture in lovifymusic to enable.">
            <label className="block text-[11px] font-medium text-tertiary mb-1 flex items-center gap-1">
              Acquisition source <Lock className="h-2.5 w-2.5" />
            </label>
            <Select disabled value="all" className="h-9 text-sm">
              <option value="all">All (not tracked)</option>
            </Select>
          </div>
          <div title="Legacy filter — quiz_goals are from the old long-form quiz. Newer signups won't have these set.">
            <label className="block text-[11px] font-medium text-tertiary mb-1 flex items-center gap-1">
              Quiz goal <span className="text-[9px] text-amber-600">(legacy)</span>
            </label>
            <Select
              value={filters.quizGoal}
              onChange={(e) => update('quizGoal', e.target.value)}
              className="h-9 text-sm"
              disabled={quizGoals.isLoading}
            >
              <option value="all">All</option>
              {(quizGoals.data ?? []).slice(0, 30).map(({ goal, count }) => (
                <option key={goal} value={goal}>
                  {goal} ({count})
                </option>
              ))}
            </Select>
          </div>
        </div>

        {summary.data && (
          <p className="text-[11px] text-muted-foreground">
            Cohort:{' '}
            <strong className="text-foreground">
              {summary.data.users.length.toLocaleString()}
            </strong>{' '}
            users
            {filters.excludeTestUsers && summary.data.excludedTestUsers > 0 && (
              <>
                {' '}
                ·{' '}
                <span className="text-emerald-700">
                  {summary.data.excludedTestUsers.toLocaleString()} auto-flagged as test
                </span>
              </>
            )}
            {summary.data.manuallyExcluded > 0 && (
              <>
                {' '}
                ·{' '}
                <span className="text-slate-700">
                  {summary.data.manuallyExcluded.toLocaleString()} manually excluded
                </span>
              </>
            )}{' '}
            from {summary.data.rawTotal.toLocaleString()} signups in window
          </p>
        )}
      </CardContent>
    </Card>
  )
}
