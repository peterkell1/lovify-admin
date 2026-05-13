import { useState, useMemo } from 'react'
import { useModerationLog, type ModerationLogRow } from '@/hooks/use-content'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { StatCard } from '@/components/dashboard/StatCard'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { SkeletonTableRow } from '@/components/ui/skeleton'
import { Dialog, DialogHeader, DialogTitle, DialogContent } from '@/components/ui/dialog'
import { formatDate } from '@/lib/utils'
import { Shield, AlertTriangle, Search, Eye, Ban, Layers } from 'lucide-react'

const SURFACE_OPTIONS = [
  { value: 'all', label: 'All surfaces' },
  { value: 'vision', label: 'Vision' },
  { value: 'mind_movie', label: 'Mind Movie' },
  { value: 'song_chat', label: 'Song Chat' },
  { value: 'song_lyrics', label: 'Song Lyrics' },
]

const LAYER_OPTIONS = [
  { value: 'all', label: 'All layers' },
  { value: 'keyword', label: 'Keyword (Layer 1)' },
  { value: 'llm', label: 'Haiku LLM (Layer 2)' },
  { value: 'output', label: 'Output (Layer 3)' },
]

const TIME_OPTIONS = [
  { value: 7, label: 'Last 7 days' },
  { value: 1, label: 'Last 24 hours' },
  { value: 30, label: 'Last 30 days' },
  { value: 90, label: 'Last 90 days' },
]

const layerBadge = (layer: string) => {
  switch (layer) {
    case 'keyword': return <Badge variant="destructive" className="text-xs">Keyword</Badge>
    case 'llm': return <Badge variant="warning" className="text-xs">LLM</Badge>
    case 'output': return <Badge variant="secondary" className="text-xs">Output</Badge>
    default: return <Badge variant="outline" className="text-xs">{layer}</Badge>
  }
}

export function ContentModerationTab() {
  const [surface, setSurface] = useState('all')
  const [layer, setLayer] = useState('all')
  const [days, setDays] = useState(7)
  const [search, setSearch] = useState('')
  const [selectedRow, setSelectedRow] = useState<ModerationLogRow | null>(null)

  const { data: rows, isLoading } = useModerationLog({ surface, layer, days })

  const filtered = useMemo(() => {
    if (!rows) return []
    if (!search) return rows
    const q = search.toLowerCase()
    return rows.filter((r) => r.prompt.toLowerCase().includes(q) || r.reason?.toLowerCase().includes(q))
  }, [rows, search])

  const stats = useMemo(() => {
    if (!rows) return { total: 0, keyword: 0, llm: 0, output: 0 }
    return {
      total: rows.length,
      keyword: rows.filter((r) => r.layer === 'keyword').length,
      llm: rows.filter((r) => r.layer === 'llm').length,
      output: rows.filter((r) => r.layer === 'output').length,
    }
  }, [rows])

  const offenders = useMemo(() => {
    if (!rows) return []
    const countMap = new Map<string, number>()
    for (const r of rows) {
      if (!r.user_id) continue
      countMap.set(r.user_id, (countMap.get(r.user_id) ?? 0) + 1)
    }
    return Array.from(countMap.entries())
      .filter(([, count]) => count >= 3)
      .sort((a, b) => b[1] - a[1])
      .map(([userId, count]) => ({ userId, count }))
  }, [rows])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Rejections" value={stats.total} icon={<Shield className="h-5 w-5" />} />
        <StatCard title="Keyword (L1)" value={stats.keyword} icon={<Ban className="h-5 w-5" />} subtitle="Regex blocklist" />
        <StatCard title="LLM (L2)" value={stats.llm} icon={<Layers className="h-5 w-5" />} subtitle="Haiku classifier" />
        <StatCard title="Repeat Offenders" value={offenders.length} icon={<AlertTriangle className="h-5 w-5" />} subtitle="3+ rejections" />
      </div>

      {offenders.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Repeat Offenders</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {offenders.map((o) => (
                <Badge key={o.userId} variant="destructive" className="text-xs">
                  {o.userId.slice(0, 8)}... ({o.count} rejections)
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-tertiary" />
          <Input placeholder="Search prompts..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-11 rounded-full h-11" />
        </div>
        <Select value={surface} onChange={(e) => setSurface(e.target.value)} className="w-40">
          {SURFACE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </Select>
        <Select value={layer} onChange={(e) => setLayer(e.target.value)} className="w-44">
          {LAYER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </Select>
        <Select value={String(days)} onChange={(e) => setDays(Number(e.target.value))} className="w-40">
          {TIME_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <table className="w-full"><tbody>{Array.from({ length: 5 }).map((_, i) => <SkeletonTableRow key={i} cols={6} />)}</tbody></table>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="h-14 w-14 rounded-2xl bg-success/10 text-success flex items-center justify-center mb-4">
                <Shield className="h-7 w-7" />
              </div>
              <p className="text-tertiary font-medium">No rejections found</p>
              <p className="text-xs text-tertiary mt-1">All content passed guardrails in this period</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Surface</TableHead>
                  <TableHead>Layer</TableHead>
                  <TableHead>Prompt</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="text-sm text-tertiary whitespace-nowrap">{formatDate(row.created_at)}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{row.surface}</Badge></TableCell>
                    <TableCell>{layerBadge(row.layer)}</TableCell>
                    <TableCell className="text-sm max-w-xs truncate">{row.prompt}</TableCell>
                    <TableCell className="text-xs text-tertiary max-w-xs truncate">{row.reason || '—'}</TableCell>
                    <TableCell>
                      <button onClick={() => setSelectedRow(row)} className="text-accent hover:text-accent/80 cursor-pointer">
                        <Eye className="h-4 w-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedRow} onClose={() => setSelectedRow(null)}>
        <DialogHeader onClose={() => setSelectedRow(null)}>
          <DialogTitle>Rejection Detail</DialogTitle>
        </DialogHeader>
        {selectedRow && (
          <DialogContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-tertiary text-xs font-medium">Surface</p>
                <Badge variant="outline" className="mt-1">{selectedRow.surface}</Badge>
              </div>
              <div>
                <p className="text-tertiary text-xs font-medium">Layer</p>
                <div className="mt-1">{layerBadge(selectedRow.layer)}</div>
              </div>
              <div>
                <p className="text-tertiary text-xs font-medium">Category</p>
                <p className="mt-1">{selectedRow.category || '—'}</p>
              </div>
              <div>
                <p className="text-tertiary text-xs font-medium">User ID</p>
                <p className="mt-1 font-mono text-xs">{selectedRow.user_id || '—'}</p>
              </div>
              <div>
                <p className="text-tertiary text-xs font-medium">Date</p>
                <p className="mt-1">{formatDate(selectedRow.created_at)}</p>
              </div>
            </div>

            <div>
              <p className="text-tertiary text-xs font-medium mb-1">Full Prompt</p>
              <div className="bg-secondary rounded-xl p-3 text-sm whitespace-pre-wrap break-words max-h-40 overflow-y-auto">
                {selectedRow.prompt}
              </div>
            </div>

            <div>
              <p className="text-tertiary text-xs font-medium mb-1">Reason</p>
              <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-3 text-sm">
                {selectedRow.reason || 'No reason recorded'}
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
}
