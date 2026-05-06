import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

// ─── Filter types ─────────────────────────────────────────────────

export type ContentType = 'all' | 'songs' | 'visions' | 'videos'
export type FirstWeekBehavior = 'all' | '1_song' | '3_songs' | '5_plus_songs'

export interface ProductFilters {
  cohortFrom: string // ISO date (YYYY-MM-DD)
  cohortTo: string // ISO date (YYYY-MM-DD)
  contentType: ContentType
  firstWeekBehavior: FirstWeekBehavior
  acquisitionSource: string // free text or 'all' — currently not stored in DB; reserved
  quizGoal: string // 'all' | 'love' | 'wealth' | ... — reserved (needs funnel join)
  excludeTestUsers: boolean
}

// ─── Test/BS email heuristic ──────────────────────────────────────
//
// Filters out emails that are almost certainly internal, test, or
// keyboard-mashed gibberish. Tunable: edit INTERNAL_DOMAINS / TYPO_DOMAINS
// or the regex rules below.

const INTERNAL_DOMAINS = ['trylovify.com', 'adventure.holdings', 'lovify.com']
const TYPO_DOMAINS = [
  'gmial.com',
  'gnail.com',
  'gmal.com',
  'gmaill.com',
  'hotmial.com',
  'yaho.com',
  'yahooo.com',
  'm.con',
  'm.com',
]

// Adjacent home-row / top-row / bottom-row 3-letter runs in either direction
const KEYBOARD_RUNS = [
  // top row
  'qwe', 'wer', 'ert', 'rty', 'tyu', 'yui', 'uio', 'iop',
  'poi', 'oiu', 'iuy', 'uyt', 'ytr', 'tre', 'rew', 'ewq',
  // home row
  'asd', 'sdf', 'dfg', 'fgh', 'ghj', 'hjk', 'jkl',
  'lkj', 'kjh', 'jhg', 'hgf', 'gfd', 'fds', 'dsa',
  // bottom row
  'zxc', 'xcv', 'cvb', 'vbn', 'bnm',
  'mnb', 'nbv', 'bvc', 'vcx', 'cxz',
]

// Letter pairs that almost never appear in real English/Latin names but
// are common in home-row keyboard mashes.
const MASH_BIGRAMS = new Set([
  'jh', 'hj', 'kj', 'jk', 'lk', 'jl', 'lj',
  'sd', 'ds', 'fg', 'gf',
  'sj', 'js', 'jc', 'cj',
  'kd', 'dk', 'dj', 'jd', 'sk', 'ks',
  'mx', 'xm', 'xj', 'jx',
])

function looksLikeMash(s: string | null | undefined): boolean {
  if (!s) return false
  const x = s.toLowerCase().replace(/[^a-z]/g, '')
  if (x.length < 4) return false

  // 3-char keyboard runs (qwe, asd, lkj, kjh, …)
  if (KEYBOARD_RUNS.some((r) => x.includes(r))) return true

  // 2+ mash bigrams (or 1+ in a short string)
  let mashCount = 0
  for (let i = 0; i < x.length - 1; i++) {
    if (MASH_BIGRAMS.has(x.slice(i, i + 2))) mashCount++
  }
  if (mashCount >= 2) return true
  if (mashCount >= 1 && x.length <= 7) return true

  // No vowels in 6+ alpha chars — almost certainly a mash
  if (x.length >= 6 && !/[aeiou]/.test(x)) return true

  // Very low vowel ratio in long strings
  if (x.length >= 9) {
    const vowels = (x.match(/[aeiou]/g) || []).length
    if (vowels / x.length < 0.18) return true
  }

  return false
}

export function isLikelyTestUser(
  email: string | null | undefined,
  displayName?: string | null
): boolean {
  if (!email) return true // missing email — treat as suspect
  const e = email.toLowerCase().trim()
  if (!e.includes('@')) return true

  const [local, domain] = e.split('@')
  if (!local || !domain) return true

  // Internal/admin domains
  if (INTERNAL_DOMAINS.some((d) => domain === d || domain.endsWith('.' + d))) return true
  // Obvious typo domains
  if (TYPO_DOMAINS.includes(domain)) return true

  // 'test' anywhere in the local — testhamza, testone, hamzatest44, test123
  if (/test/.test(local)) return true

  // Plus-aliasing — almost always devs/QA
  if (local.includes('+')) return true

  // Short alphabet-only mash (≤4 chars)
  if (/^[a-z]{1,4}$/.test(local)) return true

  // Repeating-pair mash like "asdasd", "abab", "lkjlkj"
  if (/^([a-z]{2,4})\1+$/.test(local)) return true

  // Generalized mash detection on email local-part
  if (looksLikeMash(local)) return true

  // Generalized mash detection on display name
  // (catches cases like email='friendly@gmail.com' but name='lkjasd')
  if (displayName && looksLikeMash(displayName)) return true

  return false
}

