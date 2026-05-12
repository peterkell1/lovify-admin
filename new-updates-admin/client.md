# Lovify Admin — Revamp Plan

Hi! Here's what we'll change, what we can build now, what needs work, and what isn't possible. Short and to the point.

---

## What We're Changing From the Current Admin Panel

The new layout follows your 4-dashboard brief: **Product · Business Health · Growth · Vanity** in the top nav, with Product as the default home page.

| Current page | What happens to it |
|---|---|
| Dashboard (current homepage) | Replaced by Product Dashboard |
| Analytics (funnel, segments) | Removed — folded into Product drill-downs |
| Finance > P&L | Becomes Business Health > Money tab |
| Finance > AI Costs | Becomes Business Health > Costs tab |
| Finance > Credit Economy | Moved into Settings |

---

## What You Didn't Mention — How We're Handling It

Your brief covers the 4 dashboards but doesn't speak to operational tools the team uses daily. We're keeping these as utility pages in a side menu (collapsed by default so dashboards get full screen):

- **Users** — search, view details, grant credits, etc.
- **Content** — browse/moderate songs, visions, Mind Movies
- **Subscriptions** — searchable table with Stripe drill-down (for support)
- **Audit Log** — every admin action tracked
- **Settings** — credits config, feature flags, dashboard annotations, marketing spend entry

These don't appear in your 4 dashboards because they're tools, not metrics. Removing them would break daily operations.

---

## Possible Now — Buildable With Current Data

These ship without any consumer-app changes.

- Habit Formation rate (4+ of first 14 days)
- D7 / D30 / D90 retention
- Plays per song distribution
- Re-listen rate
- Songs created per active user (rolling)
- Time-of-day heatmap (play frequency)
- MRR / MRR growth / Net revenue retention / Gross margin
- LTV by cohort
- Monthly churn rate
- Compute cost per user / per song / as % of revenue
- Total users / songs / Mind Movies (Vanity)
- Filtering by signup cohort, quiz answers, content type
- Drill-downs by cohort and segment
- Trend-line annotations (you can pin events like "v2.1 launch")

---

## Possible With Effort — Needs Work to Become Possible

These require new instrumentation, but no external paid services.

### Small (admin-side only)

- **Marketing Spend entry form** — unlocks CAC, LTV/CAC, payback (manual monthly entry)
- **Trend-line annotations** — admin UI to pin events on charts

### Medium (needs lovifymusic mobile release)

- **North Star — Daily Active Listening Minutes per User** — needs playback duration capture in player
- **Skip rate (<30s)** — same duration capture
- **True listening-minutes heatmap** — same
- **Activation Rate (strict ≥30s definition)** — same
- **Session length distribution** — needs session start/end events
- **Share rate / shares per user / platform breakdown** — needs share-event logging
- **Sharer vs non-sharer retention curves** — unlocked once share events land
- **Exit survey** (inactive 14+ days) — needs modal trigger in mobile app

---

## Risky — Possible But Carries Real Risk

We can do these, but they need careful handling.

- **Editing the consumer app player** to capture playback duration — a bug here breaks audio for every user. Needs staged rollout.
- **Push notification webhook** — wrong setup could leak user data or flood the database.
- **Push provider credentials & App Store API keys** — must be locked in a secret manager; rotation matters.
- **Changing locked metric definitions later** — once we ship the dashboards with one definition of "a listen," changing it later breaks historical comparisons. You'd lose trend continuity.
- **Stripe payout reconciliation for true cash flow** — easy to double-count revenue if not careful.

---

## Not Possible Today

These need things we don't have access to without significant external investment.

- **Viral coefficient (k-factor)**
- **Share-to-install conversion rate**
- **Install source breakdown** (paid / organic / referral / viral)
- **Activation rate: shared-link installs vs paid installs**

All four are blocked by the same thing: **mobile install attribution**. We can't track that a user who installed the app came from a shared link. To unlock this you'd need a paid SDK like Branch, AppsFlyer, or Adjust integrated into the iOS app.

- **CAC by channel (automated)** — Manual entry works (see "Possible With Effort"). Automated requires Meta + TikTok + Google Ads API integrations.
- **Total downloads this month** — Needs App Store Connect + Play Store API access.
- **App store rating** — Same API access needed.
- **Acquisition source for app-store direct installs** — Users who install directly from the App Store (not through your funnel) have no traceable source. Only funnel users have UTM data today.
- **Real-time dashboards** — Current architecture is poll-based. Real-time would be a rewrite.

---

## What We Need From You

To finalize scope and start building:

1. **Confirm the consumer app (lovifymusic) is in scope.** Most of the Product Dashboard's depth depends on changes in the mobile app — without those, we ship a partial dashboard with placeholders.
2. **Decide on install attribution.** Without a paid SDK, the Growth dashboard stays ~25% complete.
3. **Decide on marketing data.** Manual ad-spend entry (cheap, half a day) vs full ad-platform API integration (weeks, three separate auth flows).
4. **Approve the "listen = any play" temporary definition** for Activation Rate until duration capture ships — or wait until then to launch the Product dashboard.
