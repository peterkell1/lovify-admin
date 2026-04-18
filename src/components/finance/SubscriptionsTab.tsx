import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSubscriptions } from '@/hooks/use-finance'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Pagination } from '@/components/ui/pagination'
import { Avatar } from '@/components/ui/avatar'
import { SkeletonUserRow } from '@/components/ui/skeleton'
import { cn, formatDate } from '@/lib/utils'
import { ExternalLink } from 'lucide-react'

const STATUS_FILTERS = ['all', 'active', 'trialing', 'canceled', 'past_due'] as const

const statusBadge = (status: string) => {
  switch (status) {
    case 'active': return <Badge variant="success">{status}</Badge>
    case 'trialing': return <Badge variant="warning">{status}</Badge>
    case 'canceled': return <Badge variant="secondary">{status}</Badge>
    case 'past_due': return <Badge variant="destructive">{status}</Badge>
    default: return <Badge variant="outline">{status}</Badge>
  }
}

export function SubscriptionsTab() {
  const [status, setStatus] = useState<string>('all')
  const [page, setPage] = useState(1)
  const pageSize = 25
  const navigate = useNavigate()

  const { data, isLoading } = useSubscriptions({ status, page, pageSize })
  const subs = data?.subscriptions ?? []
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-6">
      {/* Status filter */}
      <div className="flex gap-1 bg-secondary rounded-xl p-1 w-fit">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => { setStatus(s); setPage(1) }}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer capitalize',
              status === s ? 'bg-card text-foreground shadow-soft' : 'text-tertiary hover:text-foreground'
            )}
          >
            {s}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <table className="w-full"><tbody>{Array.from({ length: 6 }).map((_, i) => <SkeletonUserRow key={i} />)}</tbody></table>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Credits/Mo</TableHead>
                  <TableHead>Period End</TableHead>
                  <TableHead>Stripe</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-tertiary py-12">No subscriptions found</TableCell>
                  </TableRow>
                ) : (
                  subs.map((sub) => (
                    <TableRow
                      key={sub.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/users/${sub.user_id}`)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar fallback={sub.display_name || sub.email || 'U'} size="sm" />
                          <div>
                            <p className="text-sm font-medium">{sub.display_name || 'No name'}</p>
                            <p className="text-xs text-tertiary">{sub.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">{sub.plan_id}</Badge>
                      </TableCell>
                      <TableCell>{statusBadge(sub.status)}</TableCell>
                      <TableCell className="text-sm font-mono">${(sub.price_cents / 100).toFixed(2)}</TableCell>
                      <TableCell className="text-sm">{sub.credits_per_month.toLocaleString()}</TableCell>
                      <TableCell className="text-sm text-tertiary">
                        {sub.current_period_end ? formatDate(sub.current_period_end) : '—'}
                      </TableCell>
                      <TableCell>
                        {sub.stripe_subscription_id ? (
                          <a
                            href={`https://dashboard.stripe.com/subscriptions/${sub.stripe_subscription_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-accent hover:text-accent/80 inline-flex items-center gap-1 text-xs"
                          >
                            <ExternalLink className="h-3 w-3" />
                            View
                          </a>
                        ) : (
                          <span className="text-xs text-tertiary">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Pagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} onPageChange={setPage} />
    </div>
  )
}
