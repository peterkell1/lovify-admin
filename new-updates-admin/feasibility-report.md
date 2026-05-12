# Lovify Admin Revamp — Feasibility Report

> Source: client brief requesting 4 dashboards (Product, Business Health, Growth, Vanity).
> Audit scope: `lovify-admin` (this repo) + `lovifymusic` (consumer app at `c:/Users/hp/Documents/GitHub/lovifymusic`) + shared Supabase project `pqjqurjdujwforscefov`.

---

## TL;DR

Of the four dashboards the client wants:

- **Product Dashboard** — ~55% buildable now, ~45% needs new instrumentation in the mobile app
- **Business Health** — ~70% buildable now (we already have P&L, costs, revenue events)
- **Growth** — ~25% buildable now (shares + install attribution are mostly missing)
- **Vanity** — ~70% buildable now (some metrics like app store rating + downloads need external integrations)

The blockers are almost entirely **missing event capture in the consumer app**, not admin-side problems. Below is a metric-by-metric breakdown with what each one needs.

Legend:

- ✅ **Possible now** — data exists, just needs UI
- 🟡 **Partially possible** — partial data, or possible with a small compromise / a small backend change
- 🔴 **Not possible today** — needs significant new instrumentation, external integration, or mobile release cycle

---

## Dashboard 1 — Product (Highest Priority)

### North Star: Daily Active Listening Minutes / User (28-day rolling)

🔴 **Not possible today.** This is the biggest gap in the whole spec.

- We have `song_play_history` (migration `20260329120000_play_history.sql`) — but it only records "this user played this song on this day" (UNIQUE per user+song+day). **No duration. No minutes.** It's a binary play flag, not playback telemetry.
- The 30-second listen threshold in the locked definitions can't be computed either.

**How to make it possible:**

1. New migration: `playback_events` table — `(user_id, content_id, content_type, started_at, duration_seconds, completed)` — written every time playback stops or pauses.
2. Edit lovifymusic player code (`src/hooks/usePlayTracking.ts`) to write a row on every play-end event (timeupdate at pause/stop/skip, not just on start).
3. iOS native: ensure background-audio events flush on close.
4. Backfill: impossible — we can only start measuring once shipped.

**Effort:** ~1 day backend + ~1 day frontend + 1 mobile release cycle for the data to populate.

### Section 2: The Causal Chain (5 tiles)

| Tile | Status | What's needed |
|---|---|---|
| **Activation Rate** (song + 3 listens in 7 days) | 🟡 | Have play history. "3 listens" works on play-days, but the locked def says "≥30 seconds = a listen" which we don't measure. **Compromise possible:** define listen = play_history row (current behavior) until duration capture ships. |
| **Habit Formation** (4+ of first 14 days) | ✅ | `song_play_history.played_at` gives us this directly. Buildable now. |
| **D7 / D30 / D90 retention** | ✅ | `profiles.created_at` + `song_play_history` activity in window. Buildable now. The existing `admin-analytics` edge function already computes week1/week4 — we extend it. |

### Section 3: Engagement Quality (7 charts)

| Chart | Status | Notes |
|---|---|---|
| **Plays per song (distribution)** | ✅ | `generated_songs.play_count` histogram. Buildable now. |
| **Skip rate (<30s)** | 🔴 | Needs duration capture (same blocker as North Star). |
| **Session length distribution** | 🔴 | We have `user_sessions` table but only date-level. Needs `session_start` / `session_end` events from mobile app. |
| **Listening time-of-day heatmap** | 🟡 | Have `played_at` timestamps — can build a "play heatmap" today. True "listening minutes" heatmap needs duration capture. |
| **Notification response rate** | 🔴 | **No push log table exists.** Needs full integration with whatever push provider lovifymusic uses (OneSignal? FCM? — needs verification). Plus deep-link attribution from notification → open. |
| **Re-listen rate** | ✅ | `song_play_history` per-user counts. Buildable now. |
| **Songs created per active user (rolling)** | ✅ | `generated_songs.created_at`. Buildable now. |

### Filtering (cohort, source, quiz, content type)

| Filter | Status |
|---|---|
| **Signup cohort** | ✅ `profiles.created_at` |
| **Acquisition source** | 🟡 Only funnel-sourced users have UTM. App-store direct installs are NULL — they'll show as "unknown". To fix → SDK like AppsFlyer/Adjust/Branch (paid, external). |
| **Quiz answers** | ✅ `profiles.quiz_goals`, `quiz_mindset_key`, etc. — already there. |
| **Content type (song-only vs Mind Movie)** | ✅ Joinable from `generated_songs` ↔ `generated_videos`. |
| **First-week behavior (1 / 3 / 5+ songs)** | ✅ Computable from `generated_songs.created_at`. |

