import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBrowseSongs } from '@/hooks/use-content'
import { useToggleContentVisibility } from '@/hooks/use-users'
import { Input } from '@/components/ui/input'
import { Pagination } from '@/components/ui/pagination'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import { SkeletonContentGrid } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/utils'
import { Search, Play, Pause, Eye, EyeOff, Music } from 'lucide-react'
import { toast } from 'sonner'

export function ContentSongsTab() {
  const [search, setSearch] = useState('')
  const [visibility, setVisibility] = useState<'all' | 'public' | 'private'>('all')
  const [page, setPage] = useState(1)
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const navigate = useNavigate()
  const toggleVisibility = useToggleContentVisibility()

  const { data, isLoading } = useBrowseSongs({ page, pageSize: 24, search, visibility })
  const songs = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / 24)

  const handlePlay = (audioUrl: string, id: string) => {
    if (playingId === id) {
      audioRef.current?.pause()
      setPlayingId(null)
    } else {
      if (audioRef.current) {
        audioRef.current.src = audioUrl
        audioRef.current.play()
      }
      setPlayingId(id)
    }
  }

  const handleToggle = async (e: React.MouseEvent, id: string, isPublic: boolean) => {
    e.stopPropagation()
    setTogglingId(id)
    try {
      await toggleVisibility.mutateAsync({ table: 'generated_songs', id, isPublic: !isPublic })
      toast.success(isPublic ? 'Song unpublished' : 'Song made public')
    } catch { toast.error('Failed to update') }
    finally { setTogglingId(null) }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-tertiary" />
          <Input placeholder="Search by title..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="pl-11 rounded-full h-11" />
        </div>
        <Select value={visibility} onChange={(e) => { setVisibility(e.target.value as 'all' | 'public' | 'private'); setPage(1) }} className="w-36">
          <option value="all">All</option>
          <option value="public">Public</option>
          <option value="private">Private</option>
        </Select>
      </div>

      {isLoading ? (
        <SkeletonContentGrid count={12} />
      ) : songs.length === 0 ? (
        <div className="text-center py-20 text-tertiary">No songs found</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {songs.map((song) => (
            <div key={song.id} className="border border-border rounded-xl overflow-hidden bg-card group">
              <div className="relative aspect-square bg-muted">
                {song.image_url ? (
                  <img src={song.image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-warm">
                    <Music className="h-8 w-8 text-tertiary/40" />
                  </div>
                )}
                {song.audio_url && (
                  <button onClick={() => handlePlay(song.audio_url!, song.id)} className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <div className="h-10 w-10 rounded-full bg-white/90 shadow flex items-center justify-center">
                      {playingId === song.id ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
                    </div>
                  </button>
                )}
                <button
                  onClick={(e) => handleToggle(e, song.id, song.is_public)}
                  disabled={togglingId === song.id}
                  title={song.is_public ? 'Click to unpublish' : 'Click to make public'}
                  className={`absolute top-1.5 right-1.5 h-7 px-2 rounded-md shadow-sm flex items-center justify-center gap-1 text-[10px] font-semibold cursor-pointer disabled:opacity-50 transition-colors ${song.is_public ? 'bg-success/90 text-white hover:bg-destructive/90' : 'bg-white/90 text-tertiary hover:bg-success/90 hover:text-white'}`}
                >
                  {song.is_public ? <><Eye className="h-3 w-3" /> Live</> : <><EyeOff className="h-3 w-3" /> Off</>}
                </button>
              </div>
              <div className="p-2.5 space-y-1">
                <p className="text-sm font-semibold truncate">{song.title || 'Untitled'}</p>
                <div className="flex items-center gap-1.5">
                  {song.genre && <Badge variant="secondary" className="text-[10px]">{song.genre}</Badge>}
                  <Badge variant={song.is_public ? 'success' : 'outline'} className="text-[10px]">{song.is_public ? 'Public' : 'Private'}</Badge>
                </div>
                <button onClick={() => navigate(`/users/${song.user_id}`)} className="text-[11px] text-accent hover:underline truncate block cursor-pointer">
                  {song.display_name || song.email || 'Unknown'}
                </button>
                <p className="text-[10px] text-tertiary">{formatDate(song.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} total={total} pageSize={24} onPageChange={setPage} />

      <audio ref={audioRef} onEnded={() => setPlayingId(null)} preload="none" />
    </div>
  )
}
