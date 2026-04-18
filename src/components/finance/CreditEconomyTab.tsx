import { useCreditEconomy } from '@/hooks/use-finance'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { StatCard } from '@/components/dashboard/StatCard'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { Wallet, ArrowUpCircle, ArrowDownCircle, Layers } from 'lucide-react'
import { formatNumber } from '@/lib/utils'

export function CreditEconomyTab() {
  const { data, isLoading } = useCreditEconomy(30)

  if (isLoading || !data) {
    return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>
  }

  const netFlow = data.totalGranted - data.totalConsumed

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total in Circulation"
          value={formatNumber(data.totalBalance)}
          icon={<Wallet className="h-5 w-5" />}
          subtitle="Across all users"
        />
        <StatCard
          title="Granted (30d)"
          value={formatNumber(data.totalGranted)}
          icon={<ArrowUpCircle className="h-5 w-5" />}
        />
        <StatCard
          title="Consumed (30d)"
          value={formatNumber(data.totalConsumed)}
          icon={<ArrowDownCircle className="h-5 w-5" />}
        />
        <StatCard
          title="Net Flow (30d)"
          value={`${netFlow >= 0 ? '+' : ''}${formatNumber(netFlow)}`}
          icon={<Layers className="h-5 w-5" />}
          subtitle={netFlow >= 0 ? 'More granted than consumed' : 'More consumed than granted'}
        />
      </div>

      {/* Transaction type breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction Type Breakdown (30d)</CardTitle>
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
    </div>
  )
}
