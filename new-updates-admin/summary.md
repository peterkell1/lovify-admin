# Lovify Admin Revamp — Summary

## What We're Moving From Current Panel

| Current page | Where it goes |
|---|---|
| Dashboard (KPI grid + revenue chart) | Removed — replaced by Product Dashboard |
| Analytics (funnel, segments, content counts) | Removed — folded into Product drill-downs + Vanity |
| Finance > P&L | Business Health > Money tab |
| Finance > AI Costs | Business Health > Costs tab |
| Finance > Subscriptions | Sidebar > Subscriptions (utility) |
| Finance > Credit Economy | Sidebar > Settings > Credit Economy tab |
| Users | Sidebar > Users (unchanged) |
| Content browser | Sidebar > Content (unchanged) |
| Audit Log | Sidebar > Audit (unchanged) |
| Settings | Sidebar > Settings + new tabs (Annotations, Marketing Spend) |
| Moderation (hidden) | Sidebar > Content > Moderation tab |

---

## How We're Handling Layout

- **Two-tier nav**: top bar = 4 dashboards, sidebar = ops pages
- **Product Dashboard** = default home
- **Sidebar collapsed** by default on dashboards, expanded on ops routes
- **Product** = stacked sections, **Business Health + Growth** = tabs, **Vanity** = flat list
- **Filters reset** per dashboard (Date · Cohort · Source · Quiz · Content type)
- **Drill-downs** = side panel from right
- **Annotations** = pinned events on trend line, any admin can edit via Settings
- **Vanity** = muted gray, warning banner, no charts/filters

---

## Possible Now (No Backend Work)

- D7 / D30 / D90 retention
- Habit Formation rate (4+ of first 14 days)
- Plays per song (distribution)
- Re-listen rate
- Songs created per active user (rolling)
- Time-of-day heatmap (plays, not minutes)
- MRR / MRR growth / NRR / Gross margin
- LTV by cohort
- Monthly churn
- Compute cost per user / song / % revenue
- Total users / songs / Mind Movies (Vanity)
- Filtering by signup cohort, quiz answers, content type
- All 4 dashboard shells + nav + sidebar collapse + side-panel drill-downs

---

## Needs Work to Become Possible

### Small lift — backend + admin UI only

- **Annotations table + Settings tab** — 1 day
- **Marketing Spend table + entry form** — half day (enables CAC if spend is entered manually)
- **Exit survey storage** — reuse `user_feedback` table, half day

### Medium lift — needs lovifymusic mobile release

- **North Star (Daily Active Listening Minutes / User)** — needs `playback_events` table + duration capture in player
- **Skip rate** — same blocker (duration capture)
- **Session length distribution** — needs `session_events` table + app open/close tracking
- **True listening-minutes heatmap** — same duration blocker
- **Activation Rate (strict definition)** — needs duration capture to enforce "≥30s = a listen"
- **Share rate / Shares per sharer / Platform breakdown** — needs `share_events` table + frontend write
- **Sharer vs non-sharer retention** — unlocked once share events land
- **Exit survey trigger** — modal in mobile app on 14+ day return

### Large lift — external integrations

- **Notification Response Rate** — needs push provider webhook (FCM/APNS/OneSignal) + `notification_events` table
- **CAC / LTV-CAC / CAC payback** — Meta/TikTok/Google Ads API integrations
- **Total downloads this month** — App Store Connect + Play Store APIs
- **App store rating** — App Store Connect API polling

---

## Not Possible Today

- **Viral coefficient (k-factor)** — requires sharer → install → signup chain; no mobile install attribution
- **Share-to-install conversion** — same blocker
- **Install source breakdown (paid/organic/referral/viral)** — same blocker
- **Activation rate: shared-link installs vs paid installs** — same blocker
- **True cash flow** — needs Stripe payout reconciliation, no expense ledger
- **Acquisition source for app-store direct installs** — UTM exists for funnel users only

---

## High Risk

- **Touching consumer app player code** — duration capture changes `usePlayTracking.ts`; bug here breaks playback for every user
- **Push provider webhook** — wrong setup floods DB or leaks PII
- **App Store / Play Store API keys** — credentials must be locked to a secret manager
- **Stripe payout reconciliation** — easy to double-count revenue if not careful
- **Changing locked metric definitions later** — historical comparisons break

---

## High Effort

- **Mobile install attribution SDK** (Branch / AppsFlyer / Adjust) — paid SDK + iOS native integration + 1 release cycle
- **Backfilling playback duration** — impossible, only starts measuring once shipped (waiting period: 28 days minimum for North Star to be meaningful)
- **CAC pipeline** — 3 separate ad-platform APIs + spend reconciliation + currency handling
- **Real-time dashboards** — current architecture is poll-based; converting to subscriptions is a rewrite
- **RBAC beyond admin/not-admin** — would need new role taxonomy across all RLS policies
