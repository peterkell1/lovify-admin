# Lovify Admin Revamp — Phase Tracker

Ticket-based progress log. Tickets are ordered easiest → hardest. Work one ticket at a time. After each ticket is shipped and tested, mark it Done and start the next.

**How to use this file with Claude:**
Copy the ticket's "Prompt to Claude" block into a new chat (along with `CLAUDE.md` + `feasibility-report.md` + `summary.md` for context). When the ticket is complete and tested, update the Status here and append a one-line note under "Done" with the date and PR link if any.

---

## Status Legend

- ⬜ **Not started**
- 🟡 **Active** (in progress — only one at a time)
- ✅ **Done** (shipped + tested)
- ⏸ **Blocked** (waiting on external dependency)

---

## Active Ticket

> _(none yet — start with Ticket 1)_

---

## Phase 1 — Foundation (No backend work)

Pure admin-panel changes. No lovifymusic edits. No new migrations. Safe to ship without affecting consumer app.

### ✅ Ticket 1 — Navigation shell revamp

**Goal:** Replace the current sidebar-only nav with two-tier nav (top bar = 4 dashboards, sidebar = ops). Sidebar collapsed by default on dashboard routes.

**Scope:**
- Add top nav bar with `Product · Business Health · Growth · Vanity` links
- Restructure sidebar to operations-only: `Users · Content · Subscriptions · Audit · Settings`
- Sidebar default: collapsed on `/`, `/business`, `/growth`, `/vanity`; expanded on `/users`, `/content`, etc.
- Sidebar collapse state persists in localStorage
- Hamburger top-left toggles sidebar
- Set `/` to render the (placeholder) Product Dashboard
- Vanity nav link gets muted styling

**Files likely touched:** `src/App.tsx`, `src/components/layout/Sidebar.tsx`, `src/components/layout/Navbar.tsx`, `src/components/layout/DashboardLayout.tsx`

**Tests to run after:**
- [ ] Log in → lands on Product Dashboard placeholder
- [ ] Sidebar collapsed on dashboard routes, expanded on ops routes
- [ ] Hamburger toggles work, state persists across refresh
- [ ] All existing sidebar links still navigate correctly
- [ ] Vanity tab visually muted vs other dashboard tabs

**Prompt to Claude:**
```
Read CLAUDE.md and new-updates-admin/feasibility-report.md + summary.md
for full context.

Work on Ticket 1 — Navigation shell revamp (see
new-updates-admin/phase-admin-update.md for full scope).

Don't touch dashboard content yet — just the navigation shell.
Add placeholder pages for Product / Business Health / Growth / Vanity
that just say "<dashboard name> — coming soon".

Keep all existing operational pages (Users, Content, Subscriptions,
Audit, Settings) working as-is.
```

---

### ⬜ Ticket 2 — Folder restructure + page mapping

**Goal:** Move/rename existing pages to match new layout. Subscriptions out of Finance, Credit Economy into Settings, Moderation as Content tab.

**Scope:**
- Move `src/pages/FinancePage.tsx > Subscriptions tab` → new `src/pages/SubscriptionsPage.tsx`
- Move `src/pages/FinancePage.tsx > Credit Economy tab` → new tab inside `src/pages/SettingsPage.tsx`
- Delete current `src/pages/FinancePage.tsx` (its data goes to Business Health later)
- Move `src/pages/ModerationPage.tsx` → tab inside `src/pages/ContentPage.tsx`
- Delete current `src/pages/DashboardPage.tsx` (Product Dashboard will replace it later)
- Delete current `src/pages/AnalyticsPage.tsx` (folded into Product Dashboard later)
- Update routes in `src/App.tsx`

**Tests to run after:**
- [ ] Subscriptions page accessible from sidebar, table loads, Stripe links work
- [ ] Credit Economy tab inside Settings loads and shows old data
- [ ] Moderation tab inside Content loads (still hidden in nav if intended)
- [ ] Audit Log + Users + Settings work unchanged
- [ ] No dead routes, no broken imports

