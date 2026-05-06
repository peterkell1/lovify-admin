import { useSearchParams } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { PnLTab } from '@/components/finance/PnLTab'
import { AICostsTab } from '@/components/finance/AICostsTab'
import { SubscriptionsTab } from '@/components/finance/SubscriptionsTab'
import { CreditEconomyTab } from '@/components/finance/CreditEconomyTab'
import { UnitEconomicsSection } from '@/components/business-health/UnitEconomicsSection'
import { StatCard } from '@/components/dashboard/StatCard'
import { useMrr, useGrossMargin, useMonthlyChurn } from '@/hooks/use-business-health'
import { DollarSign, TrendingUp, Percent, UserMinus } from 'lucide-react'
import { SkeletonCard } from '@/components/ui/skeleton'

const tabs = [
  { id: 'overview', label: 'Money' },
  { id: 'subscriptions', label: 'Subscriptions' },
  { id: 'ai-costs', label: 'AI Costs' },
  { id: 'credits', label: 'Credit Economy' },
  { id: 'unit-econ', label: 'Unit Economics' },
] as const

type TabId = (typeof tabs)[number]['id']

const tabIds = tabs.map((t) => t.id) as readonly TabId[]
const defaultTab: TabId = 'overview'

function fmtMoney(usd: number): string {
  if (usd >= 1_000_000) return `$${(usd / 1_000_000).toFixed(2)}M`
  if (usd >= 10_000) return `$${(usd / 1_000).toFixed(1)}K`
  return `$${usd.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
}

function fmtPct(p: number): string {
  return `${(p * 100).toFixed(1)}%`
}

function MoneyKpis() {
  const mrr = useMrr()
  const margin = useGrossMargin(30)
  const churn = useMonthlyChurn(30)

  const isLoading = mrr.isLoading || margin.isLoading || churn.isLoading

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="MRR"
        value={mrr.data ? fmtMoney(mrr.data.mrr) : '—'}
        icon={<DollarSign className="h-5 w-5" />}
        subtitle={
          mrr.data
            ? `${mrr.data.activePayingSubs} paying · $${mrr.data.arpu.toFixed(2)} ARPU`
            : undefined
        }
      />
      <StatCard
        title="MRR Growth (30d)"
        value={mrr.data ? fmtPct(mrr.data.growthPct) : '—'}
        icon={<TrendingUp className="h-5 w-5" />}
        subtitle={
          mrr.data
            ? `${fmtMoney(mrr.data.mrr - mrr.data.priorMrr)} vs 30d ago`
            : undefined
        }
      />
      <StatCard
        title="Gross Margin"
        value={margin.data ? fmtPct(margin.data.margin) : '—'}
        icon={<Percent className="h-5 w-5" />}
        subtitle={
          margin.data
            ? `${fmtMoney(margin.data.revenue)} rev − ${fmtMoney(margin.data.costs)} cost`
            : undefined
        }
      />
      <StatCard
        title="Monthly Churn"
        value={churn.data ? fmtPct(churn.data.churnRate) : '—'}
        icon={<UserMinus className="h-5 w-5" />}
        subtitle={
          churn.data
            ? `${churn.data.cancelledInWindow} cancelled / ${churn.data.activeAtStart} active`
            : undefined
        }
      />
    </div>
  )
}

export default function BusinessHealthPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab') as TabId | null
  const activeTab: TabId = tabParam && tabIds.includes(tabParam) ? tabParam : defaultTab

  const setActiveTab = (id: TabId) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (id === defaultTab) next.delete('tab')
        else next.set('tab', id)
        return next
      },
      { replace: true }
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Business Health</h1>
        <p className="text-tertiary text-sm mt-1">
          Are we making money — and is that going to keep being true?
        </p>
      </div>

      {/* Tab bar — matches Finance style */}
      <div className="flex gap-1 bg-secondary rounded-xl p-1 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer whitespace-nowrap',
              activeTab === tab.id
                ? 'bg-card text-foreground shadow-soft'
                : 'text-tertiary hover:text-foreground'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <MoneyKpis />
          <PnLTab />
        </div>
      )}
      {activeTab === 'subscriptions' && <SubscriptionsTab />}
      {activeTab === 'ai-costs' && <AICostsTab />}
      {activeTab === 'credits' && <CreditEconomyTab />}
      {activeTab === 'unit-econ' && <UnitEconomicsSection />}
    </div>
  )
}
