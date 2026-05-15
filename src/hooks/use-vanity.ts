import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

const STALE = 5 * 60_000

const startOfMonthISO = (): string => {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString()
}

export const useTotalUsersLifetime = () => {
  return useQuery({
    queryKey: ['vanity', 'totalUsers'],
    queryFn: async () => {
      const { count } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
      return count ?? 0
    },
    staleTime: STALE,
  })
}

export const useTotalSongs = () => {
  return useQuery({
    queryKey: ['vanity', 'totalSongs'],
    queryFn: async () => {
      const monthStart = startOfMonthISO()
      const [lifetimeRes, monthRes] = await Promise.all([
        supabase.from('generated_songs').select('id', { count: 'exact', head: true }),
        supabase.from('generated_songs').select('id', { count: 'exact', head: true }).gte('created_at', monthStart),
      ])
      return {
        lifetime: lifetimeRes.count ?? 0,
        thisMonth: monthRes.count ?? 0,
      }
    },
    staleTime: STALE,
  })
}

export const useTotalMindMovies = () => {
  return useQuery({
    queryKey: ['vanity', 'totalMindMovies'],
    queryFn: async () => {
      const monthStart = startOfMonthISO()
      const [lifetimeRes, monthRes] = await Promise.all([
        supabase.from('generated_videos').select('id', { count: 'exact', head: true }),
        supabase.from('generated_videos').select('id', { count: 'exact', head: true }).gte('created_at', monthStart),
      ])
      return {
        lifetime: lifetimeRes.count ?? 0,
        thisMonth: monthRes.count ?? 0,
      }
    },
    staleTime: STALE,
  })
}

// Sum of generated_songs.duration (seconds). Returns null if the column
// is missing or the query errors — page hides the row in that case.
export const useTotalAudioMinutes = () => {
  return useQuery({
    queryKey: ['vanity', 'totalAudioMinutes'],
    queryFn: async (): Promise<number | null> => {
      const { data, error } = await supabase
        .from('generated_songs')
        .select('duration')
        .not('duration', 'is', null)

      if (error) return null
      const totalSeconds = (data ?? []).reduce(
        (sum, row) => sum + (Number(row.duration) || 0),
        0,
      )
      return Math.round(totalSeconds / 60)
    },
    staleTime: STALE,
  })
}
