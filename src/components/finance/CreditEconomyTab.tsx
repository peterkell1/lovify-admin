import { useState } from 'react'
import { useCreditEconomy } from '@/hooks/use-finance'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { StatCard } from '@/components/dashboard/StatCard'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import { SkeletonCard } from '@/components/ui/skeleton'
import { Wallet, ArrowUpCircle, ArrowDownCircle, Layers } from 'lucide-react'
import { formatNumber } from '@/lib/utils'

const RANGE_OPTIONS = [
  { value: 7, label: 'Last 7 days' },
  { value: 30, label: 'Last 30 days' },
  { value: 90, label: 'Last 90 days' },
  { value: 365, label: 'Last 365 days' },
] as const

const RANGE_SUFFIX: Record<number, string> = {
  7: '7d',
  30: '30d',
  90: '90d',
  365: '1y',
}

export function CreditEconomyTab() {
  const [days, setDays] = useState<number>(30)
  const { data, isLoading } = useCreditEconomy(days)
  const suffix = RANGE_SUFFIX[days] ?? `${days}d`

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-tertiary">
          Showing credit activity for the selected time range.
        </p>
        <Select
          value={String(days)}
          onChange={(e) => setDays(Number(e.target.value))}
          className="w-44"
        >
          {RANGE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </Select>
      </div>

      {isLoading || !data ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total in Circulation"
              value={formatNumber(data.totalBalance)}
              icon={<Wallet className="h-5 w-5" />}
              subtitle="Across all users"
            />
            <StatCard
              title={`Granted (${suffix})`}
              value={formatNumber(data.totalGranted)}
              icon={<ArrowUpCircle className="h-5 w-5" />}
            />
            <StatCard
              title={`Consumed (${suffix})`}
              value={formatNumber(data.totalConsumed)}
              icon={<ArrowDownCircle className="h-5 w-5" />}
            />
            <StatCard
              title={`Net Flow (${suffix})`}
              value={`${data.totalGranted - data.totalConsumed >= 0 ? '+' : ''}${formatNumber(data.totalGranted - data.totalConsumed)}`}
              icon={<Layers className="h-5 w-5" />}
              subtitle={data.totalGranted - data.totalConsumed >= 0 ? 'More granted than consumed' : 'More consumed than granted'}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Transaction Type Breakdown ({suffix})</CardTitle>
            </CardHeader>
            <CardContent>
              {data.byType.length === 0 ? (
                <p className="text-sm text-tertiary text-center py-6">No transaction data</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Count</TableHead>
                      <TableHead className="text-right">Net Credits</TableHead>
                      <TableHead className="text-right">Direction</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.byType.map((t) => (
                      <TableRow key={t.type}>
                        <TableCell>
                          <Badge variant="outline" className="text-xs font-mono">{t.type}</Badge>
                        </TableCell>
                        <TableCell className="text-right text-sm">{t.count.toLocaleString()}</TableCell>
                        <TableCell className={`text-right text-sm font-mono ${t.total >= 0 ? 'text-success' : 'text-destructive'}`}>
                          {t.total >= 0 ? '+' : ''}{t.total.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant={t.total >= 0 ? 'success' : 'destructive'} className="text-xs">
                            {t.total >= 0 ? 'Grant' : 'Deduct'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
