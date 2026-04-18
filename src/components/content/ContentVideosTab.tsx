import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBrowseVideos } from '@/hooks/use-content'
import { useToggleContentVisibility } from '@/hooks/use-users'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import { SkeletonContentGrid } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/utils'
import { ChevronLeft, ChevronRight, Eye, EyeOff, Film, Play, Clock } from 'lucide-react'
import { toast } from 'sonner'

export function ContentVideosTab() {
  const [visibility, setVisibility] = useState<'all' | 'public' | 'private'>('all')
  const [page, setPage] = useState(1)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const navigate = useNavigate()
  const toggleVisibility = useToggleContentVisibility()

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
        <SkeletonContentGrid count={8} />
      ) : videos.length === 0 ? (
        <div className="text-center py-20 text-tertiary">No mind movies found</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {videos.map((video) => (
            <div key={video.id} className="border border-border rounded-xl overflow-hidden bg-card group">
              <div className="relative aspect-video bg-muted">
                {video.thumbnail_url ? (
                  <img src={video.thumbnail_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Film className="h-8 w-8 text-tertiary/40" />
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
                <div className="absolute top-1.5 left-1.5 right-1.5 flex items-center justify-between">
                  <button
                    onClick={(e) => handleToggle(e, video.id, video.is_public)}
                    disabled={togglingId === video.id}
                    className="h-7 w-7 rounded-md bg-white/90 shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:opacity-50 z-10"
                  >
                    {video.is_public ? <EyeOff className="h-3.5 w-3.5 text-destructive" /> : <Eye className="h-3.5 w-3.5 text-tertiary" />}
                  </button>
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

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-tertiary">Page {page} of {totalPages} ({total} videos)</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      )}
    </div>
  )
}
