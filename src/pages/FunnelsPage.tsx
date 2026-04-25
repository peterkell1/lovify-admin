import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Search, Megaphone, ExternalLink } from 'lucide-react'
import { useFunnels } from '@/hooks/use-funnels'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/utils'
import type { FunnelStatus } from '@/types/funnels'

const STATUS_TABS: Array<{ value: FunnelStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'live', label: 'Live' },
  { value: 'draft', label: 'Draft' },
  { value: 'paused', label: 'Paused' },
]

export default function FunnelsPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<FunnelStatus | 'all'>('all')
  const navigate = useNavigate()
  const { data: funnels = [], isLoading } = useFunnels({ search, status })
  const funnelBaseUrl = import.meta.env.VITE_FUNNEL_BASE_URL

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Funnels</h1>
          <p className="text-tertiary text-sm mt-1">
            Admin-configured ad funnels that live at{' '}
            {funnelBaseUrl ? (
              <span className="font-mono">{new URL(funnelBaseUrl).host}/&lt;slug&gt;</span>
            ) : (
              'funnel.trylovify.com/<slug>'
            )}
          </p>
        </div>
        <Button onClick={() => navigate('/funnels/new/templates')}>
          <Plus className="h-4 w-4" /> New funnel
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-tertiary" />
          <Input
            placeholder="Search by name or slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-1 rounded-lg bg-secondary p-1">
          {STATUS_TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setStatus(t.value)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                status === t.value
                  ? 'bg-white text-foreground shadow-sm'
                  : 'text-tertiary hover:text-foreground'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
      ) : funnels.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Megaphone className="h-10 w-10 text-tertiary" />
            <p className="mt-4 text-sm font-semibold text-foreground">No funnels yet</p>
            <p className="mt-1 text-sm text-tertiary">
              Create your first funnel to start running paid ad traffic.
            </p>
            <Button className="mt-6" onClick={() => navigate('/funnels/new/templates')}>
              <Plus className="h-4 w-4" /> New funnel
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {funnels.map((f) => {
            const adUrl = funnelBaseUrl ? `${funnelBaseUrl}/${f.slug}` : `/${f.slug}`
            return (
              <Card key={f.id}>
                <CardContent className="flex items-center justify-between gap-4 py-4">
                  <Link
                    to={`/funnels/${f.id}`}
                    className="flex flex-1 items-center gap-4 hover:opacity-80"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{f.name}</span>
                        <StatusBadge status={f.status} />
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-xs text-tertiary">
                        <span className="font-mono">/{f.slug}</span>
                        <span>· updated {formatDate(f.updated_at)}</span>
                      </div>
                    </div>
                  </Link>
                  <div className="flex items-center gap-2">
                    {f.status === 'live' ? (
                      <a
                        href={adUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary"
                      >
                        <ExternalLink className="h-3 w-3" /> Preview
                      </a>
                    ) : null}
                    <Link
                      to={`/funnels/${f.id}/edit`}
                      className="rounded-md border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary"
                    >
                      Edit
                    </Link>
                    <Link
                      to={`/funnels/${f.id}/analytics`}
                      className="rounded-md border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary"
                    >
                      Analytics
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: FunnelStatus }) {
  switch (status) {
    case 'live':
      return <Badge variant="default">Live</Badge>
    case 'draft':
      return <Badge variant="secondary">Draft</Badge>
    case 'paused':
      return <Badge variant="warning">Paused</Badge>
  }
}