**Prompt to Claude:**
```
Read CLAUDE.md + new-updates-admin/* for context.

Work on Ticket 2 — Folder restructure per
new-updates-admin/phase-admin-update.md.

Don't change any logic — just move/rename pages and update routes.
Delete the old Dashboard, Analytics, and Finance pages (their data
will live in the new dashboards later). Keep all data hooks
(use-finance, use-dashboard-stats, use-analytics) for reuse —
only the pages get removed.
```

---

### ⬜ Ticket 3 — Vanity Dashboard (full build)

**Goal:** Ship the simplest dashboard first to validate the layout pattern. All 5 metrics that work today, deliberately boring styling.

**Scope:**
- New `src/pages/VanityPage.tsx`
- Warning banner (italic gray) at top with client-specified copy
- Plain `<dl>`-style list, no charts, no filters
- Muted gray text, smaller font than other pages, no orange accent
- Metrics:
  - Total users (lifetime) — `profiles` count
  - Total songs (lifetime + this month) — `generated_songs`
  - Total Mind Movies (lifetime + this month) — `generated_videos`
  - Minutes of audio generated — sum `generated_songs.duration` if column exists; else hide row
  - Total shares — show "—" with "(needs share events)" subtext
  - Total downloads this month — show "—" with "(needs App Store API)" subtext
  - App store rating — show "—" with "(needs App Store API)" subtext

**Tests to run after:**
- [ ] Page loads, all 4 working metrics show real numbers
- [ ] Unavailable metrics show "—" with explanation, not errors
- [ ] Visual styling is clearly muted vs other dashboards
- [ ] Banner text matches client spec exactly

**Prompt to Claude:**
```
Read CLAUDE.md + new-updates-admin/* for context.

Work on Ticket 3 — Vanity Dashboard per phase-admin-update.md.

Use the existing supabase client (src/lib/supabase.ts) for counts.
Don't add filters, charts, or drill-downs — this dashboard is
deliberately flat. Verify generated_songs.duration column exists
before computing total minutes; if not, hide that row.
```

---

### ⬜ Ticket 4 — Business Health: Money tab

**Goal:** First real dashboard with data. Money tab only — MRR, MRR growth, NRR, Gross margin, Monthly churn.

**Scope:**
- New `src/pages/BusinessHealthPage.tsx` with tab nav (Money · Unit Economics · Costs)
- Money tab live:
  - MRR (hero) + 90-day trend
  - MRR growth rate (tile)
  - Net revenue retention (tile)
  - Gross margin (tile)
  - Monthly churn (tile)
- Reuse existing `daily_pnl_stats`, `revenue_events`, `subscriptions` data hooks where possible
- Unit Economics + Costs tabs render "Coming in Ticket 5/6" placeholders
- Persistent filter bar (Date range only for now — others come later)

**Tests to run after:**
- [ ] Money tab loads with real numbers matching current Finance > P&L
- [ ] Date range filter updates all 5 metrics
- [ ] Empty/zero states don't crash
- [ ] Tab switching doesn't refetch unnecessarily (TanStack Query cache works)

**Prompt to Claude:**
```
Read CLAUDE.md + new-updates-admin/* for context.

Work on Ticket 4 — Business Health: Money tab per
phase-admin-update.md.

Reuse existing hooks from src/hooks/use-finance.ts where possible.
Build the tab nav skeleton so Tickets 5 and 6 can plug into it.
Add only Date range filter to the persistent filter bar for now.
```

---

### ⬜ Ticket 5 — Business Health: Costs tab

**Goal:** Migrate AI Costs view into Business Health > Costs tab.

**Scope:**
- Compute cost per active user
- Compute cost per song generated
- Compute cost as % of revenue
- Infra costs (placeholder — needs external entry)
- Total burn rate (placeholder until infra costs entered)
- Reuse current AI Costs chart components

**Tests to run after:**
- [ ] Costs match current Finance > AI Costs values
- [ ] Per-user and per-song ratios calculate correctly
- [ ] % of revenue tracks gross margin from Money tab