// Backwards-compat shim — kept so any external callers still work.
export function isLikelyTestEmail(email: string | null | undefined): boolean {
  return isLikelyTestUser(email)
}

export function defaultProductFilters(): ProductFilters {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - 90)
  return {
    cohortFrom: from.toISOString().split('T')[0],
    cohortTo: to.toISOString().split('T')[0],
    contentType: 'all',
    firstWeekBehavior: 'all',
    acquisitionSource: 'all',
    quizGoal: 'all',
    excludeTestUsers: true,
  }
}

function filtersKey(f: ProductFilters) {
  return [
    f.cohortFrom,
    f.cohortTo,
    f.contentType,
    f.firstWeekBehavior,
    f.acquisitionSource,
    f.quizGoal,
    f.excludeTestUsers ? 'clean' : 'raw',
  ] as const
}

// ─── Cohort users (shared base) ───────────────────────────────────

interface CohortUser {
  id: string
  created_at: string
  email: string | null
  display_name?: string | null
}

export interface CohortFetchResult {
  users: CohortUser[]
  rawTotal: number
  excludedTestUsers: number
  manuallyExcluded: number
}

const DAY_MS_FETCH = 24 * 60 * 60 * 1000

async function fetchCohortFull(f: ProductFilters): Promise<CohortFetchResult> {
  // Inclusive end-of-day on cohortTo
  const toEnd = new Date(f.cohortTo)
  toEnd.setUTCHours(23, 59, 59, 999)

  let query = supabase
    .from('profiles')
    .select('id, created_at, email, display_name')
    .gte('created_at', f.cohortFrom)
    .lte('created_at', toEnd.toISOString())
    .limit(10000)

  if (f.quizGoal !== 'all') {
    query = query.contains('quiz_goals', [f.quizGoal])
  }

  const { data, error } = await query
  if (error) throw error
  let cohort = (data ?? []) as CohortUser[]

  const rawTotal = cohort.length
  let excludedTestUsers = 0
  let manuallyExcluded = 0

  if (f.excludeTestUsers) {
    const before = cohort.length
    cohort = cohort.filter((u) => !isLikelyTestUser(u.email, u.display_name))
    excludedTestUsers = before - cohort.length
  }

  // Manual admin exclusions — always applied (independent of the test-user
  // heuristic toggle). Gracefully no-ops if the table doesn't exist yet.
  {
    const exRes = await supabase
      .from('admin_excluded_users')
      .select('user_id')
      .limit(10000)
    if (!exRes.error && exRes.data) {
      const excludedSet = new Set(exRes.data.map((r) => r.user_id))
      const before = cohort.length
      cohort = cohort.filter((u) => !excludedSet.has(u.id))
      manuallyExcluded = before - cohort.length
    }
  }

  // Apply first-week-behavior filter if set
  if (f.firstWeekBehavior !== 'all' && cohort.length > 0) {
    const ids = cohort.map((u) => u.id).slice(0, 1000)
    const songsRes = await supabase
      .from('generated_songs')
      .select('user_id, created_at')
      .in('user_id', ids)
      .limit(50000)
    if (songsRes.error) throw songsRes.error

    const firstWeekCount = new Map<string, number>()
    const signupByUser = new Map(cohort.map((u) => [u.id, new Date(u.created_at).getTime()]))
    for (const s of (songsRes.data ?? []) as { user_id: string; created_at: string }[]) {
      const signup = signupByUser.get(s.user_id)
      if (signup === undefined) continue
      if (new Date(s.created_at).getTime() <= signup + 7 * DAY_MS_FETCH) {
        firstWeekCount.set(s.user_id, (firstWeekCount.get(s.user_id) ?? 0) + 1)
      }
    }

    cohort = cohort.filter((u) => {
      const c = firstWeekCount.get(u.id) ?? 0
      if (f.firstWeekBehavior === '1_song') return c === 1
      if (f.firstWeekBehavior === '3_songs') return c === 3
      if (f.firstWeekBehavior === '5_plus_songs') return c >= 5
      return true
    })
  }

  return { users: cohort, rawTotal, excludedTestUsers, manuallyExcluded }
}

