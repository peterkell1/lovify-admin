import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { useRevenueChart } from '@/hooks/use-dashboard-stats'
import { Skeleton } from '@/components/ui/skeleton'
import { DateRangeFilter, computeRange, type PresetRange } from '@/components/ui/date-range-filter'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { format, parseISO } from 'date-fns'

const PRESET_LABELS: Record<PresetRange, string> = {
  '3d': 'Last 3 days',
  '1w': 'Last week',
  '1m': 'This month',
  '3m': 'Last 3 months',
  '1y': 'Last year',
  'custom': 'Custom range',
}

export function RevenueChart() {
  const [preset, setPreset] = useState<PresetRange>('1m')
  const [range, setRange] = useState(computeRange('1m'))

  const { data, isLoading } = useRevenueChart(range)

  const handleChange = (newPreset: PresetRange, newRange: { from: string; to: string }) => {
    setPreset(newPreset)
    setRange(newRange)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <CardTitle>Revenue vs Costs</CardTitle>
            <p className="text-xs text-tertiary mt-1">
              {PRESET_LABELS[preset]} · {range.from} → {range.to}
            </p>
          </div>
          <DateRangeFilter value={preset} range={range} onChange={handleChange} />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[280px] w-full" />
        ) : !data || data.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-sm text-tertiary">
            No revenue data for this period.
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
              <Legend />
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
