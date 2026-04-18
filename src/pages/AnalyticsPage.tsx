import { useOnboardingFunnel, useUserSegments, useGenerationHealth } from '@/hooks/use-analytics'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Skeleton, SkeletonChart } from '@/components/ui/skeleton'
import { formatNumber } from '@/lib/utils'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'

const PIE_COLORS = ['hsl(27 7% 48%)', 'hsl(15 85% 60%)', 'hsl(38 92% 50%)']

const tooltipStyle = {
  backgroundColor: 'hsl(25 100% 97%)',
  border: '1px solid hsl(30 15% 92%)',
  borderRadius: '12px',
  fontSize: '13px',
}

export default function AnalyticsPage() {
  const { data: funnel, isLoading: funnelLoading } = useOnboardingFunnel()
  const { data: segments, isLoading: segLoading } = useUserSegments()
  const { data: genHealth, isLoading: genLoading } = useGenerationHealth(7)

  const isLoading = funnelLoading || segLoading || genLoading

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div><Skeleton className="h-7 w-32" /><Skeleton className="h-4 w-64 mt-2" /></div>
        <SkeletonChart />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-52 rounded-xl" />
          <Skeleton className="h-52 rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-tertiary text-sm mt-1">Onboarding funnel, user segments, and generation health</p>
      </div>

      {/* Onboarding Funnel */}
      <Card>
        <CardHeader><CardTitle>Onboarding Funnel</CardTitle></CardHeader>
        <CardContent>
          {!funnel || funnel.length === 0 ? (
            <p className="text-sm text-tertiary text-center py-8">No funnel data</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={funnel} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(30 15% 92%)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: 'hsl(27 7% 48%)' }} />
                  <YAxis type="category" dataKey="step" tick={{ fontSize: 12, fill: 'hsl(27 7% 48%)' }} width={140} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => [formatNumber(Number(v)), 'Users']} />
                  <Bar dataKey="count" fill="hsl(15 85% 60%)" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
                {funnel.map((step) => (
                  <div key={step.step} className="bg-secondary rounded-xl p-3 text-center">
                    <p className="text-xs text-tertiary font-medium">{step.step}</p>
                    <p className="text-xl font-bold mt-1">{formatNumber(step.count)}</p>
                    <p className="text-xs text-accent font-semibold">{step.pct.toFixed(1)}%</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* User Segments */}
        <Card>
          <CardHeader><CardTitle>User Segments</CardTitle></CardHeader>
          <CardContent>
            {!segments || segments.length === 0 ? (
              <p className="text-sm text-tertiary text-center py-8">No segment data</p>
            ) : (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width={180} height={180}>
                  <PieChart>
                    <Pie data={segments} dataKey="count" nameKey="segment" cx="50%" cy="50%" outerRadius={80} innerRadius={50}>
                      {segments.map((_entry, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-3">
                  {segments.map((seg, i) => (
                    <div key={seg.segment} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span className="text-sm font-medium">{seg.segment}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold">{formatNumber(seg.count)}</span>
                        <span className="text-xs text-tertiary ml-2">({seg.pct.toFixed(1)}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Content Created (7 days) */}
        <Card>
          <CardHeader><CardTitle>Content Created (7 days)</CardTitle></CardHeader>
          <CardContent>
            {!genHealth || genHealth.every((g) => g.total === 0) ? (
              <p className="text-sm text-tertiary text-center py-8">No content created in the last 7 days</p>
            ) : (
              <div className="space-y-4">
                {genHealth.map((g) => (
                  <div key={g.type} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{g.type}</span>
                      <span className="text-lg font-bold">{g.total}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
