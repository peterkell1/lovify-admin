import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBrowseVisions } from '@/hooks/use-content'
import { useToggleContentVisibility } from '@/hooks/use-users'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { formatDate } from '@/lib/utils'
import { Search, ChevronLeft, ChevronRight, Eye, EyeOff, ImageIcon } from 'lucide-react'
import { toast } from 'sonner'

export function ContentVisionsTab() {
  const [search, setSearch] = useState('')
  const [visibility, setVisibility] = useState<'all' | 'public' | 'private'>('all')
  const [page, setPage] = useState(1)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const navigate = useNavigate()
  const toggleVisibility = useToggleContentVisibility()

  const { data, isLoading } = useBrowseVisions({ page, pageSize: 24, search, visibility })
  const visions = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / 24)

  const handleToggle = async (e: React.MouseEvent, id: string, isPublic: boolean) => {
    e.stopPropagation()
    setTogglingId(id)
    try {
      await toggleVisibility.mutateAsync({ table: 'generated_visions', id, isPublic: !isPublic })
      toast.success(isPublic ? 'Vision unpublished' : 'Vision made public')
    } catch { toast.error('Failed to update') }
    finally { setTogglingId(null) }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-tertiary" />
          <Input placeholder="Search by prompt..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="pl-11 rounded-full h-11" />
        </div>
        <Select value={visibility} onChange={(e) => { setVisibility(e.target.value as 'all' | 'public' | 'private'); setPage(1) }} className="w-36">
          <option value="all">All</option>
          <option value="public">Public</option>
          <option value="private">Private</option>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>
      ) : visions.length === 0 ? (
        <div className="text-center py-20 text-tertiary">No visions found</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {visions.map((vision) => (
            <div key={vision.id} className="border border-border rounded-xl overflow-hidden bg-card group">
              <div className="relative aspect-square bg-muted">
                {vision.image_url ? (
                  <img src={vision.image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-tertiary/40" />
                  </div>
                )}
                <button
                  onClick={(e) => handleToggle(e, vision.id, vision.is_public)}
                  disabled={togglingId === vision.id}
                  className="absolute top-1.5 right-1.5 h-7 w-7 rounded-md bg-white/90 shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:opacity-50"
                >
                  {vision.is_public ? <EyeOff className="h-3.5 w-3.5 text-destructive" /> : <Eye className="h-3.5 w-3.5 text-tertiary" />}
                </button>
              </div>
              <div className="p-2.5 space-y-1">
                <p className="text-xs font-medium truncate">{vision.prompt || 'No prompt'}</p>
                <Badge variant={vision.is_public ? 'success' : 'outline'} className="text-[10px]">{vision.is_public ? 'Public' : 'Private'}</Badge>
                <button onClick={() => navigate(`/users/${vision.user_id}`)} className="text-[11px] text-accent hover:underline truncate block cursor-pointer">
                  {vision.display_name || vision.email || 'Unknown'}
                </button>
                <p className="text-[10px] text-tertiary">{formatDate(vision.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-tertiary">Page {page} of {totalPages} ({total} visions)</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      )}
    </div>
  )
}
