import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBrowseVisions } from '@/hooks/use-content'
import { useToggleContentVisibility, useDeleteContent } from '@/hooks/use-users'
import { Input } from '@/components/ui/input'
import { Pagination } from '@/components/ui/pagination'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import { SkeletonContentGrid } from '@/components/ui/skeleton'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { formatDate } from '@/lib/utils'
import { Search, Eye, EyeOff, ImageIcon, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export function ContentVisionsTab() {
  const [search, setSearch] = useState('')
  const [visibility, setVisibility] = useState<'all' | 'public' | 'private'>('all')
  const [page, setPage] = useState(1)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const navigate = useNavigate()
  const toggleVisibility = useToggleContentVisibility()
  const deleteContent = useDeleteContent()
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; prompt: string } | null>(null)

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

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return
    try {
      await deleteContent.mutateAsync({
        table: 'generated_visions',
        id: confirmDelete.id,
        metadata: { prompt: confirmDelete.prompt },
      })
      toast.success('Vision permanently deleted')
      setConfirmDelete(null)
    } catch {
      toast.error('Failed to delete vision')
    }
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
        <SkeletonContentGrid count={12} />
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
                <div className="absolute top-1.5 right-1.5 flex gap-1">
                  <button
                    onClick={(e) => handleToggle(e, vision.id, vision.is_public)}
                    disabled={togglingId === vision.id}
                    title={vision.is_public ? 'Click to unpublish' : 'Click to make public'}
                    className={`h-7 px-2 rounded-md shadow-sm flex items-center justify-center gap-1 text-[10px] font-semibold cursor-pointer disabled:opacity-50 transition-colors ${vision.is_public ? 'bg-success/90 text-white hover:bg-destructive/90' : 'bg-white/90 text-tertiary hover:bg-success/90 hover:text-white'}`}
                  >
                    {vision.is_public ? <><Eye className="h-3 w-3" /> Live</> : <><EyeOff className="h-3 w-3" /> Off</>}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setConfirmDelete({ id: vision.id, prompt: vision.prompt || 'No prompt' }) }}
                    title="Delete permanently"
                    className="h-7 w-7 rounded-md shadow-sm flex items-center justify-center bg-white/90 text-destructive hover:bg-destructive hover:text-white cursor-pointer transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
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

      <Pagination page={page} totalPages={totalPages} total={total} pageSize={24} onPageChange={setPage} />

      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete this vision permanently?"
        description={`"${(confirmDelete?.prompt ?? '').slice(0, 80)}${(confirmDelete?.prompt?.length ?? 0) > 80 ? '...' : ''}" will be permanently removed from the database. The creator will lose access to it. This action CANNOT be undone.`}
        confirmLabel="Delete permanently"
        loading={deleteContent.isPending}
      />
    </div>
  )
}
