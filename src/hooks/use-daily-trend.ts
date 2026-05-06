import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { isLikelyTestUser } from './use-product-dashboard'

export interface DailyTrendPoint {
  date: string // YYYY-MM-DD
  signups: number
  // Of users who signed up on this day, % who took the action.
  // Conversion is computed cumulative-as-of-now (a user who signed up today
  // and hasn't made a song yet but might tomorrow is counted as "no" for now).
  signupToFirstSongPct: number
  signupToFirstVisionPct: number
  signupToSubscribePct: number
  // Same-day rates: did they sign up AND do the action on the same calendar day?
  // These are the most useful "did our push help" signals because they're not
  // affected by users from earlier cohorts who eventually convert.
  sameDaySongPct: number
  sameDayVisionPct: number
}

interface UseDailyTrendOpts {
  days: number
  excludeTestUsers: boolean
}

const DAY_MS = 24 * 60 * 60 * 1000

function ymd(d: Date): string {
  return d.toISOString().split('T')[0]
}

export function useDailyTrend({ days, excludeTestUsers }: UseDailyTrendOpts) {
  return useQuery({
    queryKey: ['daily-trend', days, excludeTestUsers ? 'clean' : 'raw'],
    queryFn: async (): Promise<DailyTrendPoint[]> => {
      const since = new Date()
      since.setUTCHours(0, 0, 0, 0)
      since.setDate(since.getDate() - days + 1)
      const sinceISO = since.toISOString()

      // 1. Fetch profiles in window (with email/display_name for filtering)
      const profilesRes = await supabase
        .from('profiles')
        .select('id, email, display_name, created_at')
        .gte('created_at', sinceISO)
        .limit(20000)
      if (profilesRes.error) throw profilesRes.error
      let profiles = (profilesRes.data ?? []) as {
        id: string
        email: string | null
        display_name: string | null
        created_at: string
      }[]

      if (excludeTestUsers) {
        profiles = profiles.filter((p) => !isLikelyTestUser(p.email, p.display_name))
      }

      // 2. Apply manual exclusion list (if table exists)
      const exRes = await supabase
        .from('admin_excluded_users')
        .select('user_id')
        .limit(10000)
      if (!exRes.error && exRes.data) {
        const excluded = new Set(exRes.data.map((r) => r.user_id))
        profiles = profiles.filter((p) => !excluded.has(p.id))
      }

      const ids = profiles.map((p) => p.id).slice(0, 1000)

      // 3. Fetch songs/visions/subs for those users (any time, so we can detect
      // whether they ever converted — we'll cap windowing in the bucket logic).
      const [songsRes, visionsRes, subsRes] = await Promise.all([
        supabase
          .from('generated_songs')
          .select('user_id, created_at')
          .in('user_id', ids)
          .order('created_at', { ascending: true })
          .limit(50000),
        supabase
          .from('generated_visions')
          .select('user_id, created_at')
          .in('user_id', ids)
          .order('created_at', { ascending: true })
          .limit(50000),
        supabase
          .from('subscriptions')
          .select('user_id, status, created_at')
          .in('user_id', ids)
          .in('status', ['active', 'trialing'])
          .order('created_at', { ascending: true })
          .limit(10000),
      ])
      if (songsRes.error) throw songsRes.error
      if (visionsRes.error) throw visionsRes.error
      if (subsRes.error) throw subsRes.error

      // First-occurrence-per-user maps
      const firstSong = new Map<string, number>()
      for (const r of songsRes.data ?? []) {
        if (!firstSong.has(r.user_id))
          firstSong.set(r.user_id, new Date(r.created_at).getTime())
      }
      const firstVision = new Map<string, number>()
      for (const r of visionsRes.data ?? []) {
        if (!firstVision.has(r.user_id))
          firstVision.set(r.user_id, new Date(r.created_at).getTime())
      }
      const firstSub = new Map<string, number>()
      for (const r of subsRes.data ?? []) {
        if (!firstSub.has(r.user_id))
          firstSub.set(r.user_id, new Date(r.created_at).getTime())
      }

      // 4. Initialize day buckets for the entire window
      type Bucket = {
        signups: number
        firstSong: number
        firstVision: number
        firstSub: number
        sameDaySong: number
        sameDayVision: number
      }
      const buckets = new Map<string, Bucket>()
      const startMs = since.getTime()
      for (let i = 0; i < days; i++) {
        const d = new Date(startMs + i * DAY_MS)
        buckets.set(ymd(d), {
          signups: 0,
          firstSong: 0,
          firstVision: 0,
          firstSub: 0,
          sameDaySong: 0,
          sameDayVision: 0,
        })
      }

      // 5. Bucket each user's signup day, then mark conversions
      for (const p of profiles) {
        const signupMs = new Date(p.created_at).getTime()
        const day = ymd(new Date(p.created_at))
        const bucket = buckets.get(day)
        if (!bucket) continue
        bucket.signups += 1

        const songMs = firstSong.get(p.id)
        if (songMs !== undefined) {
          bucket.firstSong += 1
          // Same-day = song timestamp's UTC date matches signup date
          if (ymd(new Date(songMs)) === day && songMs >= signupMs) {
            bucket.sameDaySong += 1
          }
        }
        const visionMs = firstVision.get(p.id)
        if (visionMs !== undefined) {
          bucket.firstVision += 1
          if (ymd(new Date(visionMs)) === day && visionMs >= signupMs) {
            bucket.sameDayVision += 1
          }
        }
        const subMs = firstSub.get(p.id)
        if (subMs !== undefined) bucket.firstSub += 1
      }

      // 6. Build result array
      const result: DailyTrendPoint[] = []
      for (const [date, b] of buckets) {
        result.push({
          date,
          signups: b.signups,
          signupToFirstSongPct: b.signups > 0 ? b.firstSong / b.signups : 0,
          signupToFirstVisionPct: b.signups > 0 ? b.firstVision / b.signups : 0,
          signupToSubscribePct: b.signups > 0 ? b.firstSub / b.signups : 0,
          sameDaySongPct: b.signups > 0 ? b.sameDaySong / b.signups : 0,
          sameDayVisionPct: b.signups > 0 ? b.sameDayVision / b.signups : 0,
        })
      }
      result.sort((a, b) => a.date.localeCompare(b.date))
      return result
    },
    staleTime: 5 * 60_000,
  })
}
