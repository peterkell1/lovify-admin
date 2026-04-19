import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBrowseVideos } from '@/hooks/use-content'
import { useToggleContentVisibility, useDeleteContent } from '@/hooks/use-users'
import { Pagination } from '@/components/ui/pagination'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import { SkeletonContentGrid } from '@/components/ui/skeleton'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { formatDate } from '@/lib/utils'
import { Eye, EyeOff, Film, Play, Clock, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export function ContentVideosTab() {
  const [visibility, setVisibility] = useState<'all' | 'public' | 'private'>('all')
  const [page, setPage] = useState(1)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const navigate = useNavigate()
  const toggleVisibility = useToggleContentVisibility()
  const deleteContent = useDeleteContent()
  const [confirmDelete, setConfirmDelete] = useState<{ id: string } | null>(null)

  const { data, isLoading } = useBrowseVideos({ page, pageSize: 24, visibility })
  const videos = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / 24)

  const handleToggle = async (e: React.MouseEvent, id: string, isPublic: boolean) => {
    e.stopPropagation()
    e.preventDefault()
    setTogglingId(id)
    try {
      await toggleVisibility.mutateAsync({ table: 'generated_videos', id, isPublic: !isPublic })
      toast.success(isPublic ? 'Video unpublished' : 'Video made public')
    } catch { toast.error('Failed to update') }
    finally { setTogglingId(null) }
  }

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return
    try {
      await deleteContent.mutateAsync({ table: 'generated_videos', id: confirmDelete.id })
      toast.success('Mind movie permanently deleted')
      setConfirmDelete(null)
    } catch {
      toast.error('Failed to delete mind movie')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-center">
        <Select value={visibility} onChange={(e) => { setVisibility(e.target.value as 'all' | 'public' | 'private'); setPage(1) }} className="w-36">
          <option value="all">All</option>
          <option value="public">Public</option>
          <option value="private">Private</option>
        </Select>
      </div>

      {isLoading ? (
        <SkeletonContentGrid count={8} aspect="video" />
      ) : videos.length === 0 ? (
        <div className="text-center py-20 text-tertiary">No mind movies found</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {videos.map((video) => (
            <div key={video.id} className="border border-border rounded-xl overflow-hidden bg-card group">
              <div className="relative aspect-video bg-muted">
                {(video.thumbnail_url || video.fallback_image_url) ? (
                  <img
                    src={(video.thumbnail_url || video.fallback_image_url)!}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : video.video_url ? (
                  <video
                    src={`${video.video_url}#t=0.1`}
                    className="w-full h-full object-cover"
                    preload="metadata"
                    muted
                    playsInline
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-warm">
                    <Film className="h-8 w-8 text-tertiary/60" />
                  </div>
                )}
                {video.video_url && (
                  <a href={video.video_url} target="_blank" rel="noopener noreferrer"
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="h-10 w-10 rounded-full bg-white/90 shadow flex items-center justify-center">
                      <Play className="h-4 w-4 ml-0.5" />
                    </div>
                  </a>
                )}
                <div className="absolute top-1.5 left-1.5 right-1.5 flex items-center justify-between z-10">
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => handleToggle(e, video.id, video.is_public)}
                      disabled={togglingId === video.id}
                      title={video.is_public ? 'Click to unpublish' : 'Click to make public'}
                      className={`h-7 px-2 rounded-md shadow-sm flex items-center justify-center gap-1 text-[10px] font-semibold cursor-pointer disabled:opacity-50 transition-colors ${video.is_public ? 'bg-success/90 text-white hover:bg-destructive/90' : 'bg-white/90 text-tertiary hover:bg-success/90 hover:text-white'}`}
                    >
                      {video.is_public ? <><Eye className="h-3 w-3" /> Live</> : <><EyeOff className="h-3 w-3" /> Off</>}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); e.preventDefault(); setConfirmDelete({ id: video.id }) }}
                      title="Delete permanently"
                      className="h-7 w-7 rounded-md shadow-sm flex items-center justify-center bg-white/90 text-destructive hover:bg-destructive hover:text-white cursor-pointer transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <Badge
                    variant={video.status === 'completed' || video.status === 'ready' ? 'success' : video.status === 'failed' ? 'destructive' : 'warning'}
                    className="text-[10px]"
                  >
                    {video.status}
                  </Badge>
                </div>
              </div>
              <div className="p-2.5 space-y-1">
                <div className="flex items-center gap-2 text-xs text-tertiary">
                  {video.duration_seconds && (
                    <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" />{video.duration_seconds}s</span>
                  )}
                  <Badge variant={video.is_public ? 'success' : 'outline'} className="text-[10px]">{video.is_public ? 'Public' : 'Private'}</Badge>
                </div>
                <button onClick={() => navigate(`/users/${video.user_id}`)} className="text-[11px] text-accent hover:underline truncate block cursor-pointer">
                  {video.display_name || video.email || 'Unknown'}
                </button>
                <p className="text-[10px] text-tertiary">{formatDate(video.created_at)}</p>
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
        title="Delete this mind movie permanently?"
        description="This mind movie will be permanently removed from the database. The creator will lose access to it. This action CANNOT be undone."
        confirmLabel="Delete permanently"
        loading={deleteContent.isPending}
      />
    </div>
  )
}
