import { useMemo } from 'react'
import {
  useActivationAndHabit,
  useRetention,
  useReListenRate,
  useSongsPerActiveUser,
  usePlaysDistribution,
  useOnboardingFunnel,
  useCohortSummary,
  type ProductFilters,
} from './use-product-dashboard'
import { useReleaseAnnotations } from './use-release-annotations'
import type { DashboardSnapshot } from '@/lib/cro-prompts'

export function useDashboardSnapshot(filters: ProductFilters): {
  snapshot: DashboardSnapshot | null
  isLoading: boolean
} {
  const cohort = useCohortSummary(filters)
  const ah = useActivationAndHabit(filters)
  const ret = useRetention(filters)
  const reListen = useReListenRate(filters)
  const songsPerActive = useSongsPerActiveUser(filters)
  const plays = usePlaysDistribution(filters)
  const funnel = useOnboardingFunnel(filters)
  // Last 60 days of releases — enough context for the AI to correlate
  const sinceForReleases = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() - 60)
    return d.toISOString()
  }, [])
  const releases = useReleaseAnnotations({ since: sinceForReleases })

  const isLoading =
    cohort.isLoading ||
    ah.isLoading ||
    ret.isLoading ||
    reListen.isLoading ||
    songsPerActive.isLoading ||
    plays.isLoading ||
    funnel.isLoading

  const snapshot = useMemo<DashboardSnapshot | null>(() => {
    if (!cohort.data) return null
    const blockers: string[] = []

    // Detect "no data" markers from ground truth — empty user_sessions makes
    // habit + retention all read 0% with healthy denominators.
    const sessionEmpty =
      ret.data &&
      ret.data.d7.eligible > 5 &&
      ret.data.d7.rate === 0 &&
      ret.data.d30.rate === 0 &&
      ret.data.d90.rate === 0
    if (sessionEmpty) {
      blockers.push(
        "user_sessions table is empty — habit formation, D7/D30/D90 retention, and 'active users' all read 0%. The lovifymusic app needs to write to user_sessions on every app open."
      )
    }
    const activeUsersZero = songsPerActive.data?.activeUsers === 0
    if (activeUsersZero && (songsPerActive.data?.songsCreated ?? 0) > 0) {
      blockers.push(
        "Songs-per-active-user reads 0 because active users = 0 (same root cause as above — user_sessions is empty)."
      )
    }
    blockers.push(
      'No listening_events table exists — North Star (daily listening minutes per user), skip rate, time-of-day heatmap, and notification response rate are all unbuildable.'
    )
    blockers.push(
      'profiles.attribution_data is empty across all profiles — acquisition source, CAC by channel, and share-to-install conversion are unbuildable.'
    )
    blockers.push(
      'No share_events table exists — viral coefficient, share rate, and Growth dashboard are unbuildable.'
    )

    const funnelData = funnel.data
      ? {
          signedUp:
            funnelData_pickCount(funnel.data.steps, 'signed_up'),
          firstSong: funnelData_pickCount(funnel.data.steps, 'first_song'),
          firstVision: funnelData_pickCount(funnel.data.steps, 'first_vision'),
          exhaustedCredits: funnelData_pickCount(
            funnel.data.steps,
            'exhausted_credits'
          ),
          subscribed: funnelData_pickCount(funnel.data.steps, 'subscribed'),
        }
      : undefined

    return {
      cohort: {
        from: filters.cohortFrom,
        to: filters.cohortTo,
        size: cohort.data.users.length,
        excludedTestUsers: cohort.data.excludedTestUsers,
        manuallyExcluded: cohort.data.manuallyExcluded,
      },
      funnel: funnelData,
      activation: ah.data
        ? {
            rate: ah.data.activationRate,
            activated: ah.data.activated,
            cohortSize: ah.data.cohortSize,
          }
        : undefined,
      habit: ah.data
        ? {
            rate: ah.data.habitRate,
            formed: ah.data.habitFormed,
            activated: ah.data.activated,
          }
        : undefined,
      retention: ret.data
        ? {
            d7: ret.data.d7,
            d30: ret.data.d30,
            d90: ret.data.d90,
          }
        : undefined,
      reListenRate: reListen.data
        ? {
            rate: reListen.data.rate,
            replayed: reListen.data.reListened,
            total: reListen.data.totalSongs,
          }
        : undefined,
      songsPerActiveUser: songsPerActive.data
        ? {
            ratio: songsPerActive.data.ratio,
            songs: songsPerActive.data.songsCreated,
            activeUsers: songsPerActive.data.activeUsers,
          }
        : undefined,
      playsDistribution: plays.data,
      blockers,
      recentReleases: (releases.data ?? []).slice(0, 30).map((r) => ({
        occurredAt: r.occurred_at,
        title: r.title,
        description: r.description,
        kind: r.kind,
      })),
    }
  }, [
    cohort.data,
    ah.data,
    ret.data,
    reListen.data,
    songsPerActive.data,
    plays.data,
    funnel.data,
    releases.data,
    filters.cohortFrom,
    filters.cohortTo,
  ])

  return { snapshot, isLoading }
}

function funnelData_pickCount(
  steps: { key: string; count: number; blocked?: boolean }[],
  key: string
): number {
  return steps.find((s) => s.key === key && !s.blocked)?.count ?? 0
}
