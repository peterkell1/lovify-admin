import { useState } from 'react'
import { useAuditLog } from '@/hooks/use-audit-log'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { formatDate } from '@/lib/utils'
import { ChevronLeft, ChevronRight, Shield } from 'lucide-react'

const ACTION_FILTERS = [
  { value: '', label: 'All Actions' },
  { value: 'grant_credits', label: 'Grant Credits' },
  { value: 'toggle_visibility', label: 'Toggle Visibility' },
  { value: 'ban_user', label: 'Ban User' },
  { value: 'update_subscription', label: 'Update Subscription' },
]

const actionBadge = (action: string) => {
  switch (action) {
    case 'grant_credits': return <Badge variant="success">{action}</Badge>
    case 'toggle_visibility': return <Badge variant="warning">{action}</Badge>
    case 'ban_user': return <Badge variant="destructive">{action}</Badge>
    default: return <Badge variant="outline">{action}</Badge>
  }
}

export default function AuditLogPage() {
  const [page, setPage] = useState(1)
  const [action, setAction] = useState('')
  const pageSize = 30

  const { data, isLoading } = useAuditLog({ page, pageSize, action: action || undefined })
  const entries = data?.entries ?? []
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Audit Log</h1>
          <p className="text-tertiary text-sm mt-1">Track every admin action</p>
        </div>
        <div className="w-48">
          <Select value={action} onChange={(e) => { setAction(e.target.value); setPage(1) }}>
            {ACTION_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-16"><Spinner className="h-8 w-8" /></div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="h-14 w-14 rounded-2xl bg-accent/10 text-accent flex items-center justify-center mb-4">
                <Shield className="h-7 w-7" />
              </div>
              <p className="text-tertiary font-medium">No audit entries yet</p>
              <p className="text-xs text-tertiary mt-1">Actions will appear here once the audit table is created</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-sm text-tertiary whitespace-nowrap">
                      {formatDate(entry.created_at)}
                    </TableCell>
                    <TableCell className="text-sm">{entry.admin_email ?? entry.admin_user_id.slice(0, 8)}</TableCell>
                    <TableCell>{actionBadge(entry.action)}</TableCell>
                    <TableCell className="text-xs font-mono text-tertiary">
                      {entry.target_type && (
                        <span>
                          {entry.target_type}
                          {entry.target_id && ` / ${entry.target_id.slice(0, 8)}...`}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-tertiary max-w-xs">
                      {entry.details ? (
                        <div className="space-y-0.5">
                          {Object.entries(entry.details).map(([key, val]) => (
                            <div key={key}>
                              <span className="text-foreground font-medium">{key}:</span>{' '}
                              {String(val)}
                            </div>
                          ))}
                        </div>
                      ) : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-tertiary">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
