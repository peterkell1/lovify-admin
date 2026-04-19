# Lovify Admin — Project Context

Complete reference for the lovify-admin project and its integration with lovifymusic.
Share this file with any new chat to get full context.

---

## 1. Project Overview

### Two Repos, One Supabase

| Repo | Purpose | Stack |
|------|---------|-------|
| **lovifymusic** (`c:/Users/hp/Documents/GitHub/lovifymusic`) | Consumer-facing mobile app. Users sign up, generate AI songs/visions/mind movies, pay via Stripe. | React + Vite + TypeScript + Capacitor (iOS) |
| **lovify-admin** (`c:/Users/hp/Documents/GitHub/lovify-admin`) | Internal admin panel for the lovifymusic team. Manage users, content, finance, settings. | React + Vite + TypeScript |

**Both repos connect to the same Supabase project**: `pqjqurjdujwforscefov` (`https://auth.trylovify.com`).

Admin uses the anon key and relies on Supabase RLS policies that check `has_role(auth.uid(), 'admin')` to grant admin access to data.

---

## 2. Lovify Admin — Tech Stack

```
React 19 + Vite + TypeScript (strict)
├── Routing: react-router-dom v7
├── State: Zustand (auth) + TanStack Query (server state)
├── UI: shadcn-style custom components + Tailwind CSS 4
├── Charts: Recharts
├── Forms: react-hook-form + zod
├── Icons: lucide-react
├── Toast: sonner
├── Supabase: @supabase/supabase-js v2
└── Design: Matches lovifymusic (Montserrat font, warm cream palette, dark brown sidebar, orange accent hsl(15 85% 60%))
```

**Path alias:** `@/*` → `./src/*` (via Vite `resolve.alias` + `tsconfig.json paths` with `ignoreDeprecations: "6.0"`)

**Environment variables** (`.env.local`):
- `VITE_SUPABASE_URL=https://auth.trylovify.com`
- `VITE_SUPABASE_ANON_KEY=sb_publishable_...`
- `VITE_SUPABASE_PROJECT_ID=pqjqurjdujwforscefov`

---

## 3. Admin Panel Structure

```
src/
├── App.tsx                              # Router + QueryClient + Toaster
├── main.tsx                             # Entry
├── index.css                            # Tailwind + Lovify color tokens
├── lib/
│   ├── supabase.ts                      # Supabase browser client
│   └── utils.ts                         # cn(), formatDate, formatNumber, formatCurrency
├── stores/
│   └── auth.store.ts                    # Zustand auth (persisted: user + isAdmin)
├── hooks/
│   ├── use-admin-auth.ts                # Login/logout, role check via has_role RPC
│   ├── use-dashboard-stats.ts           # 6 independent KPI queries + revenue chart
│   ├── use-users.ts                     # User directory, detail, credits, content toggle
│   ├── use-finance.ts                   # P&L, AI costs, subscriptions, credit economy
│   ├── use-content.ts                   # Browse songs/visions/videos, moderation log
│   ├── use-analytics.ts                 # Onboarding funnel, segments, content counts
│   ├── use-settings.ts                  # app_settings CRUD + feature flags
│   └── use-audit-log.ts                 # Admin audit log read/write
├── types/
│   └── admin.ts                         # AdminUser, UserSong, UserVision, UserVideo, etc.
├── components/
│   ├── auth/AdminGuard.tsx              # Route protection
│   ├── layout/
│   │   ├── Sidebar.tsx                  # Dark brown collapsible sidebar
│   │   ├── Navbar.tsx                   # Top bar with user + logout
│   │   └── DashboardLayout.tsx          # Sidebar + Navbar + max-w-7xl Outlet
│   ├── dashboard/
│   │   ├── StatCard.tsx                 # Static stat card
│   │   ├── LiveStatCard.tsx             # Independently loading stat card (with skeleton)
│   │   └── RevenueChart.tsx             # Area chart (revenue vs costs)
│   ├── ui/                              # shadcn-style primitives
│   │   ├── button, input, card, badge, avatar, select, dialog, spinner, table
│   │   ├── skeleton.tsx                 # Skeleton, SkeletonCard, SkeletonChart, SkeletonTable, SkeletonContentGrid, SkeletonUserRow
│   │   └── pagination.tsx               # Shared numbered pagination
│   ├── users/
│   │   ├── GrantCreditsDialog.tsx       # Modal to grant credits
│   │   └── SongCard.tsx                 # Song card with inline audio player
│   ├── finance/
│   │   ├── PnLTab.tsx                   # Revenue vs costs + breakdowns
│   │   ├── AICostsTab.tsx               # Daily stacked bar + top models table
│   │   ├── SubscriptionsTab.tsx         # Filterable subs table with Stripe links
│   │   └── CreditEconomyTab.tsx         # Credits granted/consumed breakdown
│   └── content/
│       ├── ContentSongsTab.tsx          # Song grid (audio playback + visibility toggle)
│       ├── ContentVisionsTab.tsx        # Vision grid
│       └── ContentVideosTab.tsx         # Mind movies grid (16:9)
└── pages/
    ├── LoginPage.tsx                    # Lovify branded login (email+password)
    ├── DashboardPage.tsx                # KPI grid (independent loading) + revenue chart
    ├── UsersPage.tsx                    # User directory with search + paginated table
    ├── UserDetailPage.tsx               # Single user: credits, subs, songs, visions, mind movies
    ├── ContentPage.tsx                  # Tab router (Songs/Visions/Videos)
    ├── FinancePage.tsx                  # Tab router (P&L/AI Costs/Subs/Credits)
    ├── ModerationPage.tsx               # (hidden from sidebar) Guardrail rejections
    ├── AnalyticsPage.tsx                # Funnel + segments + content count
    ├── AuditLogPage.tsx                 # Admin action audit trail
    └── SettingsPage.tsx                 # Tabs: Credits Configuration + Feature Management
```