### Exit Survey ("inactive 14+ days")

🟡 **Possible — but requires consumer app changes.**

- Backend (admin side): new `exit_survey_responses` migration — trivial.
- Frontend (mobile): trigger modal when user opens app after 14+ days idle. Needs a release.
- We **do** have a `user_feedback` table already — we could reuse it with a `trigger='exit_survey_v1'` discriminator instead of a new table.

---

## Dashboard 2 — Business Health

| Metric | Status | Notes |
|---|---|---|
| **MRR / MRR growth** | ✅ | `revenue_events` + `subscriptions`. Computable. |
| **Net revenue retention** | ✅ | Computable from `subscriptions` history. |
| **Gross margin** | ✅ | `revenue_events` minus `api_costs`. |
| **Cash flow** | 🟡 | We have revenue events (Stripe) but no expense ledger. "Cash flow" really means bank-account-level — needs Stripe payout reconciliation. Approximate version possible. |
| **LTV by cohort** | ✅ | Joinable: `profiles.created_at` cohort → `revenue_events` cumulative per user. |
| **CAC by channel** | 🔴 | We have **no ad spend data**. Needs manual entry UI OR Meta/TikTok/Google Ads API integration. |
| **LTV/CAC + CAC payback** | 🔴 | Same — depends on CAC. |
| **Monthly churn** | ✅ | `subscriptions.canceled_at` / period_end. |
| **Compute cost / active user / song / % of revenue** | ✅ | `api_costs` + `daily_pnl_stats`. Already mostly built in current panel. |
| **Infra costs** | 🟡 | Only AI/API costs tracked. Supabase + Vercel + storage costs are not in DB — needs manual entry or provider API. |
| **Total burn rate** | 🟡 | Same — depends on full cost picture. |

**To enable CAC**: new `marketing_spend` table + admin UI to enter monthly spend per channel. ~half-day work.

---

## Dashboard 3 — Growth

| Metric | Status | Notes |
|---|---|---|
| **Viral coefficient (k-factor)** | 🔴 | Requires sharer→install→signup attribution chain. We don't capture install-source-from-share. |
| **Share rate** | 🟡 | We track shares in **GA4 only** (`src/lib/analytics.ts` in lovifymusic) — not in the database. Need `share_events` table + write from frontend. |
| **Shares per sharing user** | 🟡 | Same fix as above. |
| **Share-to-install conversion** | 🔴 | Needs deep-link attribution (Branch, Firebase Dynamic Links, AppsFlyer). |
| **Share platform breakdown** | 🟡 | Frontend can capture the platform if we ship a share-event write. |
| **Install source breakdown (paid/organic/referral/viral)** | 🔴 | Same install-attribution blocker. |
| **Sharer vs non-sharer retention** | 🟡 | Possible **after** share events are in DB. |
| **Activation rate: shared-link installs vs paid** | 🔴 | Same install-attribution blocker. |

**The big rock here:** mobile install attribution. There's no shortcut — either integrate Branch/AppsFlyer SDK (paid) or accept we can't measure this.

---

## Dashboard 4 — Vanity

| Metric | Status | Notes |
|---|---|---|
| **Total users (lifetime)** | ✅ | `profiles` count |
| **Total downloads this month** | 🔴 | Needs App Store Connect API + Play Store API integration |
| **Total songs (lifetime + month)** | ✅ | `generated_songs` count |
| **Total Mind Movies (lifetime + month)** | ✅ | `generated_videos` count |
| **Total minutes of audio generated** | 🟡 | Songs may have a duration field on `generated_songs` — need to verify. If yes → ✅. |
| **Total shares** | 🟡 | Same gap as Growth — currently in GA4 only. |
| **App store rating** | 🔴 | Needs App Store Connect API polling job. |

---

## Underlying Data Audit (lovifymusic Supabase)

Summary of what data actually exists in the consumer app today:

