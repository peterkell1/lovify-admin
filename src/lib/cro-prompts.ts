// System prompt for the CRO insights AI. Designed to be cached — keep it
// stable. Volatile per-request data goes in the user message.

export const CRO_SYSTEM_PROMPT = `You are a senior product analyst and conversion-rate-optimization (CRO) expert. You are embedded in the admin dashboard of an early-stage mobile app called Lovify.

# What Lovify is

Lovify is a mobile app that helps people create personalized AI-generated music and "Mind Movies" (cinematic videos of their dream life set to their custom song) to rewire their subconscious for the life they want. Users describe their dreams (love, wealth, health, career, travel) and the app generates custom songs with affirmations baked into the lyrics.

The core mechanism of value: **users press play daily. The repetition rewires their subconscious.** A user who creates 10 songs and never replays them gets no value. A user who creates 2 songs and listens daily for 90 days gets enormous value.

The product is currently early-stage with hundreds of users (not thousands or millions). Treat product fit problems as more important than scaling problems.

# Locked metric definitions

- **Active user** = opened the app at least once in the last 28 days
- **A listen** = played a song or Mind Movie for ≥30 seconds
- **Activated user** = created a song AND listened 3+ times within 7 days of signup
- **Habit-formed user** = activated user AND listened on 4+ of their first 14 days
- **New user** = within 30 days of signup

# Onboarding flow (so you can reason about drop-off)

App opened (first screen) → Signed up (email/oauth) → Made first song → Made first vision → (optional) Ran out of credits → Prompted to buy → Subscribed.

There are ~5 screens between "opened the app" and "signed up". The new onboarding has dropped the long quiz in favor of a "magical first 30 seconds" experience.

# Your job

When given a single metric (with current value, healthy range, and any drill-down data), produce a focused diagnostic brief that helps the founder decide what to do this week.

# Output format — STRICT

Use this exact markdown structure. Each section is short and punchy. No throat-clearing, no preamble, no executive summary at the end.

## 🎯 Top insight

(one sentence, in plain English. State the most likely root cause as a bet, not a hedged maybe.)

## 🤔 Likely causes

- **High confidence:** (specific hypothesis — what's likely actually broken)
- **Medium confidence:** (alternate hypothesis worth investigating)
- **Low confidence (long shot):** (third option to keep in mind)

## 🛠 Recommended fixes (this week)

1. **Action** — (one-sentence description). Effort: low/medium/high. Expected impact: (specific — "lifts activation 3-5 points").
2. **Action** — same shape.
3. **Action** — same shape.

## 🔍 Truth finder — go talk to users

Specific questions to ask 5-10 actual users this week. Make these concrete and openable. Format:

- "Pick 5 users from the drop-off list and call/text them. Ask: '<exact question>' and '<exact question>'."
- Add 2-3 follow-up prompts to dig into the answer.

## 📊 Data to investigate next

Specific things to query or look at on this dashboard or in the database. Be concrete:

- "Open the funnel drill-down for 'Signed up → Dropped before Made first song' and check signup-to-first-song time-deltas. If most are <5 minutes, it's a generation failure, not abandonment."
- Add 2-3 more.

# Tone rules

- Direct and opinionated. The founder is hungover and reading on their phone — get to the point.
- Concrete numbers and concrete actions, never generic platitudes.
- If the data is missing or the metric is "no data yet", say so plainly and tell them what tracking they need to wire up — don't make up product fixes.
- Never recommend "do more user research" as the only answer. Make a bet first, then say how to validate it.
- Don't repeat the metric definition back at them — they wrote the dashboard, they know.`

export interface MetricContext {
  question: string
  metric: string
  currentValue: string
  healthyRange: string
  status: string
  numerator?: number
  denominator?: number
  cohortFrom: string
  cohortTo: string
  cohortSize: number
  excludedTestUsers?: number
  manuallyExcluded?: number
  isNoData?: boolean
  noDataReason?: string
  approxNote?: string
}

// ─── Chat ────────────────────────────────────────────────────────

export interface DashboardSnapshot {
  cohort: {
    from: string
    to: string
    size: number
    excludedTestUsers: number
    manuallyExcluded: number
  }
  funnel?: {
    signedUp: number
    firstSong: number
    firstVision: number
    exhaustedCredits: number
    subscribed: number
  }
  activation?: { rate: number; activated: number; cohortSize: number }
  habit?: { rate: number; formed: number; activated: number }
  retention?: {
    d7: { rate: number; retained: number; eligible: number }
    d30: { rate: number; retained: number; eligible: number }
    d90: { rate: number; retained: number; eligible: number }
  }
  reListenRate?: { rate: number; replayed: number; total: number }
  songsPerActiveUser?: { ratio: number; songs: number; activeUsers: number }
  playsDistribution?: { label: string; count: number }[]
  blockers: string[]
}

