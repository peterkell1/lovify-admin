import { useComputeCostPerOutput, useGrossMargin } from '@/hooks/use-business-health'
import { MetricCard, type MetricStatus } from './MetricCard'
import { MissingDataCard } from '@/components/product/MissingDataCard'

function fmtMoney(usd: number, opts?: { precise?: boolean }): string {
  if (opts?.precise) return `$${usd.toFixed(3)}`
  if (usd >= 10_000) return `$${(usd / 1_000).toFixed(1)}K`
  return `$${usd.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
}

function fmtPct(p: number): string {
  return `${(p * 100).toFixed(1)}%`
}

function statusForCostPctOfRev(p: number): MetricStatus {
  if (p <= 0.3) return 'good'
  if (p <= 0.6) return 'ok'
  return 'bad'
}

export function CostsSection() {
  const cost = useComputeCostPerOutput(30)
  const margin = useGrossMargin(30)

  return (
    <div>
      <div className="mb-3">
        <h3 className="text-base font-semibold text-foreground">What does it cost to run?</h3>
        <p className="text-xs text-tertiary mt-0.5">
          Compute spend per song, per user, and as a chunk of revenue.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <MetricCard
          question="How much does each generated song cost us?"
          value={cost.data ? fmtMoney(cost.data.costPerSongUsd, { precise: true }) : undefined}
          isLoading={cost.isLoading}
          detail={
            cost.data
              ? `${fmtMoney(cost.data.totalCostUsd)} ÷ ${cost.data.totalSongs.toLocaleString()} songs (last 30d)`
              : undefined
          }
          plainEnglish="The average AI compute spend on each song generation. Includes music generation + image generation + LLM tokens."
          goal="Want this trending DOWN as models get cheaper"
          status={cost.data && cost.data.costPerSongUsd > 0 ? 'good' : undefined}
          deltaDirection="down-is-good"
        />

        <MetricCard
          question="What % of revenue goes to compute?"
          value={margin.data ? fmtPct(margin.data.costAsPctOfRevenue) : undefined}
          isLoading={margin.isLoading}
          detail={
            margin.data
              ? `${fmtMoney(margin.data.costs)} costs ÷ ${fmtMoney(margin.data.revenue)} revenue (last 30d)`
              : undefined
          }
          plainEnglish="Of every dollar we make, how many cents go to AI compute. Lower = healthier unit economics."
          goal="Want <30% · over 60% = unsustainable"
          status={margin.data ? statusForCostPctOfRev(margin.data.costAsPctOfRevenue) : undefined}
          deltaDirection="down-is-good"
        />

        <MetricCard
          question="How much does each active user cost in compute?"
          value={
            cost.data?.totalUsers === 0
              ? '—'
              : cost.data
                ? fmtMoney(cost.data.costPerActiveUserUsd, { precise: true })
                : undefined
          }
          isLoading={cost.isLoading}
          detail={
            cost.data
              ? cost.data.totalUsers > 0
                ? `${fmtMoney(cost.data.totalCostUsd)} ÷ ${cost.data.totalUsers.toLocaleString()} active users`
                : `Active-users count is 0 — user_sessions empty`
              : undefined
          }
          plainEnglish="AI compute cost per active user per month. Lower = each user is cheaper to serve."
          status={cost.data?.totalUsers === 0 ? 'no-data' : undefined}
          noDataReason={
            cost.data?.totalUsers === 0
              ? 'user_sessions table is empty — once lovifymusic logs daily app opens, this lights up.'
              : undefined
          }
          goal="Track this against ARPU — must stay well below"
        />

        <MissingDataCard
          title="What are infra costs?"
          reason="No infra-cost data tracked. AWS/Vercel/Supabase bills aren't recorded here."
          hint="Add a monthly infra_costs entry to track this manually, or wire each provider's billing API."
        />

        <MissingDataCard
          title="What's our total monthly burn?"
          reason="Burn = all costs (compute + infra + salaries + tools) minus revenue. We only track compute."
          hint="Add a manual monthly_burn entry for non-compute spend (payroll, infra, SaaS tools)."
        />
      </div>
    </div>
  )
}
