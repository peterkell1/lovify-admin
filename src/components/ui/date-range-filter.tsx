import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogHeader, DialogTitle, DialogContent } from '@/components/ui/dialog'
import { Calendar } from 'lucide-react'

export type PresetRange = '3d' | '1w' | '1m' | '3m' | '1y' | 'custom'

export interface DateRange {
  from: string
  to: string
}

interface DateRangeFilterProps {
  value: PresetRange
  range: DateRange
  onChange: (preset: PresetRange, range: DateRange) => void
}

const PRESETS: { id: PresetRange; label: string }[] = [
  { id: '3d', label: '3 days' },
  { id: '1w', label: '1 week' },
  { id: '1m', label: 'This month' },
  { id: '3m', label: '3 months' },
  { id: '1y', label: '1 year' },
  { id: 'custom', label: 'Custom' },
]

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0]
}

export function computeRange(preset: PresetRange, custom?: DateRange): DateRange {
  const today = new Date()
  const to = formatDate(today)

  switch (preset) {
    case '3d': {
      const from = new Date(today)
      from.setDate(from.getDate() - 2) // includes today + 2 prior
      return { from: formatDate(from), to }
    }
    case '1w': {
      const from = new Date(today)
      from.setDate(from.getDate() - 6)
      return { from: formatDate(from), to }
    }
    case '1m': {
      const from = new Date(today.getFullYear(), today.getMonth(), 1)
      return { from: formatDate(from), to }
    }
    case '3m': {
      const from = new Date(today)
      from.setMonth(from.getMonth() - 3)
      return { from: formatDate(from), to }
    }
    case '1y': {
      const from = new Date(today)
      from.setFullYear(from.getFullYear() - 1)
      return { from: formatDate(from), to }
    }
    case 'custom':
      return custom ?? { from: to, to }
  }
}

export function DateRangeFilter({ value, range, onChange }: DateRangeFilterProps) {
  const [showCustom, setShowCustom] = useState(false)
  const [tmpFrom, setTmpFrom] = useState(range.from)
  const [tmpTo, setTmpTo] = useState(range.to)

  const handlePresetClick = (preset: PresetRange) => {
    if (preset === 'custom') {
      setTmpFrom(range.from)
      setTmpTo(range.to)
      setShowCustom(true)
      return
    }
    const newRange = computeRange(preset)
    onChange(preset, newRange)
  }

  const handleApplyCustom = () => {
    if (tmpFrom && tmpTo && tmpFrom <= tmpTo) {
      onChange('custom', { from: tmpFrom, to: tmpTo })
      setShowCustom(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-1 bg-secondary rounded-xl p-1 flex-wrap">
        {PRESETS.map((preset) => (
          <button
            key={preset.id}
            onClick={() => handlePresetClick(preset.id)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer',
              value === preset.id
                ? 'bg-card text-foreground shadow-soft'
                : 'text-tertiary hover:text-foreground'
            )}
          >
            {preset.id === 'custom' && value === 'custom' ? (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {range.from} → {range.to}
              </span>
            ) : (
              preset.label
            )}
          </button>
        ))}
      </div>

      <Dialog open={showCustom} onClose={() => setShowCustom(false)}>
        <DialogHeader onClose={() => setShowCustom(false)}>
          <DialogTitle>Custom Date Range</DialogTitle>
        </DialogHeader>
        <DialogContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">From</label>
              <Input type="date" value={tmpFrom} onChange={(e) => setTmpFrom(e.target.value)} max={tmpTo} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">To</label>
              <Input type="date" value={tmpTo} onChange={(e) => setTmpTo(e.target.value)} min={tmpFrom} />
            </div>
          </div>
          {tmpFrom && tmpTo && tmpFrom > tmpTo && (
            <p className="text-xs text-destructive">From date must be before To date.</p>
          )}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowCustom(false)} className="flex-1">Cancel</Button>
            <Button
              onClick={handleApplyCustom}
              disabled={!tmpFrom || !tmpTo || tmpFrom > tmpTo}
              className="flex-1"
            >
              Apply
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
