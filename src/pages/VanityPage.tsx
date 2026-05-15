import { useTotalUsersLifetime, useTotalSongs, useTotalMindMovies, useTotalAudioMinutes } from '@/hooks/use-vanity'
import { formatNumber } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

interface RowProps {
  label: string
  value: string | null
  secondary?: string
  unavailable?: string
  loading?: boolean
}

const VanityRow = ({ label, value, secondary, unavailable, loading }: RowProps) => {
  return (
    <div className="flex items-baseline justify-between gap-6 border-b border-border/60 py-3 last:border-b-0">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground/80">{label}</dt>
      <dd className="text-right">
        {loading ? (
          <Skeleton className="h-4 w-20 ml-auto" />
        ) : unavailable ? (
          <div className="flex flex-col items-end">
            <span className="text-base text-muted-foreground/60">—</span>
            <span className="text-[10px] text-muted-foreground/50 italic">{unavailable}</span>
          </div>
        ) : (
          <div className="flex flex-col items-end">
            <span className="text-base text-muted-foreground">{value}</span>
            {secondary && (
              <span className="text-[10px] text-muted-foreground/60">{secondary}</span>
            )}
          </div>
        )}
      </dd>
    </div>
  )
}

const VanityPage = () => {
  const { data: totalUsers, isLoading: usersLoading } = useTotalUsersLifetime()
  const { data: songs, isLoading: songsLoading } = useTotalSongs()
  const { data: mindMovies, isLoading: moviesLoading } = useTotalMindMovies()
  const { data: audioMinutes, isLoading: audioLoading } = useTotalAudioMinutes()

  return (
    <div className="max-w-2xl mx-auto py-12 text-muted-foreground">
      <header className="mb-6">
        <h1 className="text-xl font-normal text-muted-foreground tracking-tight">Vanity Metrics</h1>
      </header>

      <p className="text-xs italic text-muted-foreground/70 border-l-2 border-muted pl-3 mb-8 leading-relaxed">
        These metrics do not predict product health or business value. They exist for external reporting only.
        For product decisions, use the Product dashboard.
      </p>

      <dl className="text-sm">
        <VanityRow
          label="Total users (lifetime)"
          value={totalUsers != null ? formatNumber(totalUsers) : null}
          loading={usersLoading}
        />

        <VanityRow
          label="Total songs"
          value={songs ? formatNumber(songs.lifetime) : null}
          secondary={songs ? `${formatNumber(songs.thisMonth)} this month` : undefined}
          loading={songsLoading}
        />

        <VanityRow
          label="Total Mind Movies"
          value={mindMovies ? formatNumber(mindMovies.lifetime) : null}
          secondary={mindMovies ? `${formatNumber(mindMovies.thisMonth)} this month` : undefined}
          loading={moviesLoading}
        />

        {/* Hide row entirely if duration column is missing/unreadable */}
        {audioLoading ? (
          <VanityRow label="Minutes of audio generated" value={null} loading />
        ) : audioMinutes != null ? (
          <VanityRow
            label="Minutes of audio generated"
            value={`${formatNumber(audioMinutes)} min`}
          />
        ) : null}

        <VanityRow
          label="Total shares"
          value={null}
          unavailable="needs share events"
        />

        <VanityRow
          label="Total downloads this month"
          value={null}
          unavailable="needs App Store API"
        />

        <VanityRow
          label="App store rating"
          value={null}
          unavailable="needs App Store API"
        />
      </dl>
    </div>
  )
}

export default VanityPage