---

## 4. Admin Panel Features (What's Built)

### Dashboard
- 6 independent KPI cards (Total Users, Active Today, Songs, Visions, Credits Consumed, Active Subs, MRR Est)
- Each card fetches via its own `useQuery` — no single query blocks others
- Revenue vs Costs area chart (30 days from `daily_pnl_stats`)

### Users
- Searchable directory (searches email + display_name)
- Numbered pagination (`Showing 1–25 of 142`)
- User detail page: profile, credits, subscription, quick stats (5 cards: Credits/Tier/Songs/Visions/Mind Movies), credit transactions, songs grid (with inline audio player), visions grid, mind movies grid
- **Actions**: Grant Credits modal (calls `grant_credits` RPC), Toggle visibility on any content (Eye icon — Live/Off)

### Content Browser
- 3 tabs: Songs, Visions, Mind Movies
- Grid layout (songs/visions: square aspect, videos: 16:9)
- Filter by visibility (All/Public/Private)
- Search by title/prompt
- Play audio inline (songs)
- Click creator name → jump to user detail page
- Always-visible toggle button: green "Live" / gray "Off" (hovers to opposite color)

### Finance
- **P&L Tab**: Revenue/Costs/Profit/Margin KPIs + area chart + breakdown bars
- **AI Costs Tab**: Stacked bar by cost type + top models table
- **Subscriptions Tab**: Filterable by status (all/active/trialing/canceled/past_due), Stripe link per row
- **Credit Economy Tab**: Total in circulation, granted vs consumed, type breakdown

### Analytics
- Onboarding funnel (horizontal bar): Signed Up → Post-Signup Done → Created First Song → Subscribed
- User segments pie (Free / Active Subscriber / Cancelled)
- Content created in last 7 days (Songs, Visions, Mind Movies counts)

### Audit Log
- Every admin action logged to `admin_audit_log` table
- Wired into: `grant_credits`, `toggle_visibility`
- Filter by action type, paginated
- Details rendered as `key: value` pairs (not raw JSON)

### Settings
- **Credits Configuration Tab**: Edit `signup_free_credits`, `trial_credits`, `daily_bonus_credits` in `app_settings` table
- **Feature Management Tab**: Toggle feature flags (songs, visions, videos, credits_enabled) with green "Live"/gray "Off" switches

### Moderation (hidden from sidebar)
- Commented out in `Sidebar.tsx` navItems until `moderate-prompt` edge function JWT issue is fixed
- Page + code intact, just not linked

---

## 5. Architecture Decisions

### Auth Flow
1. Admin enters email+password on `/login`
2. `signInWithPassword()` → get user
3. Immediately call `has_role(_user_id, 'admin')` RPC
4. If NOT admin → sign out + show error
5. If admin → persist `{ user, isAdmin }` to localStorage via Zustand persist
6. `navigate('/')` directly

