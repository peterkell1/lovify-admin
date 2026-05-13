import { SubscriptionsTab } from '@/components/finance/SubscriptionsTab'

export default function SubscriptionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Subscriptions</h1>
        <p className="text-tertiary text-sm mt-1">Active and historical subscriptions with Stripe drill-down</p>
      </div>

      <SubscriptionsTab />
    </div>
  )
}