async function fetchCohort(f: ProductFilters): Promise<CohortUser[]> {
  return (await fetchCohortFull(f)).users
}

export function useCohortProfiles(f: ProductFilters) {
  return useQuery({
    queryKey: ['product-cohort', ...filtersKey(f)],
    queryFn: () => fetchCohort(f),
    staleTime: 5 * 60_000,
  })
}

export function useCohortSummary(f: ProductFilters) {
  return useQuery({
    queryKey: ['product-cohort-summary', ...filtersKey(f)],
    queryFn: () => fetchCohortFull(f),
    staleTime: 5 * 60_000,
  })
}

// ─── Distinct quiz goals (for filter dropdown) ────────────────────

export function useQuizGoalOptions() {
  return useQuery({
    queryKey: ['product-quiz-goals'],
    queryFn: async (): Promise<{ goal: string; count: number }[]> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('quiz_goals')
        .not('quiz_goals', 'is', null)
        .limit(5000)
      if (error) throw error

      const counts = new Map<string, number>()
      for (const row of (data ?? []) as { quiz_goals: unknown }[]) {
        const goals = row.quiz_goals
        if (!Array.isArray(goals)) continue
        for (const g of goals) {
          if (typeof g !== 'string' || !g.trim()) continue
          counts.set(g, (counts.get(g) ?? 0) + 1)
        }
      }
      return Array.from(counts.entries())
        .map(([goal, count]) => ({ goal, count }))
        .sort((a, b) => b.count - a.count)
    },
    staleTime: 10 * 60_000,
  })
}

// ─── Retention tiles (D7 / D30 / D90) ─────────────────────────────

export interface RetentionResult {
  d7: { retained: number; eligible: number; rate: number }
  d30: { retained: number; eligible: number; rate: number }
  d90: { retained: number; eligible: number; rate: number }
}

const DAY_MS = 24 * 60 * 60 * 1000

export function useRetention(f: ProductFilters) {
  return useQuery({
    queryKey: ['product-retention', ...filtersKey(f)],
    queryFn: async (): Promise<RetentionResult> => {
      const cohort = await fetchCohort(f)
      if (cohort.length === 0) {
        return {
          d7: { retained: 0, eligible: 0, rate: 0 },
          d30: { retained: 0, eligible: 0, rate: 0 },
          d90: { retained: 0, eligible: 0, rate: 0 },
        }
      }

      const ids = cohort.map((u) => u.id).slice(0, 1000)
      const { data: sessionsRaw, error } = await supabase
        .from('user_sessions')
        .select('user_id, date')
        .in('user_id', ids)
        .limit(100000)
      if (error) throw error
      const sessions = (sessionsRaw ?? []) as { user_id: string; date: string }[]

      // Group sessions by user_id → set of date strings
      const sessionsByUser = new Map<string, Set<string>>()
      for (const s of sessions) {
        if (!sessionsByUser.has(s.user_id)) sessionsByUser.set(s.user_id, new Set())
        sessionsByUser.get(s.user_id)!.add(s.date)
      }

      const now = Date.now()

      function compute(day: number) {
        let eligible = 0
        let retained = 0
        for (const u of cohort) {
          const signup = new Date(u.created_at).getTime()
          if (now - signup < day * DAY_MS) continue // not old enough
          eligible += 1
          const userSessions = sessionsByUser.get(u.id)
          if (!userSessions) continue
          const threshold = signup + day * DAY_MS
          // any session date >= signup + day?
          for (const d of userSessions) {
            if (new Date(d).getTime() >= threshold) {
              retained += 1
              break
            }
          }
        }
        return { retained, eligible, rate: eligible > 0 ? retained / eligible : 0 }
      }

      return {
        d7: compute(7),
        d30: compute(30),
        d90: compute(90),
      }
    },
    staleTime: 5 * 60_000,
  })
}

// ─── Activation rate + Habit formation ────────────────────────────
//
// Activation = signed-up user with a song created within 7 days of signup
//   that has play_count >= 3 (lifetime — we don't have play timestamps).
// Habit = activated user with user_sessions on 4+ distinct days within
//   their first 14 days post-signup.

