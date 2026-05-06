import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useLtvByCohort, useMonthlyChurn } from '@/hooks/use-business-health'
import { MetricCard, type MetricStatus } from './MetricCard'
import { MissingDataCard } from '@/components/product/MissingDataCard'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

function fmtMoney(usd: number): string {
  if (usd >= 10_000) return `$${(usd / 1_000).toFixed(1)}K`
  return `$${usd.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
}

function fmtPct(p: number): string {
  return `${(p * 100).toFixed(1)}%`
}

function statusForChurn(rate: number): MetricStatus {
  if (rate <= 0.05) return 'good' // <=5% monthly is great
  if (rate <= 0.1) return 'ok'
  return 'bad'
}

export function UnitEconomicsSection() {
  const churn = useMonthlyChurn(30)
  const ltv = useLtvByCohort(12)

  return (
    <div>
      <div className="mb-3">
        <h3 className="text-base font-semibold text-foreground">
          Are we acquiring users profitably?
        </h3>
        <p className="text-xs text-tertiary mt-0.5">
          For every dollar we spend to get a user, how many do we get back?
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
        <MetricCard
          question="How many paying users are leaving each month?"
          value={churn.data ? fmtPct(churn.data.churnRate) : undefined}
          isLoading={churn.isLoading}
          detail={
            churn.data
              ? `${churn.data.cancelledInWindow} of ${churn.data.activeAtStart} cancelled in last 30d`
              : undefined
          }
          plainEnglish="% of paying subscribers who cancelled this month. Lower is better — every churned user is one you lose forever (or have to re-acquire)."
          goal="Want <5% monthly · >10% = leak"
          status={churn.data ? statusForChurn(churn.data.churnRate) : undefined}
          deltaDirection="down-is-good"
        />

        <MissingDataCard
          title="What's it cost to acquire each user? (CAC)"
          reason="We don't track marketing spend per channel yet, and attribution_data is empty across all profiles."
          hint="Two things needed: (1) marketing_spend table imported daily from Meta/Google/TikTok, (2) attribution_data populated on each profile from your install-attribution SDK."
        />

        <MissingDataCard
          title="Is each acquisition channel paying off? (LTV/CAC)"
          reason="Needs CAC by channel × LTV by channel. Both depend on the data above."
          hint="Once attribution + marketing spend are wired, this lights up automatically."
        />

        <MissingDataCard
          title="How fast does each channel pay back?"
          reason="CAC payback period = CAC ÷ monthly revenue per user. Same blockers as CAC."
          hint="Goal once unblocked: <12 months payback for sustainable growth."
        />
      </div>

      {/* LTV by cohort chart */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">
            Is each new month of signups worth more than the last?
          </CardTitle>
          <p className="text-[11px] text-tertiary mt-0.5">
            Average lifetime revenue per signup, grouped by signup month. Newer cohorts have less
            lifetime accrued — compare same age, not absolute height.
          </p>
        </CardHeader>
        <CardContent>
          {ltv.isLoading ? (
            <Skeleton className="h-[220px] w-full" />
          ) : !ltv.data || ltv.data.length === 0 ? (
            <p className="text-xs text-tertiary py-12 text-center">
              No cohort revenue data yet.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={ltv.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(30 15% 92%)" />
                <XAxis dataKey="cohort" tick={{ fontSize: 11, fill: 'hsl(27 7% 48%)' }} />
                <YAxis
                  tick={{ fontSize: 11, fill: 'hsl(27 7% 48%)' }}
                  tickFormatter={(v) => `$${v}`}
                />
                <Tooltip
                  formatter={(v, name) => {
                    if (name === 'ltvPerSignup') return [fmtMoney(Number(v)), 'LTV / signup']
                    return [String(v), String(name)]
                  }}
                  labelFormatter={(label) => `Cohort: ${label}`}
                  contentStyle={{
                    backgroundColor: 'hsl(25 100% 97%)',
                    border: '1px solid hsl(30 15% 92%)',
                    borderRadius: '12px',
                    fontSize: '13px',
                  }}
                />
                <Bar
                  dataKey="ltvPerSignup"
                  name="LTV per signup"
                  fill="hsl(15 85% 60%)"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
          <p className="text-[10px] text-amber-600 mt-2 leading-snug">
            ⚠️ Approximation: each subscription counted as one full charge. Real LTV requires
            invoice-level history from Stripe webhook events.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