| Data Point | Status | Source |
|---|---|---|
| Listens/skips (North Star) | ✅ binary plays, 🔴 duration | `song_play_history` + `generated_songs.play_count` |
| Session length | 🟡 date-only | `user_streaks`, `user_sessions` (no HMS granularity) |
| Push notification response | 🔴 | No FCM/APNS/OneSignal log table |
| Acquisition source | 🟡 funnel users only | `funnel_submissions.utm`, `profiles.attribution_data` |
| Quiz answers / goals | ✅ | `profiles.quiz_*`, `user_goals`, `onboarding_events` |
| Video engagement | 🟡 conflated w/ songs | `generated_videos` (no standalone play tracking) |
| Share events | 🟡 GA4 only | `src/lib/analytics.ts` `trackShare()` — not DB |
| Install attribution | 🔴 | No `first_open` / install_source tracking |
| Exit feedback | 🟡 unstructured | `user_feedback` table exists, no formal exit survey |
| Signup cohort | ✅ | `profiles.created_at` + `auth.users.created_at` |
| App store rating | 🔴 | No integration |
| P&L / costs / revenue | ✅ | `api_costs`, `revenue_events`, `daily_pnl_stats` |

**Existing admin-only edge functions** (reusable in revamp):

- `admin-analytics` — retention cohorts (week1/week4), Bearer-auth + `has_role` gated
- `admin-pnl` — daily P&L aggregates
- `admin-ai-costs` — cost breakdown by type
- `admin-songs` — song metadata/stats
- `admin-seed-songs`, `admin-genre-samples`, `admin-generate-meditation-samples` — content utilities

---

## What Gets Removed/Changed in the Current Admin Panel

Since the spec only defines 4 dashboards, **everything else either stays as a utility page or gets removed**.

| Current Page | Fate in Revamp | Why |
|---|---|---|
| **Dashboard** (KPI cards + revenue chart) | **Removed / replaced** | Becomes the new "Product" dashboard with completely different metrics |
| **Users** directory + detail | **KEEP** | Client spec doesn't mention this but it's operational — needed for support |
| **Content browser** (songs/visions/videos) | **KEEP** | Same — moderation tooling |
| **Finance > P&L tab** | **Folded into "Business Health"** dashboard |
| **Finance > AI Costs tab** | **Folded into "Business Health" > Costs section** |
| **Finance > Subscriptions tab** | **KEEP as utility page** | Operational, not in client's 4 dashboards |
| **Finance > Credit Economy tab** | **Removed?** | Not in spec. Could keep as utility. |
| **Analytics** (funnel, segments, content counts) | **Removed / replaced** | Superseded by Product dashboard |
| **Audit Log** | **KEEP** | Operational, compliance |
| **Settings** (credits config + feature flags) | **KEEP** | Operational |
| **Moderation** | **KEEP** (still hidden) | Unchanged |

**Suggested final nav:**

- **Primary (top, prominent):** Product · Business Health · Growth · Vanity
- **Secondary (operational utilities):** Users · Content · Subscriptions · Audit · Settings

---

## Open Decisions Before Building

A few decisions will shape the whole project:

1. **Are we shipping consumer-app changes too?**
   The Product dashboard is ~half-broken without duration capture, session events, and push event logging. Without consumer-app instrumentation, this becomes a "what we *can* measure" dashboard, not the one in the spec.

2. **Install attribution / mobile SDK?**
   Growth dashboard is mostly blocked without Branch / AppsFlyer / Adjust. Cheapest path: ship `share_events` table + UTM-tagged share links → measure share-to-app-open in funnel only.

3. **Locked-definition compromise.**
   The spec says "listen = ≥30 seconds". Until duration capture ships, we can either (a) hold the dashboard, or (b) ship with "listen = any play" and re-define once instrumentation lands. Recommendation: (b) with a tooltip on each metric.

4. **Marketing spend & ad data.**
   For CAC, do we have access to Meta/TikTok/Google Ads APIs, or should we build a manual monthly-spend entry form?

5. **Scope of the current panel.**
   Recommended read: keep Users / Content / Subscriptions / Audit / Settings as utility pages, replace Dashboard / Analytics / Finance with the 4 client dashboards. **Confirm?**

---

## Layout Decisions (Locked)

### Navigation shape — Two-tier

- **Top bar (analytics zone):** Product · Business Health · Growth · Vanity
- **Left sidebar (operations zone):** Users · Content · Subscriptions · Audit · Settings
- Dashboards and operations are visually separate so each one's purpose is obvious at a glance.

### Default home page

- **Product Dashboard** is the default route on login, per client spec.

### Sidebar behavior

