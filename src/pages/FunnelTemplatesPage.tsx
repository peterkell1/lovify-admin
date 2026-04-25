import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { TemplateCard } from '@/components/funnels/TemplateCard'
import { TemplatePreviewDialog } from '@/components/funnels/TemplatePreviewDialog'
import { listAdminTemplateManifests } from '@/templates/registry'

// Step 1 of the create-funnel flow. Marketers pick a template here;
// step 2 (slug + name + plans) lives at /funnels/new?template=<id>.
//
// Search field is in place from day one so adding it later doesn't
// reflow the page when the catalogue grows past ~6 templates. With
// one template it's hidden until needed.
export default function FunnelTemplatesPage() {
  const navigate = useNavigate()
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

  const handleSelect = (id: string) => {
    navigate(`/funnels/new?template=${encodeURIComponent(id)}`)
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Link
        to="/funnels"
        className="inline-flex items-center gap-2 text-sm text-tertiary hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Cancel
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-foreground">Pick a template</h1>
        <p className="mt-1 text-sm text-tertiary">
          Each template is a complete visual + layout system end users see. Preview to see the look across step types,
          then "Use this" to fill in the funnel details.
        </p>
      </div>

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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((m) => (
          <TemplateCard
            key={m.id}
            manifest={m}
            onPreview={() => setPreviewId(m.id)}
            onSelect={() => handleSelect(m.id)}
          />
        ))}
        {filtered.length === 0 ? (
          <div className="col-span-full rounded-xl border border-dashed border-border p-10 text-center text-sm text-tertiary">
            No templates match "{query}".
          </div>
        ) : null}
      </div>

      <TemplatePreviewDialog
        open={!!previewId}
        onClose={() => setPreviewId(null)}
        templateId={previewId}
      />
    </div>
  )
}
