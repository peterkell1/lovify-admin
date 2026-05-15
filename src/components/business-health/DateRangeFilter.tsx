import { cn } from '@/lib/utils'
import type { DateRange } from '@/hooks/use-business-health'

const PRESETS: { id: '7d' | '30d' | '90d' | '365d'; label: string; days: number }[] = [
  { id: '7d', label: '7d', days: 7 },
  { id: '30d', label: '30d', days: 30 },
  { id: '90d', label: '90d', days: 90 },
  { id: '365d', label: '1y', days: 365 },
]

export type DateRangePresetId = (typeof PRESETS)[number]['id']

export const rangeFromPreset = (id: DateRangePresetId): DateRange => {
  const preset = PRESETS.find((p) => p.id === id) ?? PRESETS[1]
  const from = new Date()
  from.setDate(from.getDate() - preset.days)
  const to = new Date()
  return {
    from: from.toISOString().split('T')[0],
    to: to.toISOString().split('T')[0],
  }
}

interface DateRangeFilterProps {
  value: DateRangePresetId
  onChange: (value: DateRangePresetId) => void
}

export const DateRangeFilter = ({ value, onChange }: DateRangeFilterProps) => {
  return (
    <div className="inline-flex gap-1 bg-secondary rounded-xl p-1">
      {PRESETS.map((preset) => (
        <button
          key={preset.id}
          onClick={() => onChange(preset.id)}
          className={cn(
            'px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer',
            value === preset.id
              ? 'bg-card text-foreground shadow-soft'
              : 'text-tertiary hover:text-foreground'
          )}
        >
          {preset.label}
        </button>
      ))}
    </div>
  )
}
