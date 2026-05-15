import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { MoneyTab } from '@/components/business-health/MoneyTab'
import { DateRangeFilter, rangeFromPreset, type DateRangePresetId } from '@/components/business-health/DateRangeFilter'

const tabs = [
  { id: 'money', label: 'Money' },
  { id: 'unit-economics', label: 'Unit Economics' },
  { id: 'costs', label: 'Costs' },
] as const

type TabId = (typeof tabs)[number]['id']
const tabIds = tabs.map((t) => t.id) as readonly TabId[]
const defaultTab: TabId = 'money'

const presetIds: readonly DateRangePresetId[] = ['7d', '30d', '90d', '365d']
const defaultPreset: DateRangePresetId = '30d'

const BusinessHealthPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()

  const tabParam = searchParams.get('tab') as TabId | null
  const activeTab: TabId = tabParam && tabIds.includes(tabParam) ? tabParam : defaultTab

  const rangeParam = searchParams.get('range') as DateRangePresetId | null
  const activePreset: DateRangePresetId = rangeParam && presetIds.includes(rangeParam) ? rangeParam : defaultPreset

  const range = useMemo(() => rangeFromPreset(activePreset), [activePreset])

  const setActiveTab = (id: TabId) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (id === defaultTab) next.delete('tab')
      else next.set('tab', id)
      return next
    }, { replace: true })
  }

  const setActivePreset = (id: DateRangePresetId) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (id === defaultPreset) next.delete('range')
      else next.set('range', id)
      return next
    }, { replace: true })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Business Health</h1>
          <p className="text-tertiary text-sm mt-1">Revenue, costs, and unit economics</p>
        </div>
        <DateRangeFilter value={activePreset} onChange={setActivePreset} />
      </div>

      <div className="flex gap-1 bg-secondary rounded-xl p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer',
              activeTab === tab.id
                ? 'bg-card text-foreground shadow-soft'
                : 'text-tertiary hover:text-foreground'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'money' && <MoneyTab range={range} />}
      {activeTab === 'unit-economics' && <ComingSoonPanel ticket="Ticket 6" />}
      {activeTab === 'costs' && <ComingSoonPanel ticket="Ticket 5" />}
    </div>
  )
}

const ComingSoonPanel = ({ ticket }: { ticket: string }) => {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card/50 py-16 text-center">
      <p className="text-sm text-tertiary">Coming in {ticket}</p>
    </div>
  )
}

export default BusinessHealthPage
