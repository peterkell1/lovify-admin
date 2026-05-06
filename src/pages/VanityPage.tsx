import { useVanitySnapshot } from '@/hooks/use-vanity'
import { AlertTriangle, Lock } from 'lucide-react'
import { type ReactNode } from 'react'

function fmtNumber(n: number): string {
  return n.toLocaleString()
}

function fmtMinutes(seconds: number): string {
  const minutes = Math.round(seconds / 60)
  if (minutes >= 1_000_000) return `${(minutes / 1_000_000).toFixed(1)}M`
  if (minutes >= 1_000) return `${(minutes / 1_000).toFixed(1)}K`
  return fmtNumber(minutes)
}

function VanityStat({
  label,
  value,
  isLoading,
  sublabel,
  blocked,
  blockedReason,
}: {
  label: string
  value?: ReactNode
  isLoading?: boolean
  sublabel?: string
  blocked?: boolean
  blockedReason?: string
}) {
  return (
    <div className="border-b border-slate-200 py-3 flex items-baseline justify-between gap-4">
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">
          {label}
        </p>
        {sublabel && (
          <p className="text-[10px] text-slate-400 mt-0.5">{sublabel}</p>
        )}
      </div>
      <div className="text-right shrink-0">
        {blocked ? (
          <div className="text-right">
            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-slate-400 font-medium">
              <Lock className="h-2.5 w-2.5" />
              Not tracked
            </span>
            {blockedReason && (
              <p className="text-[10px] text-slate-400 mt-0.5 max-w-[280px] leading-snug">
                {blockedReason}
              </p>
            )}
          </div>
        ) : isLoading ? (
          <span className="text-lg font-medium text-slate-300">—</span>
        ) : (
          <span className="text-xl font-medium text-slate-700 tabular-nums">{value}</span>
        )}
      </div>
    </div>
  )
}

export default function VanityPage() {
  const { data, isLoading } = useVanitySnapshot()

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-lg font-medium text-slate-600">Vanity Metrics</h1>
        <p className="text-xs text-slate-400 mt-0.5">External reporting only.</p>
      </div>

      {/* Banner — also intentionally muted */}
      <div className="rounded-md border border-slate-200 bg-slate-50 p-3 flex gap-2">
        <AlertTriangle className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" />
        <p className="text-[11px] text-slate-500 leading-relaxed">
          These metrics do not predict product health or business value. They exist for external
          reporting only. For product decisions, use the{' '}
          <a href="/" className="underline hover:text-slate-700">
            Product Health
          </a>{' '}
          dashboard.
        </p>
      </div>

      {/* Stats — single column, no card chrome, narrow column, smaller type */}
      <div className="border-t border-slate-200">
        <VanityStat
          label="Total users (lifetime)"
          value={data ? fmtNumber(data.totalUsers) : undefined}
          isLoading={isLoading}
          sublabel="All-time signups, including test/internal accounts"
        />
        <VanityStat
          label="Total downloads this month"
          blocked
          blockedReason="Requires install attribution. Not yet instrumented."
        />
        <VanityStat
          label="Total songs created (lifetime)"
          value={data ? fmtNumber(data.totalSongsLifetime) : undefined}
          isLoading={isLoading}
        />
        <VanityStat
          label="Total songs created (this month)"
          value={data ? fmtNumber(data.totalSongsThisMonth) : undefined}
          isLoading={isLoading}
        />
        <VanityStat
          label="Total Mind Movies created (lifetime)"
          value={data ? fmtNumber(data.totalVideosLifetime) : undefined}
          isLoading={isLoading}
        />
        <VanityStat
          label="Total Mind Movies created (this month)"
          value={data ? fmtNumber(data.totalVideosThisMonth) : undefined}
          isLoading={isLoading}
        />
        <VanityStat
          label="Total minutes of audio generated"
          value={data ? `${fmtMinutes(data.totalAudioSeconds)} min` : undefined}
          isLoading={isLoading}
          sublabel="Sum of song duration + Mind Movie duration"
        />
        <VanityStat
          label="Total shares"
          blocked
          blockedReason="Requires share_events tracking. Not yet instrumented."
        />
        <VanityStat
          label="App store rating"
          blocked
          blockedReason="Requires App Store / Play Store API integration."
        />
      </div>

      {/* Locked definitions footer */}
      <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-[10px] text-slate-500 leading-relaxed">
        <p className="font-medium text-slate-600 mb-1">Locked definitions</p>
        <ul className="space-y-0.5">
          <li>Active user = opened app in last 28 days</li>
          <li>A listen = played song or Mind Movie for ≥30 seconds</li>
          <li>Meaningful session = ≥2 minutes in app</li>
          <li>
            Activated user = created a song AND listened 3+ times within 7 days of signup
          </li>
          <li>Habit-formed user = activated user AND listened on 4+ of first 14 days</li>
        </ul>
      </div>
    </div>
  )
}
