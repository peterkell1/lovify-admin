import { useState } from 'react'
import { cn } from '@/lib/utils'
import { PnLTab } from '@/components/finance/PnLTab'
import { AICostsTab } from '@/components/finance/AICostsTab'
import { SubscriptionsTab } from '@/components/finance/SubscriptionsTab'
import { CreditEconomyTab } from '@/components/finance/CreditEconomyTab'

const tabs = [
  { id: 'pnl', label: 'Profit & Loss' },
  { id: 'ai-costs', label: 'AI Costs' },
  { id: 'subscriptions', label: 'Subscriptions' },
  { id: 'credits', label: 'Credit Economy' },
] as const

type TabId = (typeof tabs)[number]['id']

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState<TabId>('pnl')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Finance</h1>
        <p className="text-tertiary text-sm mt-1">Revenue, costs, subscriptions, and credit economy</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-secondary rounded-xl p-1">
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

      {/* Tab content */}
      {activeTab === 'pnl' && <PnLTab />}
      {activeTab === 'ai-costs' && <AICostsTab />}
      {activeTab === 'subscriptions' && <SubscriptionsTab />}
      {activeTab === 'credits' && <CreditEconomyTab />}
    </div>
  )
}
