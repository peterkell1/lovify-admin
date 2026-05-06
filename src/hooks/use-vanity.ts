import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface VanitySnapshot {
  totalUsers: number
  totalSongsLifetime: number
  totalSongsThisMonth: number
  totalVideosLifetime: number
  totalVideosThisMonth: number
  totalAudioSeconds: number // sum of generated_songs.duration + generated_videos.duration_seconds
}

function startOfMonthISO(): string {
  const d = new Date()
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), 1).toISOString()
}

export function useVanitySnapshot() {
  return useQuery({
    queryKey: ['vanity-snapshot'],
    queryFn: async (): Promise<VanitySnapshot> => {
      const monthStart = startOfMonthISO()

      const [
        usersRes,
        songsLifetimeRes,
        songsMonthRes,
        videosLifetimeRes,
        videosMonthRes,
        songDurationsRes,
        videoDurationsRes,
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('generated_songs').select('id', { count: 'exact', head: true }),
        supabase
          .from('generated_songs')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', monthStart),
        supabase.from('generated_videos').select('id', { count: 'exact', head: true }),
        supabase
          .from('generated_videos')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', monthStart),
        // For audio minutes — need to actually fetch duration values, not just count
        supabase.from('generated_songs').select('duration').limit(50000),
        supabase.from('generated_videos').select('duration_seconds').limit(50000),
      ])

      const sumSongDuration = (songDurationsRes.data ?? []).reduce(
        (s: number, r: { duration: number | null }) => s + (r.duration ?? 0),
        0
      )
      const sumVideoDuration = (videoDurationsRes.data ?? []).reduce(
        (s: number, r: { duration_seconds: number | null }) =>
          s + (r.duration_seconds ?? 0),
        0
      )

      return {
        totalUsers: usersRes.count ?? 0,
        totalSongsLifetime: songsLifetimeRes.count ?? 0,
        totalSongsThisMonth: songsMonthRes.count ?? 0,
        totalVideosLifetime: videosLifetimeRes.count ?? 0,
        totalVideosThisMonth: videosMonthRes.count ?? 0,
        totalAudioSeconds: sumSongDuration + sumVideoDuration,
      }
    },
    staleTime: 10 * 60_000,
  })
}
