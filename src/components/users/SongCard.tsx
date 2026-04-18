import { useRef, useState } from 'react'
import type { UserSong } from '@/types/admin'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { useToggleContentVisibility } from '@/hooks/use-users'
import { Play, Pause, Music, Headphones, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

interface SongCardProps {
  song: UserSong
}

export function SongCard({ song }: SongCardProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [toggling, setToggling] = useState(false)
  const toggleVisibility = useToggleContentVisibility()

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!audioRef.current || !song.audio_url) return

    if (playing) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setPlaying(!playing)
  }

  const handleTimeUpdate = () => {
    if (!audioRef.current) return
    const pct = (audioRef.current.currentTime / audioRef.current.duration) * 100
    setProgress(pct)
  }

  const handleEnded = () => {
    setPlaying(false)
    setProgress(0)
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    audioRef.current.currentTime = pct * audioRef.current.duration
  }

  const handleTogglePublic = async (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    const newState = !song.is_public
    setToggling(true)
    try {
      await toggleVisibility.mutateAsync({
        table: 'generated_songs',
        id: song.id,
        isPublic: newState,
      })
      toast.success(newState ? 'Song made public' : 'Song unpublished')
    } catch {
      toast.error('Failed to update visibility')
    } finally {
      setToggling(false)
    }
  }

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card">
      {/* Cover image */}
      <div className="relative aspect-square bg-muted">
        {song.image_url ? (
          <img src={song.image_url} alt={song.title || ''} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-warm">
            <Music className="h-10 w-10 text-tertiary/40" />
          </div>
        )}

        {/* Play button overlay */}
        {song.audio_url && (
          <button
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center group cursor-pointer"
          >
            <div className="h-12 w-12 rounded-full bg-white/90 shadow-lg flex items-center justify-center opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all">
              {playing ? (
                <Pause className="h-5 w-5 text-foreground" />
              ) : (
                <Play className="h-5 w-5 text-foreground ml-0.5" />
              )}
            </div>
          </button>
        )}

        {/* Visibility toggle (top-right) */}
        <button
          onClick={handleTogglePublic}
          disabled={toggling}
          title={song.is_public ? 'Unpublish this song' : 'Make public'}
          className="absolute top-2 right-2 h-8 w-8 rounded-lg bg-white/90 shadow-sm flex items-center justify-center hover:bg-white transition-colors cursor-pointer disabled:opacity-50"
        >
          {song.is_public ? (
            <EyeOff className="h-4 w-4 text-destructive" />
          ) : (
            <Eye className="h-4 w-4 text-tertiary" />
          )}
        </button>
      </div>

      {/* Info */}
      <div className="p-3 space-y-2">
        <p className="font-semibold text-sm truncate">{song.title || 'Untitled'}</p>

        <div className="flex items-center gap-1.5 flex-wrap">
          {song.genre && <Badge variant="secondary" className="text-xs">{song.genre}</Badge>}
          <Badge variant={song.is_public ? 'success' : 'outline'} className="text-xs">
            {song.is_public ? 'Public' : 'Private'}
          </Badge>
        </div>

        {/* Progress bar */}
        {song.audio_url && (
          <div
            className="h-1.5 bg-muted rounded-full cursor-pointer overflow-hidden"
            onClick={handleSeek}
          >
            <div
              className="h-full bg-accent rounded-full transition-all duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-tertiary">
          <span>{formatDate(song.created_at)}</span>
          <div className="flex items-center gap-2">
            {song.duration && <span>{formatDuration(song.duration)}</span>}
            {song.play_count > 0 && (
              <span className="flex items-center gap-0.5">
                <Headphones className="h-3 w-3" />
                {song.play_count}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Hidden audio element */}
      {song.audio_url && (
        <audio
          ref={audioRef}
          src={song.audio_url}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          preload="none"
        />
      )}
    </div>
  )
}