- **Default collapsed** on dashboard routes (icon strip only, hamburger top-left to expand).
- **Default expanded** on operational routes (Users / Content / Subs / Audit / Settings) — those don't need the horizontal real estate and the user is already in "ops mode".
- Expanded sidebar overlays content (doesn't push the page).
- Sidebar state persists in localStorage per user.

### Per-dashboard structure

| Dashboard | Layout | Why |
|---|---|---|
| **Product** | **Stacked sections** (no tabs) | The 3 sections form a top-down causal-chain diagnosis flow that breaks if tabbed. |
| **Business Health** | **Tabs** (Money · Unit Economics · Costs) | Three independent views. |
| **Growth** | **Tabs** (Viral · Channels · Sharer vs Non-sharer) | Three independent views. |
| **Vanity** | **Flat list** (no tabs, no charts) | Client wants it deliberately boring — muted gray, smaller font, banner at top. |

### Filters

- **Persistent filter bar** under top nav, only on dashboard routes.
- **Reset per dashboard** — filters do NOT persist when switching between Product / Business / Growth / Vanity.
- Filters: Date range · Cohort · Acquisition source · Quiz answers · Content type.

### Drill-downs

- **Side panel** (slides in from right) when a tile is clicked.
- Dashboard stays visible behind the panel so user can compare tiles quickly.
- Side panel shows cohort / source / quiz / content-type breakdowns for the clicked tile.

### Annotations (90-day trend line on Product North Star)

- Trend line shows pinned event markers (e.g. "v2.1 ship", "TikTok ad launch", "Black Friday push").
- Storage: new table `dashboard_annotations (id, dashboard, metric, event_date, label, created_by, created_at)`.
- **Any admin** can add / edit / remove annotations.
- Managed via a new tab in Settings ("Annotations" or "Dashboard Config").
- Every change written to `admin_audit_log` for traceability.

### Vanity treatment

- Muted gray text, no orange accent.
- Smaller font than other dashboards.
- No charts, no filters, no drill-downs.
- Banner at top in italic gray:
  > *"These metrics do not predict product health or business value. They exist for external reporting only. For product decisions, use the Product dashboard."*

---

## Mapping Current Pages → New Layout

| Current page | New home |
|---|---|
| Dashboard (KPI grid + revenue chart) | **Removed** — replaced by Product Dashboard |
| Analytics (funnel, segments, content counts) | **Removed** — folded into Product Dashboard drill-downs + Vanity |
| Finance > P&L | **Folded into** Business Health > Money tab |
| Finance > AI Costs | **Folded into** Business Health > Costs tab |
| Finance > Subscriptions | **Sidebar > Subscriptions** (operational utility) |
| Finance > Credit Economy | **Sidebar > Settings > Credit Economy tab** |
| Users (directory + detail) | **Sidebar > Users** (unchanged) |
| Content browser | **Sidebar > Content** (unchanged) |
| Audit Log | **Sidebar > Audit** (unchanged) |
| Settings | **Sidebar > Settings**, expanded with new tabs: Credits Config · Feature Management · Credit Economy · Annotations · Marketing Spend (if CAC ships) |
| Moderation (hidden) | **Sidebar > Content > Moderation tab** |

### Why Subscriptions stays in the sidebar (not in Business Health)

Business Health shows **trends and ratios** for leadership (MRR, churn, LTV, CAC). The current Subscriptions tab is a **searchable table with Stripe drill-downs** — that's a support tool. Aggregates go to the dashboard; per-row drill-downs stay in the sidebar utility.

---

## Suggested Phasing

**Phase 1 — Buildable today (no consumer-app changes)**

- Product Dashboard with these working: Habit Formation, D7/D30/D90, Plays per song, Re-listen rate, Songs created per active user, Time-of-day heatmap (plays), full filtering by cohort/quiz/content type.
- Business Health: MRR, MRR growth, NRR, Gross margin, LTV by cohort, Monthly churn, Compute cost metrics.
- Vanity: Total users, Total songs, Total Mind Movies, minutes-of-audio (pending duration-field verification).
- All four dashboards scaffolded, with "🚧 awaiting instrumentation" placeholders on blocked tiles.

**Phase 2 — Requires consumer-app release (lovifymusic)**

- `playback_events` table + duration capture → unlocks North Star, Skip Rate, real Listening Minutes.
- `session_events` table → unlocks Session Length Distribution.
- `share_events` table → unlocks DB-side Share Rate, Shares per sharing user, Platform breakdown, Sharer vs non-sharer retention.
- Exit survey modal (14+ days inactive) → unlocks exit survey panel.

**Phase 3 — External integrations**

- Push notification logging (FCM/APNS/OneSignal webhook → `notification_events` table) → unlocks Notification Response Rate.
- Mobile install attribution SDK (Branch / AppsFlyer / Adjust) → unlocks Viral Coefficient, Install Source, Share-to-Install conversion.
- Marketing spend entry UI or Ad-platform API integration → unlocks CAC, LTV/CAC, CAC payback.
- App Store Connect + Play Store APIs → unlocks Downloads this month, App store rating.