export interface ActivationHabitResult {
  cohortSize: number
  activated: number
  habitFormed: number
  activationRate: number
  habitRate: number // habitFormed / activated
}

export function useActivationAndHabit(f: ProductFilters) {
  return useQuery({
    queryKey: ['product-activation-habit', ...filtersKey(f)],
    queryFn: async (): Promise<ActivationHabitResult> => {
      const cohort = await fetchCohort(f)
      if (cohort.length === 0) {
        return { cohortSize: 0, activated: 0, habitFormed: 0, activationRate: 0, habitRate: 0 }
      }
      const ids = cohort.map((u) => u.id).slice(0, 1000)

      const [songsRes, sessionsRes] = await Promise.all([
        supabase
          .from('generated_songs')
          .select('user_id, created_at, play_count')
          .in('user_id', ids)
          .limit(50000),
        supabase
          .from('user_sessions')
          .select('user_id, date')
          .in('user_id', ids)
          .limit(100000),
      ])
      if (songsRes.error) throw songsRes.error
      if (sessionsRes.error) throw sessionsRes.error

      const songs = (songsRes.data ?? []) as { user_id: string; created_at: string; play_count: number }[]
      const sessions = (sessionsRes.data ?? []) as { user_id: string; date: string }[]

      // Index songs and sessions per user
      const songsByUser = new Map<string, typeof songs>()
      for (const s of songs) {
        const arr = songsByUser.get(s.user_id) ?? []
        arr.push(s)
        songsByUser.set(s.user_id, arr)
      }

      const sessionsByUser = new Map<string, Set<string>>()
      for (const s of sessions) {
        if (!sessionsByUser.has(s.user_id)) sessionsByUser.set(s.user_id, new Set())
        sessionsByUser.get(s.user_id)!.add(s.date)
      }

      let activated = 0
      let habitFormed = 0
      for (const u of cohort) {
        const signupMs = new Date(u.created_at).getTime()
        const sevenDayCutoff = signupMs + 7 * DAY_MS
        const fourteenDayCutoff = signupMs + 14 * DAY_MS

        // Activation: song with play_count >= 3 created within 7 days of signup
        const userSongs = songsByUser.get(u.id) ?? []
        const isActivated = userSongs.some(
          (s) => new Date(s.created_at).getTime() <= sevenDayCutoff && (s.play_count ?? 0) >= 3
        )
        if (!isActivated) continue
        activated += 1

        // Habit: 4+ distinct session days within first 14 days
        const userSessions = sessionsByUser.get(u.id)
        if (!userSessions) continue
        let daysWithSession = 0
        for (const d of userSessions) {
          const t = new Date(d).getTime()
          if (t >= signupMs && t <= fourteenDayCutoff) daysWithSession += 1
          if (daysWithSession >= 4) break
        }
        if (daysWithSession >= 4) habitFormed += 1
      }

      return {
        cohortSize: cohort.length,
        activated,
        habitFormed,
        activationRate: cohort.length > 0 ? activated / cohort.length : 0,
        habitRate: activated > 0 ? habitFormed / activated : 0,
      }
    },
    staleTime: 5 * 60_000,
  })
}

// ─── Plays-per-song distribution ─────────────────────────────────

export interface PlayBucket {
  label: string
  count: number
}

export function usePlaysDistribution(f: ProductFilters) {
  return useQuery({
    queryKey: ['product-plays-dist', ...filtersKey(f)],
    queryFn: async (): Promise<PlayBucket[]> => {
      const cohort = await fetchCohort(f)
      if (cohort.length === 0) return []
      const ids = cohort.map((u) => u.id).slice(0, 1000)

      const { data, error } = await supabase
        .from('generated_songs')
        .select('play_count')
        .in('user_id', ids)
        .limit(50000)
      if (error) throw error

      const buckets = [
        { label: '0', match: (n: number) => n === 0 },
        { label: '1–2', match: (n: number) => n >= 1 && n <= 2 },
        { label: '3–5', match: (n: number) => n >= 3 && n <= 5 },
        { label: '6–10', match: (n: number) => n >= 6 && n <= 10 },
        { label: '11–25', match: (n: number) => n >= 11 && n <= 25 },
        { label: '26+', match: (n: number) => n >= 26 },
      ]
      const counts = buckets.map((b) => ({ label: b.label, count: 0 }))
      for (const row of data ?? []) {
        const n = row.play_count ?? 0
        const i = buckets.findIndex((b) => b.match(n))
        if (i >= 0) counts[i].count += 1
      }
      return counts
    },
    staleTime: 5 * 60_000,
  })
}

