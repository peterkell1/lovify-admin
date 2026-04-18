import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { useRevenueChart } from '@/hooks/use-dashboard-stats'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { format, parseISO } from 'date-fns'

export function RevenueChart() {
  const { data, isLoading } = useRevenueChart()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue vs Costs (30 days)</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[280px] w-full" />
        ) : !data || data.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-sm text-tertiary">
            No revenue data yet. This will populate once daily_pnl_stats has data.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(30 15% 92%)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: 'hsl(27 7% 48%)' }}
                tickFormatter={(v) => format(parseISO(v), 'MMM d')}
              />
              <YAxis
                tick={{ fontSize: 12, fill: 'hsl(27 7% 48%)' }}
                tickFormatter={(v) => `$${v}`}
              />
              <Tooltip
                formatter={(value) => [`$${Number(value).toFixed(2)}`, '']}
                labelFormatter={(label) => format(parseISO(label as string), 'MMM d, yyyy')}
                contentStyle={{
                  backgroundColor: 'hsl(25 100% 97%)',
                  border: '1px solid hsl(30 15% 92%)',
                  borderRadius: '12px',
                  fontSize: '13px',
                }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="hsl(142 76% 36%)"
                fill="hsl(142 76% 36% / 0.1)"
                name="Revenue"
              />
              <Area
                type="monotone"
                dataKey="costs"
                stroke="hsl(15 85% 60%)"
                fill="hsl(15 85% 60% / 0.1)"
                name="Costs"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