Auth state persists across tab switches via `onRehydrateStorage` that skips `initializing` if persisted state exists. `onAuthStateChange` re-verifies admin silently on `TOKEN_REFRESHED` without blocking the UI.

### Data Fetching Patterns
- **Parallel queries** via `Promise.allSettled` — one failure doesn't break the page
- **Independent hooks per stat** — so each KPI card loads independently (no shared `isLoading`)
- **5-min `staleTime`** for config data; 30s for user/content data; navigate-back shows cached data instantly
- **Skeleton loading** per-section (SkeletonCard/SkeletonChart/SkeletonTable/SkeletonContentGrid/SkeletonUserRow) instead of full-page spinners

### UI/Design
- Matches lovifymusic's warm aesthetic: background `hsl(38 100% 97.6%)` cream, accent `hsl(15 85% 60%)` warm orange, sidebar `hsl(24 10% 14%)` dark brown
- Font: Montserrat (same as lovifymusic)
- Logo: `lovify-logo.png` copied from lovifymusic `public/`
- Border radius scale: 0.5–1.5rem (matches lovifymusic's 1rem base)
- Shadows: `shadow-soft` and `shadow-dreamy` utility classes

### Pagination
- Shared `Pagination` component: `Showing 1–25 of 142` + numbered buttons `< 1 2 [3] 4 … 6 >`
- Used in: Users, Content (Songs/Visions/Videos), Subscriptions, Audit Log

---

## 6. Supabase Schema Changes (All in lovifymusic repo)

### New Tables

```sql
-- admin_audit_log — tracks every admin action
CREATE TABLE admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
-- RLS: Admins can read + insert
```

### New RLS Policies Added
- `Admins can read all videos` on `generated_videos` (SELECT)
- `Admins can toggle is_public on videos` on `generated_videos` (UPDATE)
- `Admins can read audit log` + `Admins can insert audit log` on `admin_audit_log`
- `GRANT SELECT ON profiles TO authenticated` (was column-restricted, now full table)

### Existing Policies (already present before admin project)
- `Admins can view all profiles`, `generated_songs`, `generated_visions`, `user_credits`, `credit_transactions`, `subscriptions`, `daily_pnl_stats`, `api_costs`, `revenue_events`, `content_moderation_log`, `feature_flags`, `feature_access`, `prompt_overrides`

### New Migration: `20260418000000_make_credits_dynamic.sql`
Makes signup/trial/daily-bonus credit amounts configurable via `app_settings` table:

1. **`get_setting_int(key, default)`** — SQL helper that reads from `app_settings` with fallback
2. **Seeds** `app_settings` with `signup_free_credits=300`, `trial_credits=1000`, `daily_bonus_credits=5`
3. **Rewrites `handle_new_profile_credits()` trigger** — reads signup credits from `app_settings`
4. **Rewrites `claim_verification_credits()` RPC** — reads signup credits from `app_settings`
5. **Rewrites `claim_daily_bonus()` RPC** — reads daily bonus from `app_settings`
6. **`GRANT SELECT ON app_settings TO authenticated, anon`** — so UI can read values

### Key existing RPCs the admin panel uses
- `has_role(user_id, role)` — admin role check
- `grant_credits(user_id, amount, type, description)` — used by Grant Credits dialog

### Other existing tables queried by admin
- `profiles`, `user_credits`, `credit_transactions`, `subscriptions`
- `generated_songs`, `generated_visions`, `generated_videos`
- `daily_pnl_stats`, `api_costs`, `revenue_events`
- `app_settings`, `feature_flags`, `feature_access`
- `content_moderation_log`

---

## 7. Lovifymusic Changes (Made during admin project)

### `supabase/functions/stripe-webhook/index.ts`
- `TRIAL_CREDITS = 1000` constant → replaced with `getTrialCredits(supabase)` async function that reads from `app_settings.trial_credits` with fallback
- Used in 3 places: `grantSubscriptionCredits` (during trialing), trial-to-paid conversion grant, `handleTrialSubscriptionCreated`

### `supabase/migrations/20260418000000_make_credits_dynamic.sql`
New migration (documented above).

### `src/contexts/AuthContext.tsx` — `signUpWithEmail()`
Before signup, reads `signup_free_credits` from `app_settings` and passes it as `signup_credits` in user metadata → Supabase email template renders `{{ .Data.signup_credits }}`.

### `src/hooks/useCreditConfig.ts` (new)
React Query hook that reads `signup_free_credits`, `trial_credits`, `daily_bonus_credits` from `app_settings` with 5-min cache + sensible defaults.

### UI Text Updated (to use `useCreditConfig`)
All hardcoded "300 credits" replaced with `{creditConfig?.signup_free_credits ?? 300}`:
- `src/components/home/PersonalHomePage.tsx` — WelcomeBonusModal creditAmount
- `src/components/home/EmailVerificationBanner.tsx` — "Unlock your X free credits" / "Claim X credits"
- `src/components/home/WelcomeBonusModal.tsx` — toast "X credits added"
- `src/pages/AssetsPage.tsx` — "Get X credits free" hero
- `src/components/movies/MovieCreator.tsx` — sign-in prompt dialog
- `src/components/player/MobileFullPlayer.tsx` — guest signup prompt
- `src/components/onboarding/OnboardingSignUp.tsx` — post-signup "unlock X free credits"

### Email Template (Supabase Dashboard, manual change)
Updated Supabase Auth > Email Templates > Confirm signup to use `{{ .Data.signup_credits }}` instead of hardcoded "300".

---

## 8. How The Two Repos Connect

```
┌──────────────────────────────────────────────────────────────┐
│               Supabase (pqjqurjdujwforscefov)                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Database (Postgres)                                  │   │
│  │  ├─ profiles, user_credits, subscriptions             │   │
│  │  ├─ generated_songs, generated_visions, videos        │   │
│  │  ├─ admin_audit_log, app_settings, feature_flags      │   │
│  │  └─ daily_pnl_stats, api_costs, revenue_events        │   │
│  │                                                        │   │
│  │  RLS: has_role(auth.uid(), 'admin') → admin rows      │   │
│  │       auth.uid() = user_id → own rows (regular users) │   │
│  │                                                        │   │
│  │  RPCs: has_role, grant_credits, claim_daily_bonus,    │   │
│  │        claim_verification_credits, rollover_*, etc.   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  Edge Functions: stripe-webhook, moderate-prompt, etc.       │
└────────────────┬──────────────────────────┬─────────────────┘
                 │                          │
      anon key + admin JWT        anon key + user JWT
                 │                          │
         ┌───────▼────────┐        ┌────────▼────────┐
         │  lovify-admin  │        │  lovifymusic    │
         │  (Vite SPA)    │        │  (Vite + Cap)   │
         │                │        │                 │
         │  For admins    │        │  For end users  │
         └────────────────┘        └─────────────────┘
```

### Flow: Admin changes signup credit amount
1. Admin opens `lovify-admin` → Settings → Credits Configuration
2. Enters 500 in "Free Signup Credits" → Save
3. Frontend calls `supabase.from('app_settings').upsert({ key: 'signup_free_credits', value: '500' })`
4. Later, a user signs up in lovifymusic:
   - `AuthContext.signUpWithEmail()` reads 500 from `app_settings`
   - Passes `signup_credits: '500'` in `user_metadata`
   - Supabase Auth sends verification email with `{{ .Data.signup_credits }}` = "500"
   - User verifies email → `claim_verification_credits()` RPC reads 500 from `app_settings` → grants 500 credits
   - Welcome modal in app reads 500 via `useCreditConfig` → shows "Claim 500 credits"

### Flow: Admin grants credits to a user
1. Admin opens user detail page in `lovify-admin`
2. Clicks Grant Credits → enters 1000
3. Frontend calls `grant_credits(user_id, 1000, 'admin_grant', ...)` RPC
4. RPC adds 1000 to user's `topup_credits` + inserts `credit_transactions` row
5. Frontend fires `logAudit('grant_credits', 'user', userId, { amount: 1000 })` to `admin_audit_log`
6. User's next page refresh in lovifymusic → `useCredits` hook shows updated balance

### Flow: Admin unpublishes a song
1. Admin opens Content > Songs, hovers a song card
2. Clicks green "Live" button → turns into red hover (unpublish)
3. Frontend: `UPDATE generated_songs SET is_public = false WHERE id = ...`
4. RLS policy "Admins can toggle is_public on songs" allows this
5. `logAudit('toggle_visibility', 'generated_songs', songId, { is_public: false })` → audit log
6. React Query invalidates content-songs + admin-user-detail → UI refetches
7. Song is no longer visible in public feeds to lovifymusic users

---

## 9. Setup Instructions (Fresh Install)

### 1. Admin panel setup
```bash
cd lovify-admin
npm install
cp .env.example .env.local  # fill in Supabase vars
npm run dev
```

### 2. Required Supabase admin role setup
```sql
-- Grant admin role to your account
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users WHERE email = 'YOUR_EMAIL'
ON CONFLICT DO NOTHING;
```

### 3. Required migrations to run in Supabase SQL Editor
All of these live in `lovifymusic/supabase/migrations/` and should already be applied if lovifymusic is up-to-date. The critical ones for admin:

- `20260317170000_admin_profiles_access.sql` — admin sees all profiles
- `20260417060000_admin_content_takedown.sql` — admin toggles is_public on content
- `20260418000000_make_credits_dynamic.sql` — dynamic credit config

### 4. Manual SQL to run for admin panel
If upgrading an existing Supabase that doesn't have these:

```sql
-- Admin audit log
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_log_created_at ON admin_audit_log(created_at DESC);
CREATE INDEX idx_audit_log_action ON admin_audit_log(action);
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can read audit log" ON admin_audit_log
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert audit log" ON admin_audit_log
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));

-- Admin video update policy
CREATE POLICY "Admins can toggle is_public on videos"
  ON generated_videos FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Full SELECT grant on profiles (fixes column-level restriction bug)
GRANT SELECT ON profiles TO authenticated;

-- Seed app_settings for new/missing feature flags
INSERT INTO feature_flags (name, is_enabled, description) VALUES
  ('songs', true, 'Song creation feature'),
  ('visions', true, 'Vision board generation feature')
ON CONFLICT DO NOTHING;

NOTIFY pgrst, 'reload schema';
```

### 5. Deploy updated stripe-webhook
```bash
cd lovifymusic
supabase functions deploy stripe-webhook
```

---

## 10. Known Gotchas & Fixes Applied

### ❗ Auth flow blinking
**Problem**: After login, page briefly showed dashboard then redirected back to login.
**Fix**: LoginPage no longer uses `setTimeout(navigate, 500)`. Instead checks admin role synchronously after signIn, sets store, then navigates directly.

### ❗ Tab switch re-loading
**Problem**: Switching tabs triggered `TOKEN_REFRESHED` which reset `isLoading=true` → full page spinner.
**Fix**: Store uses `initializing` flag (only true on first visit). `onAuthStateChange` updates user silently on `TOKEN_REFRESHED` without touching `initializing`.

### ❗ Only 7 users visible
**Problem**: Admin panel showed 7 users instead of 142.
**Fix**: Ran `GRANT SELECT ON profiles TO authenticated` — a prior `REVOKE SELECT (email)` migration had switched Postgres into column-level mode, silently filtering rows without email-column grant.

### ❗ Schema cache stale
**Problem**: After creating `admin_audit_log`, API returned "relation not found".
**Fix**: Run `NOTIFY pgrst, 'reload schema';` or restart project in Supabase dashboard.

### ❗ Supabase SQL editor parsing errors
**Problem**: `SELECT ... INTO variable` inside function bodies confused the editor into thinking variable was a table.
**Fix**: Rewrote all functions to use `variable := (SELECT ...)` assignments and named dollar quotes (`$func$` instead of `$$`).

### ❗ All cards show skeleton even when only one API is slow
**Problem**: Single `useDashboardStats` hook meant all 6 stats shared `isLoading`.
**Fix**: Split into 6 independent hooks (`useTotalUsers`, `useActiveToday`, etc.) — each card loads and shows independently.

### ❗ Content card toggle didn't refresh after click
**Problem**: Clicking Live/Off toggle updated DB but UI badge didn't change.
**Fix**: Added `queryClient.invalidateQueries(['content-songs'/'visions'/'videos'])` to `useToggleContentVisibility.onSuccess`.

---

## 11. What's Working End-to-End

- ✅ Admin login with role verification
- ✅ Dashboard with 6 independent KPIs + revenue chart
- ✅ User search/directory with skeleton loading + numbered pagination
- ✅ User detail: profile, credits, subs, songs (playable), visions, mind movies
- ✅ Grant credits dialog → audit log
- ✅ Content browser: play songs inline, toggle visibility per item (audited)
- ✅ P&L dashboard with 30-day chart + revenue/cost breakdown
- ✅ AI costs stacked daily chart + top models table
- ✅ Subscriptions table with Stripe dashboard links
- ✅ Credit economy: granted vs consumed over 30 days
- ✅ Analytics: onboarding funnel, user segments pie, content counts
- ✅ Audit log table with action filter
- ✅ Settings: credits configuration (signup/trial/daily) + feature management toggles
- ✅ **Dynamic credit amounts**: changing admin Settings changes actual grants in lovifymusic (via app_settings reads in trigger/RPCs/edge function)
- ✅ **Dynamic email template**: verification email shows admin-configured number
- ✅ **Dynamic UI strings**: all "300 free credits" hardcodes replaced with hook reads
- ✅ Matching UI design with lovifymusic (warm palette, Montserrat, orange accent)
- ✅ Skeleton loading per-section (not full-page spinners)
- ✅ Shared pagination component

---

## 12. What's Not Implemented / Skipped

- ❌ **Moderation page is hidden from sidebar** — commented out until `moderate-prompt` edge function JWT issue is fixed
- ❌ **RBAC beyond admin/not-admin** — no `super_admin`/`support`/`moderator` roles yet
- ❌ **User ban/suspension** — no UI to ban users
- ❌ **Refund management** — no UI for Stripe refunds
- ❌ **Push notification sender** — no way to send OneSignal pushes from admin
- ❌ **A/B testing framework** — feature flags are binary on/off, no rollout %
- ❌ **Real-time dashboards** — all polling-based, no subscriptions
- ❌ **Featured content management** — can't pin songs/visions to explore page
- ❌ **Bulk moderation** — can't select multiple items for takedown

---

## 13. File Paths Reference

### Lovify Admin critical files
- Router: `src/App.tsx`
- Auth: `src/hooks/use-admin-auth.ts`, `src/stores/auth.store.ts`, `src/components/auth/AdminGuard.tsx`
- Sidebar nav items: `src/components/layout/Sidebar.tsx`
- Theme: `src/index.css`

### Lovifymusic critical files (changed for admin integration)
- Credit config hook: `src/hooks/useCreditConfig.ts`
- Signup flow: `src/contexts/AuthContext.tsx` (`signUpWithEmail`)
- Dynamic UI: `src/components/home/{WelcomeBonusModal,EmailVerificationBanner,PersonalHomePage}.tsx`, `src/pages/AssetsPage.tsx`, `src/components/movies/MovieCreator.tsx`, `src/components/player/MobileFullPlayer.tsx`, `src/components/onboarding/OnboardingSignUp.tsx`
- Stripe webhook: `supabase/functions/stripe-webhook/index.ts`
- Migration: `supabase/migrations/20260418000000_make_credits_dynamic.sql`

### Supabase Dashboard (manual)
- Email template: `Auth > Email Templates > Confirm signup` (uses `{{ .Data.signup_credits }}`)

---

## 14. Default Credit Config Values

If `app_settings` rows are missing, these are the fallback defaults:

| Setting | Default | Used by |
|---------|---------|---------|
| `signup_free_credits` | 300 | Signup trigger, verification claim RPC, all UI text |
| `trial_credits` | 1000 | Stripe webhook (yearly_premium_trial plan) |
| `daily_bonus_credits` | 5 | `claim_daily_bonus()` RPC |

Admin panel can override any of these via Settings > Credits Configuration.

---

## 15. Testing Checklist

### Admin panel tests
- [ ] Login with admin account → reaches dashboard
- [ ] Login with non-admin → "Access Denied" error
- [ ] Users page shows all 142 profiles (not just public)
- [ ] Pagination shows "Showing 1–25 of 142"
- [ ] User detail page shows all 5 stat cards
- [ ] Grant Credits modal works + appears in audit log
- [ ] Toggle song/vision/video visibility → Live/Off badges flip + audit logged
- [ ] Content browser tabs switch correctly, search filters results
- [ ] Song inline audio player plays
- [ ] Finance tabs load independently
- [ ] Settings > Credits Configuration saves to app_settings
- [ ] Settings > Feature Management toggles feature_flags

### Integration tests (lovifymusic)
- [ ] Change signup_free_credits to 500 → new email/password signup gets email with "500 free credits"
- [ ] After verification → user_credits shows 500 in free_credits pool
- [ ] Welcome modal shows "Claim 500 credits"
- [ ] Change daily_bonus_credits to 10 → next daily bonus grants 10
- [ ] Change trial_credits to 2000 → new yearly_premium_trial signup gets 2000 during trial
