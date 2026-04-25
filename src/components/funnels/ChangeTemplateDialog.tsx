import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { Dialog, DialogHeader, DialogTitle, DialogContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { TemplateCard } from './TemplateCard'
import { TemplatePreviewDialog } from './TemplatePreviewDialog'
import { listAdminTemplateManifests } from '@/templates/registry'
import type { AdminTemplateManifest } from '@/templates/types'

// Modal wrapper around the template gallery. Re-uses the same
// TemplateCard and TemplatePreviewDialog the create flow uses, so the
// switch experience is identical to picking a template at create time.
// Picking the current template is a no-op (closes the dialog) — the
// parent only sees onSelect for actual changes.
export function ChangeTemplateDialog({
  open,
  onClose,
  currentTemplateId,
  onSelect,
}: {
  open: boolean
  onClose: () => void
  currentTemplateId: string | null | undefined
  onSelect: (manifest: AdminTemplateManifest) => void
}) {
  const allManifests = listAdminTemplateManifests()
  const [query, setQuery] = useState('')
  const [previewId, setPreviewId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return allManifests
    return allManifests.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q),
    )
  }, [allManifests, query])

  const handleUse = (m: AdminTemplateManifest) => {
    if (m.id === currentTemplateId) {
      // Picking the current template is meaningless — just close.
      onClose()
      return
    }
    onSelect(m)
  }

  return (
    <Dialog open={open} onClose={onClose} className="max-w-5xl">
      <DialogHeader onClose={onClose}>
        <DialogTitle>Change template</DialogTitle>
      </DialogHeader>
      <DialogContent className="p-6 space-y-5">
        <p className="text-sm text-muted-foreground -mt-2">
          Pick a different visual + layout system. Step content and plans
          carry over — only the look changes. Live funnels reflect the
          switch within ~60 seconds.
        </p>

        {allManifests.length > 4 ? (
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search templates…"
              className="pl-9"
            />
          </div>
        ) : null}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-h-[60vh] overflow-y-auto pr-1">
          {filtered.map((m) => (
            <TemplateCard
              key={m.id}
              manifest={m}
              selected={m.id === currentTemplateId}
              onPreview={() => setPreviewId(m.id)}
              onSelect={() => handleUse(m)}
            />
          ))}
          {filtered.length === 0 ? (
            <div className="col-span-full rounded-xl border border-dashed border-border p-10 text-center text-sm text-tertiary">
              No templates match "{query}".
            </div>
          ) : null}
        </div>
      </DialogContent>

      <TemplatePreviewDialog
        open={!!previewId}
        onClose={() => setPreviewId(null)}
        templateId={previewId}
      />
    </Dialog>
  )
}
