import { useState } from 'react'
import { defaultProductFilters, type ProductFilters } from '@/hooks/use-product-dashboard'
import { useDashboardSnapshot } from '@/hooks/use-dashboard-snapshot'
import { ProductFiltersBar } from '@/components/product/ProductFiltersBar'
import { NorthStar } from '@/components/product/NorthStar'
import { CausalChain } from '@/components/product/CausalChain'
import { EngagementGrid } from '@/components/product/EngagementGrid'
import { OnboardingFunnel } from '@/components/product/OnboardingFunnel'
import { CroChatDrawer, CroChatLauncher } from '@/components/product/CroChatDrawer'
import { MostImportantThing } from '@/components/product/MostImportantThing'

export default function ProductDashboardPage() {
  const [filters, setFilters] = useState<ProductFilters>(() => defaultProductFilters())
  const [chatOpen, setChatOpen] = useState(false)
  const { snapshot, isLoading: snapshotLoading } = useDashboardSnapshot(filters)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Product Health</h1>
        <p className="text-tertiary text-sm mt-1">
          Is the product working for the users we have?
        </p>
      </div>

      {/* TOP — what to do this week, AI directive */}
      <MostImportantThing
        snapshot={snapshot}
        snapshotLoading={snapshotLoading}
        onDiscuss={() => setChatOpen(true)}
      />

      <ProductFiltersBar filters={filters} onChange={setFilters} />

      {/* Section 0: Onboarding → Paid Funnel (the daily flow) */}
      <OnboardingFunnel filters={filters} />

      {/* Section 1: North Star */}
      <NorthStar filters={filters} />

      {/* Section 2: Causal Chain */}
      <CausalChain filters={filters} />

      {/* Section 3: Engagement Quality */}
      <EngagementGrid filters={filters} />

      {/* Definitions footer */}
      <div className="rounded-lg border border-border bg-muted/40 p-4 text-[11px] text-muted-foreground space-y-1">
        <p>
          <strong className="text-foreground">Locked definitions:</strong> Active user = opened
          app in last 28 days · A listen = played ≥30s · Activated = created song + 3+ replays in 7
          days · Habit-formed = activated + sessions on 4+ of first 14 days · New user = within 30
          days of signup.
        </p>
      </div>

      {/* CRO Chat — floating button + drawer */}
      <CroChatLauncher onClick={() => setChatOpen(true)} />
      <CroChatDrawer
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        snapshot={snapshot}
      />
    </div>
  )
}
