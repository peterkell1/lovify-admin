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

### ⬜ Ticket 1 — Navigation shell revamp

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

**Scope:**
- New migration: `playback_events (user_id, content_id, content_type, started_at, ended_at, duration_seconds, completed_at_least_30s)`
- RLS: users insert own rows; admins read all
- Edit `src/hooks/usePlayTracking.ts` in lovifymusic to write row on every pause/stop/skip (not just first play)
- Aggregator: nightly cron rolls up per-user-per-day for fast dashboard queries
- Wait 28 days post-ship before North Star is meaningful

**Tests to run after:**
- [ ] One play in mobile app → row in `playback_events` with correct duration
- [ ] Pause + resume creates 2 rows
- [ ] Skip <30s flagged correctly
- [ ] Aggregator rollup matches raw sum
- [ ] North Star tile shows real number after 28 days

---

### ⏸ Ticket 14 — Session events instrumentation

**Blocker:** Needs mobile release.
**Unlocks:** Session length distribution · "Meaningful session" metric

**Scope:**
- New migration: `session_events (user_id, started_at, ended_at, duration_seconds)`
- Mobile: write row on app foreground → background transition
- iOS: handle backgrounding edge cases

---

### ⏸ Ticket 15 — Share events instrumentation

**Blocker:** Needs mobile release.
**Unlocks:** Share rate · Shares per sharing user · Platform breakdown · Sharer vs non-sharer retention

**Scope:**
- New migration: `share_events (user_id, content_id, content_type, platform, shared_at)`
- Frontend: update `src/lib/analytics.ts > trackShare()` in lovifymusic to also write to Supabase
- Growth Dashboard: replace placeholders with real charts

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

- _(none yet)_

---

## Notes & Decisions Log

_(Capture decisions made during execution that change the plan. Each entry: date + decision + reason.)_

- _(none yet)_