// ─── Re-listen rate (% songs played 3+ times by their creator) ────

export interface ReListenResult {
  totalSongs: number
  reListened: number
  rate: number
}

export function useReListenRate(f: ProductFilters) {
  return useQuery({
    queryKey: ['product-relisten', ...filtersKey(f)],
    queryFn: async (): Promise<ReListenResult> => {
      const cohort = await fetchCohort(f)
      if (cohort.length === 0) return { totalSongs: 0, reListened: 0, rate: 0 }
      const ids = cohort.map((u) => u.id).slice(0, 1000)

      const { data, error } = await supabase
        .from('generated_songs')
        .select('play_count')
        .in('user_id', ids)
        .limit(50000)
      if (error) throw error
      const rows = (data ?? []) as { play_count: number | null }[]
      const total = rows.length
      const reListened = rows.filter((r) => (r.play_count ?? 0) >= 3).length
      return { totalSongs: total, reListened, rate: total > 0 ? reListened / total : 0 }
    },
    staleTime: 5 * 60_000,
  })
}

// ─── Onboarding → paid funnel ─────────────────────────────────────

export interface FunnelStep {
  key: string
  label: string
  count: number
  pctOfPrev: number // 0..1, conversion from previous step
  pctOfTop: number // 0..1, conversion from signup
  blocked?: boolean // step requires data we don't have yet
  blockedReason?: string
}

export interface OnboardingFunnel {
  steps: FunnelStep[]
  signedUpToday: number
  paidToday: number
  windowLabel: string
}

export function useOnboardingFunnel(f: ProductFilters) {
  return useQuery({
    queryKey: ['product-onboarding-funnel', ...filtersKey(f)],
    queryFn: async (): Promise<OnboardingFunnel> => {
      const cohort = await fetchCohort(f)
      const signedUp = cohort.length
      const ids = cohort.map((u) => u.id).slice(0, 1000)

      let firstSongUsers = 0
      let firstVisionUsers = 0
      let exhaustedUsers = 0
      let subscribedUsers = 0

      if (ids.length > 0) {
        const [songsRes, visionsRes, creditsRes, subsRes] = await Promise.all([
          supabase.from('generated_songs').select('user_id').in('user_id', ids).limit(50000),
          supabase.from('generated_visions').select('user_id').in('user_id', ids).limit(50000),
          supabase
            .from('user_credits')
            .select('user_id, credit_balance')
            .in('user_id', ids)
            .eq('credit_balance', 0)
            .limit(10000),
          supabase
            .from('subscriptions')
            .select('user_id, status')
            .in('user_id', ids)
            .in('status', ['active', 'trialing'])
            .limit(10000),
        ])
        if (songsRes.error) throw songsRes.error
        if (visionsRes.error) throw visionsRes.error
        if (creditsRes.error) throw creditsRes.error
        if (subsRes.error) throw subsRes.error

        firstSongUsers = new Set((songsRes.data ?? []).map((r) => r.user_id)).size
        firstVisionUsers = new Set((visionsRes.data ?? []).map((r) => r.user_id)).size
        exhaustedUsers = new Set((creditsRes.data ?? []).map((r) => r.user_id)).size
        subscribedUsers = new Set((subsRes.data ?? []).map((r) => r.user_id)).size
      }

      const today = new Date().toISOString().split('T')[0]
      const signedUpToday = cohort.filter((u) => u.created_at.startsWith(today)).length

      // For "paid today" — count subscriptions in cohort created today
      let paidToday = 0
      if (ids.length > 0) {
        const { data } = await supabase
          .from('subscriptions')
          .select('created_at, user_id')
          .in('user_id', ids)
          .in('status', ['active', 'trialing'])
          .gte('created_at', today)
        paidToday = new Set((data ?? []).map((r) => r.user_id)).size
      }

      const rawSteps = [
        {
          key: 'opened_app',
          label: 'Opened the app',
          count: 0,
          blocked: true,
          blockedReason:
            'Need to log an app_opened event on the first screen (before signup). Anonymous device tracking required since user_id doesn\'t exist yet.',
        },
        { key: 'signed_up', label: 'Signed up', count: signedUp },
        { key: 'first_song', label: 'Made first song', count: firstSongUsers },
        { key: 'first_vision', label: 'Made first vision', count: firstVisionUsers },
        {
          key: 'paywall_shown',
          label: 'Prompted to buy',
          count: 0,
          blocked: true,
          blockedReason: 'Requires a `paywall_shown` event in lovifymusic.',
        },
        {
          key: 'exhausted_credits',
          label: 'Ran out of credits',
          count: exhaustedUsers,
        },
        { key: 'subscribed', label: 'Subscribed', count: subscribedUsers },
      ]

      // Compute pcts (skipping blocked steps when computing pctOfPrev — we use
      // the most recent unblocked count as the "previous").
      // pctOfPrev = NaN when previous count is 0; UI renders that as "—".
      const steps: FunnelStep[] = []
      let lastUnblockedCount = -1
      let topCount = 0
      for (let i = 0; i < rawSteps.length; i++) {
        const s = rawSteps[i]
        if (s.blocked) {
          steps.push({ ...s, pctOfPrev: NaN, pctOfTop: NaN })
          continue
        }
        if (topCount === 0 && lastUnblockedCount === -1) topCount = s.count
        const pctOfPrev = lastUnblockedCount <= 0 ? NaN : s.count / lastUnblockedCount
        const pctOfTop = topCount > 0 ? s.count / topCount : 0
        steps.push({ ...s, pctOfPrev, pctOfTop })
        lastUnblockedCount = s.count
      }

      return {
        steps,
        signedUpToday,
        paidToday,
        windowLabel: `${f.cohortFrom} → ${f.cohortTo}`,
      }
    },
    staleTime: 5 * 60_000,
  })
}