export function buildChatSystemPrompt(snapshot: DashboardSnapshot): string {
  // Append the live dashboard snapshot to the standard CRO system prompt.
  // Volatile content (changes per session), but stable for the duration of
  // the chat — keep it inside the cached prefix so multi-turn convos hit cache.
  const lines: string[] = []
  lines.push(CRO_SYSTEM_PROMPT)
  lines.push('')
  lines.push('# Current dashboard snapshot (this is the live data the founder is looking at)')
  lines.push('')
  lines.push(
    `**Cohort window:** ${snapshot.cohort.from} → ${snapshot.cohort.to} · ${snapshot.cohort.size} real users`
  )
  if (snapshot.cohort.excludedTestUsers > 0) {
    lines.push(`(${snapshot.cohort.excludedTestUsers} test/internal accounts auto-excluded)`)
  }
  if (snapshot.cohort.manuallyExcluded > 0) {
    lines.push(`(${snapshot.cohort.manuallyExcluded} manually excluded by admin)`)
  }
  lines.push('')

  if (snapshot.funnel) {
    const f = snapshot.funnel
    lines.push('**Onboarding funnel (this cohort):**')
    lines.push(`- Signed up: ${f.signedUp}`)
    lines.push(`- Made first song: ${f.firstSong}`)
    lines.push(`- Made first vision: ${f.firstVision}`)
    lines.push(`- Ran out of credits: ${f.exhaustedCredits}`)
    lines.push(`- Subscribed: ${f.subscribed}`)
    lines.push('')
  }

  lines.push('**Causal-chain metrics:**')
  if (snapshot.activation) {
    lines.push(
      `- Activation rate: ${(snapshot.activation.rate * 100).toFixed(1)}% (${snapshot.activation.activated} of ${snapshot.activation.cohortSize}). Healthy 30–50%.`
    )
  }
  if (snapshot.habit) {
    lines.push(
      `- Habit formation: ${(snapshot.habit.rate * 100).toFixed(1)}% (${snapshot.habit.formed} of ${snapshot.habit.activated}). Healthy 40–60%.`
    )
  }
  if (snapshot.retention) {
    lines.push(
      `- D7 retention: ${(snapshot.retention.d7.rate * 100).toFixed(1)}% (${snapshot.retention.d7.retained} of ${snapshot.retention.d7.eligible}). Healthy 25–40%.`
    )
    lines.push(
      `- D30 retention: ${(snapshot.retention.d30.rate * 100).toFixed(1)}% (${snapshot.retention.d30.retained} of ${snapshot.retention.d30.eligible}). Healthy 15–25%.`
    )
    lines.push(
      `- D90 retention: ${(snapshot.retention.d90.rate * 100).toFixed(1)}% (${snapshot.retention.d90.retained} of ${snapshot.retention.d90.eligible}). Healthy 8–15%.`
    )
  }
  lines.push('')

  if (snapshot.reListenRate || snapshot.songsPerActiveUser || snapshot.playsDistribution) {
    lines.push('**Engagement-quality metrics:**')
    if (snapshot.reListenRate) {
      lines.push(
        `- Re-listen rate: ${(snapshot.reListenRate.rate * 100).toFixed(1)}% (${snapshot.reListenRate.replayed} of ${snapshot.reListenRate.total} songs played 3+ times). Healthy 30%+.`
      )
    }
    if (snapshot.songsPerActiveUser) {
      lines.push(
        `- Songs created per active user (28d): ${snapshot.songsPerActiveUser.ratio.toFixed(2)} (${snapshot.songsPerActiveUser.songs} songs ÷ ${snapshot.songsPerActiveUser.activeUsers} active users). Healthy 0.5+.`
      )
    }
    if (snapshot.playsDistribution) {
      lines.push(
        `- Plays-per-song distribution: ${snapshot.playsDistribution.map((b) => `${b.label}=${b.count}`).join(' · ')}`
      )
    }
    lines.push('')
  }

  if (snapshot.blockers.length > 0) {
    lines.push('**Known data blockers** (metrics that read "—" because tracking is missing):')
    for (const b of snapshot.blockers) {
      lines.push(`- ${b}`)
    }
    lines.push('')
  }

  lines.push('# Chat tone for conversational mode')
  lines.push('')
  lines.push(
    'You are now in conversational mode (not the structured-brief mode). Stay direct and opinionated. Use markdown headers/lists when helpful, but match length to question — short questions get short answers, complex questions can get the full diagnostic structure.'
  )
  lines.push(
    "When the founder pastes user-call notes, summarize what you heard and update your hypotheses. When they ask 'what should I do this week', name the single highest-leverage thing first, then 1–2 backups."
  )
  lines.push(
    "When the data is genuinely missing for a question, say so plainly and tell them what to instrument. Never invent fake numbers."
  )

  return lines.join('\n')
}

export function buildMetricUserPrompt(ctx: MetricContext): string {
  const lines: string[] = []
  lines.push(`# Metric to analyze`)
  lines.push(``)
  lines.push(`**Question (as shown on the dashboard):** ${ctx.question}`)
  lines.push(`**Metric name:** ${ctx.metric}`)
  lines.push(`**Current value:** ${ctx.currentValue}`)
  lines.push(`**Healthy range:** ${ctx.healthyRange}`)
  lines.push(`**Status:** ${ctx.status}`)
  if (ctx.numerator !== undefined && ctx.denominator !== undefined) {
    lines.push(`**Numerator / denominator:** ${ctx.numerator} of ${ctx.denominator} users`)
  }
  if (ctx.isNoData) {
    lines.push(`**This metric has NO DATA YET.** ${ctx.noDataReason ?? 'Underlying tracking not wired.'}`)
  }
  if (ctx.approxNote) {
    lines.push(`**Approximation note:** ${ctx.approxNote}`)
  }
  lines.push(``)
  lines.push(`# Cohort context`)
  lines.push(``)
  lines.push(`- Cohort window: ${ctx.cohortFrom} → ${ctx.cohortTo}`)
  lines.push(`- Cohort size (after filters): ${ctx.cohortSize} users`)
  if (ctx.excludedTestUsers !== undefined && ctx.excludedTestUsers > 0) {
    lines.push(`- ${ctx.excludedTestUsers} test/internal accounts were auto-excluded by the heuristic`)
  }
  if (ctx.manuallyExcluded !== undefined && ctx.manuallyExcluded > 0) {
    lines.push(`- ${ctx.manuallyExcluded} users were manually excluded by the admin`)
  }
  lines.push(``)
  lines.push(`Now produce the diagnostic brief in the exact format specified.`)
  return lines.join('\n')
}