**Prompt to Claude:**
```
Read CLAUDE.md + new-updates-admin/* for context.
Work on Ticket 5 — Business Health: Costs tab per
phase-admin-update.md. Reuse AICostsTab logic.
```

---

### ⬜ Ticket 6 — Business Health: Unit Economics tab

**Goal:** LTV by cohort + Monthly churn already live. Add LTV-only views; CAC stays placeholder.

**Scope:**
- LTV by cohort chart (each monthly cohort, cumulative ARPU trend)
- Monthly churn rate (with chart, not just tile)
- CAC by channel — placeholder card "Needs marketing_spend table (Ticket 12)"
- LTV/CAC ratio — placeholder
- CAC payback period — placeholder

**Tests to run after:**
- [ ] LTV-by-cohort chart computes correctly (sample-check one cohort manually)
- [ ] Churn rate matches existing Subscriptions tab
- [ ] Placeholder cards visible but don't error

**Prompt to Claude:**
```
Read CLAUDE.md + new-updates-admin/* for context.
Work on Ticket 6 — Business Health: Unit Economics tab per
phase-admin-update.md. CAC stays placeholder until Ticket 12.
```

---

## Phase 2 — Product Dashboard with available data

The Product Dashboard with everything we can compute today. The remaining tiles (North Star, Skip rate, Session length, Notification rate) get placeholders.

### ⬜ Ticket 7 — Product Dashboard: Causal Chain tiles

**Goal:** 5 tiles row — Activation · Habit · D7 · D30 · D90. Working data for all 5.

**Scope:**
- New `src/pages/ProductPage.tsx` (replaces stale Dashboard route)
- Stacked sections (no tabs)
- Section 1 placeholder (North Star comes in Phase 3)
- Section 2: 5 tiles with current value + change vs prior period + mini sparkline
- Activation: uses play_history row (not duration) — tooltip says "definition expands to ≥30s once instrumentation ships"
- Habit / D7 / D30 / D90: use play_history activity
- All filters on persistent bar but Date range works first; others stub

**Tests to run after:**
- [ ] 5 tiles render with real numbers
- [ ] Sparkline shows last 30 days per tile
- [ ] "vs prior period" math is correct (manually check D7)
- [ ] Tooltip on Activation explains the temporary definition

**Prompt to Claude:**
```
Read CLAUDE.md + new-updates-admin/* for context.
Work on Ticket 7 — Product Dashboard causal chain per
phase-admin-update.md. Use existing admin-analytics edge function
where useful; extend it if needed (don't duplicate logic on the
frontend).
```

---

### ⬜ Ticket 8 — Product Dashboard: Engagement charts

**Goal:** 4 of 7 charts that work today.