// ─── Per-user funnel rows (for drill-down drawer) ─────────────────

export interface FunnelUserRow {
  id: string
  email: string | null
  display_name: string | null
  signed_up_at: string
  first_song_at: string | null
  first_vision_at: string | null
  ran_out_of_credits: boolean
  subscribed_at: string | null
  subscription_status: string | null
  // Causal-chain signals (used by drill-down predicates)
  activated_in_first_week: boolean // made a song with ≥3 plays within 7 days of signup
  session_days_in_first_14: number // # distinct app-open days in first 14 days post-signup
  has_session_at_day_7_or_later: boolean
  has_session_at_day_30_or_later: boolean
  has_session_at_day_90_or_later: boolean
}

export function useFunnelUsers(f: ProductFilters) {
  return useQuery({
    queryKey: ['product-funnel-users', ...filtersKey(f)],
    queryFn: async (): Promise<FunnelUserRow[]> => {
      const cohort = await fetchCohort(f)
      if (cohort.length === 0) return []
      const ids = cohort.map((u) => u.id).slice(0, 1000)

      const [profilesRes, songsRes, visionsRes, creditsRes, subsRes, sessionsRes] = await Promise.all([
        supabase.from('profiles').select('id, email, display_name, created_at').in('id', ids),
        supabase
          .from('generated_songs')
          .select('user_id, created_at, play_count')
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
          .from('user_credits')
          .select('user_id, credit_balance')
          .in('user_id', ids),
        supabase
          .from('subscriptions')
          .select('user_id, status, created_at')
          .in('user_id', ids)
          .order('created_at', { ascending: true })
          .limit(10000),
        supabase
          .from('user_sessions')
          .select('user_id, date')
          .in('user_id', ids)
          .limit(100000),
      ])
      if (profilesRes.error) throw profilesRes.error

      const firstSong = new Map<string, string>()
      const songsByUser = new Map<string, { created_at: string; play_count: number }[]>()
      for (const r of (songsRes.data ?? []) as {
        user_id: string
        created_at: string
        play_count: number | null
      }[]) {
        if (!firstSong.has(r.user_id)) firstSong.set(r.user_id, r.created_at)
        const arr = songsByUser.get(r.user_id) ?? []
        arr.push({ created_at: r.created_at, play_count: r.play_count ?? 0 })
        songsByUser.set(r.user_id, arr)
      }
      const sessionsByUser = new Map<string, Set<string>>()
      for (const r of (sessionsRes.data ?? []) as { user_id: string; date: string }[]) {
        if (!sessionsByUser.has(r.user_id)) sessionsByUser.set(r.user_id, new Set())
        sessionsByUser.get(r.user_id)!.add(r.date)
      }
      const firstVision = new Map<string, string>()
      for (const r of (visionsRes.data ?? []) as { user_id: string; created_at: string }[]) {
        if (!firstVision.has(r.user_id)) firstVision.set(r.user_id, r.created_at)
      }
      const exhausted = new Set<string>()
      for (const r of (creditsRes.data ?? []) as { user_id: string; credit_balance: number }[]) {
        if ((r.credit_balance ?? 0) === 0) exhausted.add(r.user_id)
      }
      const subscribed = new Map<string, { status: string; created_at: string }>()
      for (const r of (subsRes.data ?? []) as { user_id: string; status: string; created_at: string }[]) {
        if (!['active', 'trialing'].includes(r.status)) continue
        if (!subscribed.has(r.user_id)) subscribed.set(r.user_id, { status: r.status, created_at: r.created_at })
      }

      const rows: FunnelUserRow[] = []
      for (const p of (profilesRes.data ?? []) as {
        id: string
        email: string | null
        display_name: string | null
        created_at: string
      }[]) {
        const sub = subscribed.get(p.id) ?? null

        // Causal signals
        const signupMs = new Date(p.created_at).getTime()
        const userSongs = songsByUser.get(p.id) ?? []
        const activatedInFirstWeek = userSongs.some(
          (s) =>
            new Date(s.created_at).getTime() <= signupMs + 7 * DAY_MS &&
            (s.play_count ?? 0) >= 3
        )

        const userSessions = sessionsByUser.get(p.id) ?? new Set<string>()
        let sessionDaysInFirst14 = 0
        let hasD7 = false
        let hasD30 = false
        let hasD90 = false
        for (const dateStr of userSessions) {
          const d = new Date(dateStr).getTime()
          const ageDays = (d - signupMs) / DAY_MS
          if (ageDays >= 0 && ageDays < 14) sessionDaysInFirst14 += 1
          if (ageDays >= 7) hasD7 = true
          if (ageDays >= 30) hasD30 = true
          if (ageDays >= 90) hasD90 = true
        }

        rows.push({
          id: p.id,
          email: p.email,
          display_name: p.display_name,
          signed_up_at: p.created_at,
          first_song_at: firstSong.get(p.id) ?? null,
          first_vision_at: firstVision.get(p.id) ?? null,
          ran_out_of_credits: exhausted.has(p.id),
          subscribed_at: sub?.created_at ?? null,
          subscription_status: sub?.status ?? null,
          activated_in_first_week: activatedInFirstWeek,
          session_days_in_first_14: sessionDaysInFirst14,
          has_session_at_day_7_or_later: hasD7,
          has_session_at_day_30_or_later: hasD30,
          has_session_at_day_90_or_later: hasD90,
        })
      }
      return rows.sort((a, b) => b.signed_up_at.localeCompare(a.signed_up_at))
    },
    staleTime: 5 * 60_000,
  })
}

