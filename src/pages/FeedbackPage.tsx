import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { useFeedback, useFeedbackCounts, useUpdateFeedbackStatus } from '@/hooks/use-feedback'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { SkeletonTableRow } from '@/components/ui/skeleton'
import { Pagination } from '@/components/ui/pagination'
import { Dialog, DialogHeader, DialogTitle, DialogContent } from '@/components/ui/dialog'
import { formatDate } from '@/lib/utils'
import { MessageSquare, Check, RotateCcw, ExternalLink, Eye } from 'lucide-react'
import type { UserFeedbackEntry } from '@/types/admin'

const TYPE_FILTERS = [
  { value: '', label: 'All Types' },
  { value: 'general', label: 'General' },
  { value: 'feature', label: 'Feature idea' },
  { value: 'issue', label: 'Issue' },
]

const STATUS_FILTERS: { value: 'all' | 'pending' | 'reviewed'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending review' },
  { value: 'reviewed', label: 'Reviewed' },
]

const formatLabel = (s: string) =>
  s.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

const typeBadge = (type: string) => {
  switch (type) {
    case 'praise':
    case 'positive':
      return <Badge variant="success">{type}</Badge>
    case 'issue':
    case 'negative':
      return <Badge variant="destructive">{type}</Badge>
    case 'feature':
      return <Badge variant="warning">{type}</Badge>
    default:
      return <Badge variant="outline">{type}</Badge>
  }
}

