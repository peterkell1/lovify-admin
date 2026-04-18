import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

// ─── Onboarding Funnel ───

export interface FunnelStep {
  step: string
  count: number
  pct: number
}

export function useOnboardingFunnel() {
  return useQuery({
    queryKey: ['analytics-funnel'],
    queryFn: async () => {
      const [signupsRes, postSignupRes, firstSongRes, subscribedRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('has_completed_post_signup', true),
        supabase.from('generated_songs').select('user_id').limit(10000),
        supabase.from('subscriptions').select('user_id').eq('status', 'active'),
      ])

      const totalSignups = signupsRes.count ?? 0
      const postSignup = postSignupRes.count ?? 0
      const uniqueSongUsers = new Set(firstSongRes.data?.map((s) => s.user_id) ?? []).size
      const uniqueSubUsers = new Set(subscribedRes.data?.map((s) => s.user_id) ?? []).size

      const steps: FunnelStep[] = [
        { step: 'Signed Up', count: totalSignups, pct: 100 },
        { step: 'Post-Signup Done', count: postSignup, pct: totalSignups > 0 ? (postSignup / totalSignups) * 100 : 0 },
        { step: 'Created First Song', count: uniqueSongUsers, pct: totalSignups > 0 ? (uniqueSongUsers / totalSignups) * 100 : 0 },
        { step: 'Subscribed', count: uniqueSubUsers, pct: totalSignups > 0 ? (uniqueSubUsers / totalSignups) * 100 : 0 },
      ]

      return steps
    },
    staleTime: 5 * 60_000,
  })
}

// ─── User Segments ───

export interface UserSegment {
  segment: string
  count: number
  pct: number
}

export function useUserSegments() {
  return useQuery({
    queryKey: ['analytics-segments'],
    queryFn: async () => {
      const [totalRes, creditsRes, subsRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('user_credits').select('user_id, subscription_tier'),
        supabase.from('subscriptions').select('user_id, status'),
      ])

      const total = totalRes.count ?? 0
      const credits = creditsRes.data ?? []
      const subs = subsRes.data ?? []

      const activeSubUsers = new Set(subs.filter((s) => s.status === 'active').map((s) => s.user_id))
      const everSubUsers = new Set(subs.map((s) => s.user_id))

      let free = 0, active = 0, cancelled = 0
      for (const c of credits) {
        if (activeSubUsers.has(c.user_id)) active++
        else if (everSubUsers.has(c.user_id)) cancelled++
        else free++
      }

      const segments: UserSegment[] = [
        { segment: 'Free', count: free, pct: total > 0 ? (free / total) * 100 : 0 },
        { segment: 'Active Subscriber', count: active, pct: total > 0 ? (active / total) * 100 : 0 },
        { segment: 'Cancelled', count: cancelled, pct: total > 0 ? (cancelled / total) * 100 : 0 },
      ]

      return segments
    },
    staleTime: 5 * 60_000,
  })
}

// ─── Generation Health (counts from actual content tables) ───

export interface GenHealthStat {
  type: string
  total: number
}

export function useGenerationHealth(days = 7) {
  return useQuery({
    queryKey: ['analytics-gen-health', days],
    queryFn: async () => {
      const since = new Date()
      since.setDate(since.getDate() - days)
      const sinceStr = since.toISOString()

      const [songsRes, visionsRes, videosRes] = await Promise.all([
        supabase.from('generated_songs').select('id', { count: 'exact', head: true }).gte('created_at', sinceStr),
        supabase.from('generated_visions').select('id', { count: 'exact', head: true }).gte('created_at', sinceStr),
        supabase.from('generated_videos').select('id', { count: 'exact', head: true }).gte('created_at', sinceStr),
      ])

      const stats: GenHealthStat[] = [
        { type: 'Songs', total: songsRes.count ?? 0 },
        { type: 'Visions', total: visionsRes.count ?? 0 },
        { type: 'Mind Movies', total: videosRes.count ?? 0 },
      ]

      return stats
    },
    staleTime: 60_000,
  })
}