// ─── Songs created per active user per month (rolling 28d) ────────

export interface SongsPerActiveUser {
  songsCreated: number
  activeUsers: number
  ratio: number
}

export function useSongsPerActiveUser(f: ProductFilters) {
  return useQuery({
    queryKey: ['product-songs-per-active', ...filtersKey(f)],
    queryFn: async (): Promise<SongsPerActiveUser> => {
      const cohort = await fetchCohort(f)
      if (cohort.length === 0) return { songsCreated: 0, activeUsers: 0, ratio: 0 }
      const ids = cohort.map((u) => u.id).slice(0, 1000)

      const since = new Date()
      since.setDate(since.getDate() - 28)
      const sinceISO = since.toISOString()
      const sinceDate = sinceISO.split('T')[0]

      const [songsRes, sessionsRes] = await Promise.all([
        supabase
          .from('generated_songs')
          .select('id', { count: 'exact', head: true })
          .in('user_id', ids)
          .gte('created_at', sinceISO),
        supabase
          .from('user_sessions')
          .select('user_id')
          .in('user_id', ids)
          .gte('date', sinceDate)
          .limit(100000),
      ])
      if (songsRes.error) throw songsRes.error
      if (sessionsRes.error) throw sessionsRes.error

      const songsCreated = songsRes.count ?? 0
      const activeUsers = new Set((sessionsRes.data ?? []).map((r) => r.user_id)).size
      return {
        songsCreated,
        activeUsers,
        ratio: activeUsers > 0 ? songsCreated / activeUsers : 0,
      }
    },
    staleTime: 5 * 60_000,
  })
}