**Scope:**
- Plays per song (distribution histogram) — `generated_songs.play_count`
- Re-listen rate (% of user's songs played 3+ times) — `song_play_history`
- Songs created per active user (rolling) — `generated_songs.created_at`
- Time-of-day heatmap of plays — `song_play_history.played_at`
- Skip rate · Session length · Notification rate → placeholder cards "Awaiting instrumentation (Phase 3)"
- Exit reasons panel → placeholder

**Tests to run after:**
- [ ] All 4 working charts render with real data
- [ ] Heatmap shows reasonable distribution (not all in one hour)
- [ ] Placeholder cards visually distinct, don't error

**Prompt to Claude:**
```
Read CLAUDE.md + new-updates-admin/* for context.
Work on Ticket 8 — Product engagement charts per
phase-admin-update.md.
```

---

### ⬜ Ticket 9 — Drill-down side panel

**Goal:** Click any Product tile → side panel slides in from right with cohort/source/quiz/content-type breakdown.

**Scope:**
- New `src/components/dashboard/DrilldownPanel.tsx` (right-side slide-in)
- Wire each of the 5 Causal Chain tiles to open the panel
- Panel shows breakdowns: by cohort (signup month), by quiz goals, by content type (song-only vs Mind Movie creators), by first-week behavior (1 / 3 / 5+ songs)
- Acquisition source breakdown shows funnel users only (caveat copy: "App-store direct = unknown until install attribution ships")
- Esc / X / click-outside closes
- Multiple tiles can be opened in sequence without losing context

**Tests to run after:**
- [ ] Click each tile, panel opens, data correct
- [ ] Cohort breakdown adds up to tile total
- [ ] Close + reopen different tile works smoothly

**Prompt to Claude:**
```
Read CLAUDE.md + new-updates-admin/* for context.
Work on Ticket 9 — Drill-down side panel per
phase-admin-update.md. The panel is reusable for tiles in
Business Health and Growth later.
```

---

### ⬜ Ticket 10 — Filter bar full implementation

**Goal:** All 5 filters work and reset per dashboard.

**Scope:**
- Date range, Cohort, Acquisition source, Quiz answers, Content type
- Wire to all tiles + charts on Product Dashboard
- Filters stored in URL query string (shareable links)
- Filters reset when navigating to a different dashboard

**Tests to run after:**
- [ ] Each filter individually affects all tiles + charts
- [ ] Filters compose correctly (e.g. cohort + quiz answer)
- [ ] Switching to Business Health and back clears Product filters
- [ ] Refreshing page preserves filters via URL

**Prompt to Claude:**
```
Read CLAUDE.md + new-updates-admin/* for context.
Work on Ticket 10 — Filter bar implementation per
phase-admin-update.md.
```

---

## Phase 3 — Admin-only backend additions (no mobile release)

Backend changes that only affect the admin panel and don't risk breaking the consumer app.

### ⬜ Ticket 11 — Annotations on trend lines

**Goal:** Pinned events on Product North Star (and other trend lines) editable by admins.

**Scope:**
- New migration in lovifymusic repo: `dashboard_annotations` table with RLS (admin read/write)
- Settings tab "Annotations" — add / edit / remove events
- Render markers on any trend line chart (Product North Star, Business Health MRR)
- Each save writes to `admin_audit_log`

**Tests to run after:**
- [ ] Add annotation, refresh, still there
- [ ] Marker shows on trend line at correct date
- [ ] Hover shows label
- [ ] Audit log entry created on add/edit/delete

**Prompt to Claude:**
```
Read CLAUDE.md + new-updates-admin/* for context.
Work on Ticket 11 — Annotations per phase-admin-update.md.
Write migration in lovifymusic/supabase/migrations/.
Don't change any consumer-facing code.
```

---

### ⬜ Ticket 12 — Marketing Spend entry (unlocks CAC)

**Goal:** Admin enters monthly ad spend per channel manually → unlocks CAC, LTV/CAC, payback.

**Scope:**
- New migration: `marketing_spend (id, channel, month, amount_usd, created_by, created_at)`
- Settings tab "Marketing Spend" — table view + per-month-per-channel entry
- Update Business Health > Unit Economics to compute CAC, LTV/CAC, payback from this table
- Channels seed: Meta, TikTok, Google, Other (editable list later)

**Tests to run after:**
- [ ] Add spend rows for last 3 months
- [ ] CAC by channel computes correctly (spend / new subs from that channel)
- [ ] LTV/CAC ratio appears
- [ ] Payback period in months appears

**Prompt to Claude:**
```
Read CLAUDE.md + new-updates-admin/* for context.
Work on Ticket 12 — Marketing Spend per phase-admin-update.md.
```

---

## Phase 4 — Consumer-app instrumentation (REQUIRES MOBILE RELEASE)

These need lovifymusic player/onboarding changes and an iOS/Capacitor release. Each one unlocks specific dashboard tiles. **Coordinate with mobile release schedule.**

### ⏸ Ticket 13 — Playback events instrumentation

**Blocker:** Needs mobile release.
**Unlocks:** North Star metric · Skip rate · True listening minutes · Strict Activation definition · Listening-minutes heatmap

> ⚠️ **HIGHEST RISK TICKET IN THE PROJECT.** This edits the audio player — the most critical code path in lovifymusic. A bug here breaks audio for every user. Read the full architecture below before starting.

#### Architecture Overview

The naive approach (one API call per play/pause/skip) does NOT work. We use a **3-layer architecture**:

```
┌─────────────────────────┐
│ 1. Mobile App           │
│   Buffer in memory      │  ← collects play/pause/skip in JS array
│   Flush every 30 sec    │  ← one API call per batch
└──────────┬──────────────┘
           │ batched insert (50+ rows in one call)
           ▼
┌─────────────────────────┐
│ 2. playback_events      │  ← raw rows, partitioned by month
│   (forensics + recovery)│     90-day retention, then drop partition
└──────────┬──────────────┘
           │ nightly cron at 2 AM
           ▼
┌─────────────────────────┐
│ 3. playback_daily_      │  ← one row per user per day
│   rollup                │     dashboard reads ONLY from here
│   (kept forever, tiny)  │
└─────────────────────────┘
```

**Why this design:**
- Batching = 50x fewer API calls, no audio stutter from network waits
- Rollup = dashboard loads in <500ms regardless of raw table size
- Partitioning = retention deletes are instant (`DROP PARTITION` not `DELETE`)
- Cost at 10K users: ~$2–5/month total. See feasibility-report.md for math.

#### Scope

**1. Database — new migration in `lovifymusic/supabase/migrations/`**

```sql
-- Raw events table, partitioned by month
CREATE TABLE playback_events (
  id BIGSERIAL,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  content_id UUID NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('song', 'vision', 'video')),
  event_type TEXT NOT NULL CHECK (event_type IN ('play', 'pause', 'skip', 'end')),
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  duration_seconds INT,
  completed_at_least_30s BOOLEAN GENERATED ALWAYS AS (duration_seconds >= 30) STORED,
  metadata JSONB,  -- flexible bag: device, app_version, network_type, etc.
  PRIMARY KEY (id, started_at)
) PARTITION BY RANGE (started_at);

-- Create initial partitions (current + next 3 months)
-- Use pg_partman extension OR cron to auto-create monthly partitions

-- Indexes — ONLY what dashboard + rollup query
CREATE INDEX idx_playback_user_day ON playback_events(user_id, (started_at::date));
CREATE INDEX idx_playback_content ON playback_events(content_id);

-- RLS
ALTER TABLE playback_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users insert own playback" ON playback_events
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admins read all playback" ON playback_events
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Rollup table (small, indexed, dashboard reads from here)
CREATE TABLE playback_daily_rollup (
  user_id UUID NOT NULL REFERENCES auth.users(id),
  day DATE NOT NULL,
  total_seconds INT NOT NULL DEFAULT 0,
  total_plays INT NOT NULL DEFAULT 0,
  total_skips INT NOT NULL DEFAULT 0,  -- duration < 30s
  total_completes INT NOT NULL DEFAULT 0,  -- duration >= 30s
  unique_songs INT NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, day)
);
CREATE POLICY "admins read rollup" ON playback_daily_rollup
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
```

**2. Nightly rollup cron (pg_cron extension)**

```sql
SELECT cron.schedule(
  'playback_daily_rollup',
  '0 2 * * *',  -- 2 AM daily
  $$
    INSERT INTO playback_daily_rollup (user_id, day, total_seconds, total_plays, total_skips, total_completes, unique_songs)
    SELECT
      user_id,
      started_at::date AS day,
      COALESCE(sum(duration_seconds), 0),
      count(*) FILTER (WHERE event_type = 'play'),
      count(*) FILTER (WHERE duration_seconds < 30),
      count(*) FILTER (WHERE duration_seconds >= 30),
      count(DISTINCT content_id)
    FROM playback_events
    WHERE started_at::date = (now() - interval '1 day')::date
    GROUP BY user_id, started_at::date
    ON CONFLICT (user_id, day) DO UPDATE SET
      total_seconds = EXCLUDED.total_seconds,
      total_plays = EXCLUDED.total_plays,
      total_skips = EXCLUDED.total_skips,
      total_completes = EXCLUDED.total_completes,
      unique_songs = EXCLUDED.unique_songs;
  $$
);
```

**3. Retention cron (weekly)**

```sql
SELECT cron.schedule(
  'playback_events_retention',
  '0 3 * * 0',  -- 3 AM every Sunday
  $$ DROP TABLE IF EXISTS playback_events_y2026m02 $$  -- example, automate based on age
);
```

Drop partitions older than 90 days. Faster than `DELETE`. **Rollup is kept forever.**

**4. Mobile app changes — `lovifymusic/src/hooks/usePlayTracking.ts`**

Critical patterns to follow:

```js
// In-memory buffer, flush every 30s OR on app background
let buffer = []
let flushTimer = null

function trackEvent(event) {
  try {
    buffer.push(event)
    if (!flushTimer) {
      flushTimer = setTimeout(flush, 30000)
    }
  } catch (e) {
    console.error('tracking failed', e)  // never throw — never break audio
  }
}

async function flush() {
  if (buffer.length === 0) return
  const batch = buffer
  buffer = []
  flushTimer = null
  try {
    await supabase.from('playback_events').insert(batch)  // ONE call, many rows
  } catch (e) {
    console.error('flush failed', e)  // accept data loss over crashing audio
  }
}

// Flush on app background (iOS suspends JS otherwise)
App.addListener('appStateChange', ({ isActive }) => {
  if (!isActive) flush()
})

// Last-gasp on app close
window.addEventListener('beforeunload', () => {
  if (buffer.length > 0) {
    navigator.sendBeacon('/api/playback-flush', JSON.stringify(buffer))
  }
})
```

**Mandatory rules for player code changes:**
1. ✅ Wrap every tracking call in `try/catch` — tracking failures must NEVER break playback
2. ✅ Fire-and-forget on writes — never `await` inside an audio event handler
3. ✅ Batch in memory, flush every 30s — never insert per event
4. ✅ Flush on `appStateChange → background` (iOS suspends JS)
5. ✅ Use `sendBeacon` for app-close flushes (survives where `fetch` dies)
6. ✅ Add `playback_tracking_enabled` flag in `feature_flags` table — kill switch from admin

**5. Staged rollout plan**

- Day 0: Ship with `playback_tracking_enabled = false` for everyone
- Day 1: Enable for 5% of users (random by `user_id` hash) → watch crash reports for 24h
- Day 3: Expand to 25% → watch for 48h
- Day 7: Expand to 100% if no spike in player-related errors
- **Kill switch:** admin can flip flag in Settings to disable instantly

**6. Admin panel — wire up Product Dashboard**

- Replace North Star placeholder (Ticket 7) with real query against `playback_daily_rollup`
- Update Activation Rate to use `completed_at_least_30s = true` instead of any-play
- Add Skip Rate tile
- Add true Listening-Minutes heatmap
- Wait 28 days post-rollout before North Star numbers are meaningful — show "Collecting data — meaningful from {date}" until then

#### Tests to run after

**Database:**
- [ ] Migration applies cleanly on staging
- [ ] Partitions auto-create for next 3 months
- [ ] RLS prevents user A from reading user B's events
- [ ] RLS allows admin to read all
- [ ] Rollup cron runs at 2 AM, populates rollup table for prior day
- [ ] Manual rollup re-run is idempotent (ON CONFLICT works)
- [ ] Retention cron drops partitions older than 90 days

**Mobile player:**
- [ ] One play → buffered, flushed within 30s, row in `playback_events` with correct duration
- [ ] Pause + resume = 2 rows (one play, one pause)
- [ ] Skip <30s → `completed_at_least_30s = false`
- [ ] App backgrounded mid-buffer → flush fires, no data loss
- [ ] Network offline → tracking fails silently, audio keeps playing
- [ ] Throw error inside `flush()` → audio still plays (try/catch holds)
- [ ] 100 plays in a row → only ~3–4 API calls (batched), not 100

**Staged rollout:**
- [ ] Feature flag disabled by default
- [ ] 5% rollout: hash bucket logic correct, only ~5% of users send events
- [ ] Crash rate in Sentry/Crashlytics does NOT spike post-rollout
- [ ] Admin kill switch: flipping flag stops new events within 1 minute

**Dashboard:**
- [ ] Rollup matches sum of raw events for a sample user/day
- [ ] North Star tile shows real number after 28 days
- [ ] Skip rate tile populates
- [ ] Heatmap shows reasonable distribution (not all in one hour)

**Cost monitoring (post-rollout):**
- [ ] Supabase API calls < 1M/day at full rollout
- [ ] `playback_events` table growth tracks expectations (~600K rows/day per 10K users)
- [ ] Dashboard query times < 1s

**Prompt to Claude:**
```
Read CLAUDE.md + new-updates-admin/* for context, especially the
full Ticket 13 architecture in phase-admin-update.md.

Work on Ticket 13 — Playback events instrumentation.

CRITICAL RULES (do not skip):
1. Mobile player code changes use try/catch on every tracking call —
   tracking failures must never break audio.
2. Never await network calls inside audio event handlers — buffer
   in memory, flush every 30s.
3. Database design = raw events (partitioned, 90-day retention) +
   nightly rollup (kept forever, dashboard reads from here only).
4. Ship behind feature_flags.playback_tracking_enabled with staged
   rollout: 5% → 25% → 100% over 1 week.
5. Add admin kill switch in Settings for the feature flag.

Start with the migration + rollup cron (zero risk to consumer app).
Then mobile player changes behind the feature flag (off by default).
Then admin Settings toggle for the kill switch.
Last: wire up Product Dashboard tiles to read from rollup table.

Don't ship to 100% on Friday — give yourself a week of monitoring.
```

---

### ⏸ Ticket 14 — Session events instrumentation

**Blocker:** Needs mobile release.
**Unlocks:** Session length distribution · "Meaningful session" metric

> Follow the same architecture patterns as Ticket 13 (batching, partitioning, rollup, try/catch, feature flag). This table will be smaller (1–3 sessions/user/day vs hundreds of plays), so monthly partitioning is fine and rollup may be optional. Reuse the kill-switch + staged-rollout playbook.

**Scope:**
- New migration: `session_events (user_id, started_at, ended_at, duration_seconds)` — partitioned by month, RLS like playback_events
- Optional rollup: `session_daily_rollup (user_id, day, session_count, total_seconds, longest_session_seconds)` — only if dashboard queries get slow
- Mobile: write row on app foreground → background transition (Capacitor `App.addListener('appStateChange')`)
- iOS: handle backgrounding edge cases — flush on suspend, handle "killed by OS" gracefully (no `ended_at`)
- Behind `session_tracking_enabled` feature flag, same staged rollout as Ticket 13
- Wrap all writes in try/catch — must never break app launch/background

**Tests to run after:**
- [ ] App foreground → background creates one row with correct duration
- [ ] App killed by OS → row exists with `ended_at = NULL` (handle in dashboard query)
- [ ] Throwing inside session handler does not crash app
- [ ] Feature flag off → no rows written
- [ ] Session length histogram on Product Dashboard renders correctly

---

### ⏸ Ticket 15 — Share events instrumentation

**Blocker:** Needs mobile release.
**Unlocks:** Share rate · Shares per sharing user · Platform breakdown · Sharer vs non-sharer retention

> Follow the same patterns as Ticket 13 (try/catch, feature flag, RLS). Share events are very low volume (a few per active user per week), so batching/rollup are NOT needed here — direct insert is fine. Partitioning is also overkill at this scale.

**Scope:**
- New migration: `share_events (user_id, content_id, content_type, platform, shared_at, metadata JSONB)` — flat table, indexed on `(user_id, shared_at)` and `(content_id)`, RLS: users insert own, admins read all
- Frontend: update `src/lib/analytics.ts > trackShare()` in lovifymusic to also write to Supabase (in addition to GA4)
- Wrap insert in try/catch + fire-and-forget — share UX must never block on the write
- Behind `share_tracking_enabled` feature flag (lower risk than playback, but still flag-gated for safety)
- Growth Dashboard: replace placeholders with real charts (share rate, shares per sharer, platform pie)

**Tests to run after:**
- [ ] User shares a song → row in `share_events` with platform captured
- [ ] Throwing inside trackShare does not block the share dialog
- [ ] GA4 event still fires alongside Supabase write
- [ ] Feature flag off → no DB rows but GA4 still fires
- [ ] Growth Dashboard tiles render real numbers

---

### ⏸ Ticket 16 — Exit survey

**Blocker:** Needs mobile release.
**Unlocks:** Exit reasons panel on Product Dashboard.

**Scope:**
- Reuse `user_feedback` table with `trigger='exit_survey_v1'` discriminator
- Mobile: modal triggers when user opens app after 14+ days inactive
- One question, 4 options + "other" text field
- Render aggregated reasons on Product Dashboard

---

## Phase 5 — External integrations (HIGH EFFORT, HIGH RISK)

Each one has cost (paid SDK or API access) and security implications. Treat as separate projects with their own approval gates.

### ⏸ Ticket 17 — Push notification logging

**Unlocks:** Notification Response Rate

**Scope:**
- Identify push provider (FCM / APNS / OneSignal — needs verification in lovifymusic)
- Webhook receiver in Supabase edge function → `notification_events` table
- Deep-link attribution from notification open → app open
- **Risk:** credential management, PII handling

---

### ⏸ Ticket 18 — Mobile install attribution SDK

**Unlocks:** Viral coefficient · Share-to-install conversion · Install source breakdown · Activation rate for shared installs

**Scope:**
- Choose SDK: Branch / AppsFlyer / Adjust (each ~$$$ /month)
- iOS + Capacitor integration
- 1 mobile release cycle
- **Risk:** paid SDK, native integration complexity, App Store review

---

### ⏸ Ticket 19 — App Store + Play Store APIs

**Unlocks:** Total downloads this month · App store rating (Vanity dashboard)

**Scope:**
- App Store Connect API credentials (signed JWT)
- Google Play Developer API credentials
- Daily cron polls both, writes to `app_store_metrics` table
- Vanity dashboard reads from this table
- **Risk:** credential rotation, API rate limits

---

### ⏸ Ticket 20 — Ad platform APIs (replaces manual marketing spend)

**Unlocks:** Automated CAC (replaces manual entry from Ticket 12)

**Scope:**
- Meta Ads API
- TikTok Ads API
- Google Ads API
- Currency conversion, attribution model
- **Risk:** 3 separate auth flows, each platform's quirks, easy to double-count

---

## Done

_(Append one line per completed ticket: ticket number · date · short note · PR link if any)_

- **Ticket 1 · 2026-05-12** · Navigation shell revamp. Single dark-brown navbar with centered dashboard tabs (Product/Business Health/Growth/Vanity) + user controls on the right. Hamburger in sidebar header. Ops sidebar items only (Users/Content/Funnels/Subscriptions/Feedback/Audit/Settings). Sidebar collapse state persists per user in localStorage; defaults collapsed on dashboard routes, expanded on ops routes. Placeholder pages created for all 4 dashboards.

---

## Notes & Decisions Log

_(Capture decisions made during execution that change the plan. Each entry: date + decision + reason.)_

- **2026-05-12 — Locked architecture for high-volume event tables (Tickets 13–15).**
  Decision: 3-layer pattern — (1) in-app memory buffer with 30s flush + flush-on-background, (2) raw events table partitioned by month with 90-day retention, (3) nightly rollup table kept forever, dashboard reads only from rollup.
  Reason: avoids per-event API calls (50x cost reduction), keeps dashboard queries <1s regardless of raw table size, retention deletes are instant via `DROP PARTITION`. Estimated cost at 10K users: ~$2–5/month.
  Rejected alternative: pushing raw events to S3 hourly via cron with DB references. Rejected because S3 doesn't solve the dashboard query problem (would need Athena/DuckDB on top), adds operational complexity (IAM, lifecycle, cron infra), and Postgres handles this scale fine for 1–2 years before any archival is needed. S3 is reserved for Phase "post-100K-users" cold storage of partitions older than 90 days.
  Mandatory rules for any ticket touching consumer-app code: try/catch on every tracking call, never await network in audio/UI handlers, feature-flag-gated with admin kill switch, staged rollout 5% → 25% → 100% over 1 week.
