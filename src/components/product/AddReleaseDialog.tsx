import { useState, useEffect } from 'react'
import { Dialog, DialogHeader, DialogTitle, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import {
  useAddReleaseAnnotation,
  type ReleaseKind,
} from '@/hooks/use-release-annotations'

interface Props {
  open: boolean
  onClose: () => void
  defaultDate?: string // YYYY-MM-DD
}

const KIND_OPTIONS: { value: ReleaseKind; label: string }[] = [
  { value: 'release', label: 'Release / Deploy' },
  { value: 'feature', label: 'New Feature' },
  { value: 'fix', label: 'Bug Fix' },
  { value: 'experiment', label: 'Experiment / A-B Test' },
  { value: 'marketing', label: 'Marketing Push' },
  { value: 'infra', label: 'Infra / Deploy' },
  { value: 'incident', label: 'Incident' },
]

function todayDateLocal(): string {
  // datetime-local needs YYYY-MM-DDTHH:MM (no seconds, no timezone)
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function AddReleaseDialog({ open, onClose, defaultDate }: Props) {
  const add = useAddReleaseAnnotation()
  const [whenLocal, setWhenLocal] = useState(() => defaultDate ?? todayDateLocal())
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [kind, setKind] = useState<ReleaseKind>('release')
  const [externalUrl, setExternalUrl] = useState('')

  useEffect(() => {
    if (open) {
      setWhenLocal(defaultDate ?? todayDateLocal())
      setTitle('')
      setDescription('')
      setKind('release')
      setExternalUrl('')
    }
  }, [open, defaultDate])

  const handleSubmit = async () => {
    if (!title.trim()) return
    const occurredAt = new Date(whenLocal).toISOString()
    await add.mutateAsync({
      occurred_at: occurredAt,
      title: title.trim(),
      description: description.trim() || undefined,
      kind,
      external_url: externalUrl.trim() || undefined,
    })
    if (!add.isError) onClose()
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader onClose={onClose}>
        <DialogTitle>Log a release</DialogTitle>
        <p className="text-xs text-tertiary mt-1">
          Tag a deploy, feature drop, or marketing push so it appears as a marker on the trend
          charts.
        </p>
      </DialogHeader>
      <DialogContent className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">When</label>
          <Input
            type="datetime-local"
            value={whenLocal}
            onChange={(e) => setWhenLocal(e.target.value)}
            className="h-10"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            Title <span className="text-rose-600">*</span>
          </label>
          <Input
            placeholder="e.g. New onboarding flow rolled out"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-10"
            autoFocus
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">Type</label>
          <Select value={kind} onChange={(e) => setKind(e.target.value as ReleaseKind)} className="h-10">
            {KIND_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            Description <span className="text-tertiary font-normal">(optional)</span>
          </label>
          <textarea
            placeholder="What changed, hypothesis for impact, etc."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full resize-none rounded-lg border border-input bg-secondary px-3 py-2 text-sm placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            Link <span className="text-tertiary font-normal">(optional — commit, PR, etc.)</span>
          </label>
          <Input
            placeholder="https://github.com/.../commit/abc123 or PR URL"
            value={externalUrl}
            onChange={(e) => setExternalUrl(e.target.value)}
            className="h-10"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!title.trim() || add.isPending}
          >
            {add.isPending ? 'Logging…' : 'Log release'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
