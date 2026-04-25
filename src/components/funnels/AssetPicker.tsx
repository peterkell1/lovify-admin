import { useEffect, useMemo, useState } from 'react'
import { ImageOff, Search, Trash2 } from 'lucide-react'
import { Dialog, DialogHeader, DialogTitle, DialogContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  fetchAssetManifest,
  resolveAdminAssetUrl,
  type AssetEntry,
  type AssetManifest,
} from '@/lib/asset-manifest'

// Inline field used inside step forms. Shows a thumbnail of the
// currently-picked asset (if any), a "Choose image" button that opens
// the picker dialog, and a clear button. Falls back to a blank slot
// when no asset is set.
export function AssetField({
  value,
  onChange,
  label = 'Image',
  hint,
  category,
}: {
  value: string | null | undefined
  onChange: (next: string | null) => void
  label?: string
  hint?: string
  // Optional: limit the picker to one category. Useful e.g. on the
  // Welcome step where a marketer should be picking from `wellness`
  // rather than `social-proof`.
  category?: string
}) {
  const [open, setOpen] = useState(false)
  const url = resolveAdminAssetUrl(value)

  return (
    <div className="space-y-1.5">
      <span className="text-xs font-semibold text-foreground">{label}</span>
      <div className="flex items-center gap-3 rounded-lg border border-border bg-secondary px-3 py-2">
        <div className="h-12 w-12 flex-shrink-0 rounded-md border border-border bg-background overflow-hidden flex items-center justify-center">
          {url ? (
            <img src={url} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImageOff className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          {value ? (
            <p className="font-mono text-[11px] text-muted-foreground truncate">{value}</p>
          ) : (
            <p className="text-xs text-muted-foreground">No image picked</p>
          )}
          {hint ? <p className="text-[11px] text-muted-foreground mt-0.5">{hint}</p> : null}
        </div>
        <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}>
          {value ? 'Change' : 'Choose'}
        </Button>
        {value ? (
          <button
            type="button"
            aria-label="Remove image"
            onClick={() => onChange(null)}
            className="rounded-md p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        ) : null}
      </div>
      <AssetPicker
        open={open}
        onClose={() => setOpen(false)}
        onPick={(key) => {
          onChange(key)
          setOpen(false)
        }}
        category={category}
      />
    </div>
  )
}

export function AssetPicker({
  open,
  onClose,
  onPick,
  category,
}: {
  open: boolean
  onClose: () => void
  onPick: (key: string) => void
  category?: string
}) {
  const [manifest, setManifest] = useState<AssetManifest | null>(null)
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | 'all'>(category ?? 'all')

  useEffect(() => {
    if (!open) return
    let alive = true
    setManifest(null)
    fetchAssetManifest().then((m) => {
      if (alive) setManifest(m)
    })
    return () => {
      alive = false
    }
  }, [open])

  // Reset filter when scope changes (e.g. parent passes a different
  // `category` prop on a different step's open).
  useEffect(() => {
    if (open) setActiveCategory(category ?? 'all')
  }, [open, category])

  const visibleAssets: AssetEntry[] = useMemo(() => {
    if (!manifest) return []
    const q = query.trim().toLowerCase()
    return manifest.assets.filter((a) => {
      if (category && a.category !== category) return false
      if (activeCategory !== 'all' && a.category !== activeCategory) return false
      if (!q) return true
      return (
        a.label.toLowerCase().includes(q) ||
        a.key.toLowerCase().includes(q) ||
        (a.alt ?? '').toLowerCase().includes(q)
      )
    })
  }, [manifest, query, activeCategory, category])

  const visibleCategories = useMemo(() => {
    if (!manifest) return []
    if (category) return manifest.categories.filter((c) => c.id === category)
    return manifest.categories
  }, [manifest, category])

  return (
    <Dialog open={open} onClose={onClose} className="max-w-4xl">
      <DialogHeader onClose={onClose}>
        <DialogTitle>Pick an image</DialogTitle>
      </DialogHeader>
      <DialogContent className="p-6 space-y-4">
        <div className="flex gap-3 flex-wrap items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by label or filename…"
              className="pl-9"
            />
          </div>
          {!category && visibleCategories.length > 0 ? (
            <div className="inline-flex items-center gap-1 rounded-full bg-foreground/5 p-1">
              <button
                type="button"
                onClick={() => setActiveCategory('all')}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-semibold transition',
                  activeCategory === 'all'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                All
              </button>
              {visibleCategories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setActiveCategory(c.id)}
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-semibold transition',
                    activeCategory === c.id
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {!manifest ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Loading assets…
          </div>
        ) : visibleAssets.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            {manifest.assets.length === 0
              ? 'No assets in the library yet. Drop image files in lovify-funnel/public/funnel-assets/<category>/ and add them to manifest.json.'
              : `No assets match "${query}".`}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[60vh] overflow-y-auto pr-1">
            {visibleAssets.map((a) => (
              <button
                key={a.key}
                type="button"
                onClick={() => onPick(a.key)}
                className="group flex flex-col rounded-lg border border-border bg-card overflow-hidden text-left hover:border-foreground/30 hover:shadow-md transition"
              >
                <div className="aspect-[3/4] bg-background/60 overflow-hidden">
                  <img
                    src={resolveAdminAssetUrl(a.key) ?? ''}
                    alt={a.alt ?? a.label}
                    className="h-full w-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
                    loading="lazy"
                  />
                </div>
                <div className="p-2.5">
                  <p className="text-xs font-semibold text-foreground truncate">{a.label}</p>
                  <p className="font-mono text-[10px] text-muted-foreground truncate">{a.key}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