export default function FeedbackPage() {
  const [page, setPage] = useState(1)
  const [feedbackType, setFeedbackType] = useState('')
  const [status, setStatus] = useState<'all' | 'pending' | 'reviewed'>('all')
  const [viewing, setViewing] = useState<UserFeedbackEntry | null>(null)
  const pageSize = 25

  const { data, isLoading } = useFeedback({
    page,
    pageSize,
    feedbackType: feedbackType || undefined,
    status,
  })
  const { data: counts } = useFeedbackCounts()
  const updateStatus = useUpdateFeedbackStatus()

  const entries = data?.entries ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const handleToggleReviewed = async (id: string, reviewed: boolean) => {
    try {
      await updateStatus.mutateAsync({ id, reviewed })
      toast.success(reviewed ? 'Marked as reviewed' : 'Marked as pending')
    } catch (e) {
      console.error(e)
      toast.error('Failed to update feedback')
    }
  }

  const handleView = (entry: UserFeedbackEntry) => {
    setViewing(entry)
    if (!entry.reviewed_at) {
      // Auto-mark as reviewed when an admin opens it. Fire-and-forget — no toast,
      // no blocking. Optimistically reflect it in the open dialog so the footer
      // button flips to "Reopen" without waiting on the round-trip.
      setViewing({ ...entry, reviewed_at: new Date().toISOString(), needs_review: false })
      updateStatus.mutate({ id: entry.id, reviewed: true })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Feedback</h1>
          <p className="text-tertiary text-sm mt-1">
            Messages submitted by users from in-app feedback
            {counts && (
              <>
                {' '}
                · <span className="font-semibold text-foreground">{counts.pending}</span> pending review of{' '}
                <span className="font-semibold text-foreground">{counts.total}</span> total
              </>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <div className="w-44">
            <Select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as typeof status)
                setPage(1)
              }}
            >
              {STATUS_FILTERS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </Select>
          </div>
          <div className="w-44">
            <Select
              value={feedbackType}
              onChange={(e) => {
                setFeedbackType(e.target.value)
                setPage(1)
              }}
            >
              {TYPE_FILTERS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <table className="w-full">
              <tbody>
                {Array.from({ length: 6 }).map((_, i) => <SkeletonTableRow key={i} cols={6} />)}
              </tbody>
            </table>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="h-14 w-14 rounded-2xl bg-accent/10 text-accent flex items-center justify-center mb-4">
                <MessageSquare className="h-7 w-7" />
              </div>
              <p className="text-tertiary font-medium">No feedback yet</p>
              <p className="text-xs text-tertiary mt-1">Submissions from the in-app feedback sheet will land here</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => {
                  const reviewed = !!entry.reviewed_at
                  return (
                    <TableRow key={entry.id}>
                      <TableCell className="text-sm text-tertiary whitespace-nowrap">
                        {formatDate(entry.created_at)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {entry.user_id ? (
                          <Link
                            to={`/users/${entry.user_id}`}
                            className="inline-flex items-center gap-1 text-accent hover:underline"
                          >
                            {entry.user_display_name || entry.user_email || entry.user_id.slice(0, 8)}
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        ) : (
                          <span className="text-tertiary italic">Anonymous</span>
                        )}
                      </TableCell>
                      <TableCell>{typeBadge(entry.feedback_type)}</TableCell>
                      <TableCell className="max-w-md">
                        <p className="text-sm text-foreground whitespace-pre-wrap break-words">
                          {entry.message || <span className="text-tertiary italic">No message</span>}
                        </p>
                        {entry.trigger && entry.trigger !== 'manual' && (
                          <p className="text-[11px] text-tertiary mt-1">via {entry.trigger}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        {reviewed ? (
                          <Badge variant="success" className="whitespace-nowrap">Reviewed</Badge>
                        ) : entry.needs_review ? (
                          <Badge variant="destructive" className="whitespace-nowrap">Needs review</Badge>
                        ) : (
                          <Badge variant="outline" className="whitespace-nowrap">Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleView(entry)}
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant={reviewed ? 'outline' : 'default'}
                            disabled={updateStatus.isPending}
                            onClick={() => handleToggleReviewed(entry.id, !reviewed)}
                          >
                            {reviewed ? (
                              <>
                                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                                Reopen
                              </>
                            ) : (
                              <>
                                <Check className="h-3.5 w-3.5 mr-1" />
                                Review
                              </>
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Pagination
        page={page}
        totalPages={totalPages}
        total={total}
        pageSize={pageSize}
        onPageChange={setPage}
      />

      <FeedbackDetailDialog
        entry={viewing}
        onClose={() => setViewing(null)}
        onToggleReviewed={(id, reviewed) => {
          handleToggleReviewed(id, reviewed)
          setViewing(null)
        }}
        toggling={updateStatus.isPending}
      />
    </div>
  )
}

interface FeedbackDetailDialogProps {
  entry: UserFeedbackEntry | null
  onClose: () => void
  onToggleReviewed: (id: string, reviewed: boolean) => void
  toggling: boolean
}

function FeedbackDetailDialog({ entry, onClose, onToggleReviewed, toggling }: FeedbackDetailDialogProps) {
  if (!entry) return null
  const reviewed = !!entry.reviewed_at

  return (
    <Dialog open={!!entry} onClose={onClose}>
      <DialogHeader onClose={onClose}>
        <DialogTitle>Feedback details</DialogTitle>
        <p className="text-xs text-tertiary">{formatDate(entry.created_at)}</p>
      </DialogHeader>
      <DialogContent className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          {typeBadge(entry.feedback_type)}
          {reviewed ? (
            <Badge variant="success">Reviewed{entry.reviewed_at ? ` · ${formatDate(entry.reviewed_at)}` : ''}</Badge>
          ) : entry.needs_review ? (
            <Badge variant="destructive">Needs review</Badge>
          ) : (
            <Badge variant="outline">Pending</Badge>
          )}
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-tertiary mb-1.5">From</p>
          {entry.user_id ? (
            <Link
              to={`/users/${entry.user_id}`}
              className="inline-flex items-center gap-1 text-accent hover:underline text-sm"
            >
              {entry.user_display_name || entry.user_email || entry.user_id}
              <ExternalLink className="h-3 w-3" />
            </Link>
          ) : (
            <span className="text-sm text-tertiary italic">Anonymous</span>
          )}
          {entry.user_email && entry.user_display_name && (
            <p className="text-xs text-tertiary mt-0.5">{entry.user_email}</p>
          )}
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-tertiary mb-1.5">Message</p>
          <div className="rounded-lg border border-border bg-secondary/50 p-3">
            {entry.message ? (
              <p className="text-sm text-foreground whitespace-pre-wrap break-words">{entry.message}</p>
            ) : (
              <p className="text-sm text-tertiary italic">No message provided</p>
            )}
          </div>
        </div>

        {(entry.trigger || (entry.metadata && Object.keys(entry.metadata).filter((k) => k !== 'source').length > 0)) && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-tertiary mb-1.5">Metadata</p>
            <div className="rounded-lg border border-border bg-secondary/50 p-3 space-y-1">
              {entry.trigger && (
                <div className="text-xs">
                  <span className="text-foreground font-medium">Source:</span>{' '}
                  <span className="text-tertiary">{formatLabel(entry.trigger)}</span>
                </div>
              )}
              {entry.metadata && Object.entries(entry.metadata)
                .filter(([key]) => key !== 'source')
                .map(([key, val]) => (
                  <div key={key} className="text-xs">
                    <span className="text-foreground font-medium">{formatLabel(key)}:</span>{' '}
                    <span className="text-tertiary break-all">{val === null ? '—' : String(val)}</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button
            variant={reviewed ? 'outline' : 'default'}
            disabled={toggling}
            onClick={() => onToggleReviewed(entry.id, !reviewed)}
          >
            {reviewed ? (
              <>
                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                Reopen
              </>
            ) : (
              <>
                <Check className="h-3.5 w-3.5 mr-1" />
                Review
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
