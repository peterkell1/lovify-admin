import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MissingDataCard } from '@/components/product/MissingDataCard'
import { AlertTriangle } from 'lucide-react'

export default function GrowthPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Growth</h1>
        <p className="text-tertiary text-sm mt-1">
          Are users bringing other users? Where are they coming from?
        </p>
      </div>

      {/* Banner — explain why most things here are empty */}
      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="p-5 flex gap-3">
          <div className="h-9 w-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div className="text-sm">
            <p className="font-semibold text-foreground">
              This dashboard is waiting on event tracking.
            </p>
            <p className="text-xs text-amber-800 mt-1 leading-relaxed">
              Growth metrics need two things lovifymusic doesn&rsquo;t log yet: a{' '}
              <strong>share_events</strong> table (every share-button tap with the platform name)
              and populated <strong>attribution_data</strong> on each profile (where the user came
              from). Once both are wired, every tile below lights up automatically.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Section 1 — Viral Mechanics */}
      <div>
        <div className="mb-3">
          <h3 className="text-base font-semibold text-foreground">
            Are users telling other people about Lovify?
          </h3>
          <p className="text-xs text-tertiary mt-0.5">
            The math of word-of-mouth growth. K-factor &gt; 1 means viral.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <MissingDataCard
            title="What's our viral coefficient (k-factor)?"
            reason="Need share_events + share-to-install attribution. K = (shares per user) × (% of shared links that install)."
            hint="Healthy: K=0.3 means each user brings 0.3 new users. Viral: K=1.0+ means exponential growth."
          />
          <MissingDataCard
            title="What % of active users share each month?"
            reason="No share_events tracked yet."
            hint="Healthy share rate for a personal-content app: 5–15% of monthly actives."
          />
          <MissingDataCard
            title="When users do share, how many times?"
            reason="No share_events tracked yet."
            hint="Distribution-shaped metric — most sharers share once, power-sharers many times."
          />
          <MissingDataCard
            title="Of shared links, how many turn into signups?"
            reason="Need share_url tracking + install attribution carrying that share_url through to first profile creation."
            hint="Healthy: 5–15% of shared-link clicks convert to signup."
          />
        </div>
      </div>

      {/* Section 2 — Channels */}
      <div>
        <div className="mb-3">
          <h3 className="text-base font-semibold text-foreground">
            Where are new users coming from?
          </h3>
          <p className="text-xs text-tertiary mt-0.5">
            Both shares (organic) and ad campaigns (paid) — broken out so you can double down on
            the winners.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                Which platforms are users sharing on?
              </CardTitle>
              <p className="text-[11px] text-tertiary mt-0.5 leading-snug">
                Instagram vs TikTok vs iMessage vs WhatsApp vs Twitter vs copy-link. Tells you
                which platforms to optimize the share experience for.
              </p>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 h-[180px] flex items-center justify-center">
                <div className="text-center max-w-xs">
                  <AlertTriangle className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs font-semibold text-foreground">
                    Needs share_events.platform
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Each share-sheet tap should log the platform tapped (e.g. &lsquo;instagram&rsquo;,
                    &lsquo;tiktok&rsquo;, &lsquo;copy_link&rsquo;).
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                Where are installs coming from? (paid vs organic vs viral)
              </CardTitle>
              <p className="text-[11px] text-tertiary mt-0.5 leading-snug">
                Paid (Meta, TikTok, Google), organic (App Store search, web), referral (clicked a
                share link), viral (no specific source).
              </p>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 h-[180px] flex items-center justify-center">
                <div className="text-center max-w-xs">
                  <AlertTriangle className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs font-semibold text-foreground">
                    Needs profiles.attribution_data
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Column already exists. Empty across all 290 profiles. Wire your attribution
                    SDK (AppsFlyer / Adjust / Branch / SKAdNetwork) to populate it on first
                    signed-in app open.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-3">
          <MissingDataCard
            title="Which channels' users share the most? (share rate by source)"
            reason="Cross of attribution_data × share_events. Both blocked."
            hint="When wired: tells you whether TikTok-acquired users share more than Meta-acquired ones, etc."
          />
        </div>
      </div>

      {/* Section 3 — Sharer comparison */}
      <div>
        <div className="mb-3">
          <h3 className="text-base font-semibold text-foreground">
            Are sharers actually our best users?
          </h3>
          <p className="text-xs text-tertiary mt-0.5">
            A common pattern: users who share are also more activated, retained, and pay more.
            Worth proving on your data.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <MissingDataCard
            title="Do sharers retain better than non-sharers?"
            reason="Need share_events to identify sharers + user_sessions to measure retention."
            hint="Once both are wired, this becomes two retention curves overlaid: sharers (top) vs non-sharers (bottom)."
          />
          <MissingDataCard
            title="Do users from shared links activate better than paid installs?"
            reason="Need share-to-install attribution + install-source tagging."
            hint="Common finding: organic referrals activate at 2-3× the rate of paid installs because they came in pre-warmed."
          />
        </div>
      </div>

      <div className="rounded-lg border border-border bg-muted/40 p-4 text-[11px] text-muted-foreground">
        <p>
          <strong className="text-foreground">To unblock this entire dashboard:</strong> add{' '}
          <code>share_events</code> table + populate <code>profiles.attribution_data</code>. See
          items 5 &amp; 6 on the event-tracking spec sent to the dev team.
        </p>
      </div>
    </div>
  )
}
