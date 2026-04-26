import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Smartphone, Monitor } from 'lucide-react'
import { Dialog, DialogHeader, DialogTitle, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useAdminTemplate } from '@/templates/useAdminTemplate'
import type { PreviewFunnelDefaults, TemplateSample } from '@/templates/types'
import { cn } from '@/lib/utils'

const FALLBACK_SAMPLE: TemplateSample = {
  label: 'Welcome',
  stepType: 'welcome',
  stepKey: 'welcome',
  config: {
    title: 'Welcome',
    subtitle: '',
    cta_label: 'Continue',
    hero_emoji: '🎵',
  },
}

const EMPTY_DEFAULTS: PreviewFunnelDefaults = {
  planOptions: [],
  defaultPlanKey: null,
  defaultInterval: null,
}

// Carousel of representative step samples for a single template.
// Re-used by:
//  - the gallery card's "Preview" button (full-bleed walk-through)
//  - the FunnelDetailPage badge ("what does this funnel actually look like?")
// The dialog renders the same `Preview` component the live editor uses,
// so what marketers see here is exactly what end users see live.
export function TemplatePreviewDialog({
  open,
  onClose,
  templateId,
  funnelName,
}: {
  open: boolean
  onClose: () => void
  templateId: string | null | undefined
  // Optional — branding text some sample renderers (email-capture)
  // will surface so the preview feels less generic.
  funnelName?: string
}) {
  const template = useAdminTemplate(templateId)
  const samples = useMemo(
    () => (template?.samples?.length ? template.samples : [FALLBACK_SAMPLE]),
    [template],
  )

  const [index, setIndex] = useState(0)
  // Future-proof: viewport toggle so a desktop-first template can
  // demonstrate both states. lovify-music-v1 is mobile-first, so
  // the toggle is mostly cosmetic today; we still gate width by it.
  const [viewport, setViewport] = useState<'mobile' | 'desktop'>('mobile')

  // Reset to first sample whenever the dialog reopens or the template
  // changes — otherwise an out-of-range index leaks across opens.
  useEffect(() => {
    if (open) setIndex(0)
  }, [open, templateId])

  const supportsDesktop = template?.manifest.supportsViewports.includes('desktop')
  const supportsMobile = template?.manifest.supportsViewports.includes('mobile')

  // Auto-fall-back if a template lists only one viewport.
  useEffect(() => {
    if (!template) return
    if (viewport === 'desktop' && !supportsDesktop) setViewport('mobile')
    if (viewport === 'mobile' && !supportsMobile && supportsDesktop) setViewport('desktop')
  }, [template, viewport, supportsDesktop, supportsMobile])

  const sample = samples[Math.min(index, samples.length - 1)]
  const Preview = template?.Preview

  const goPrev = () => setIndex((i) => Math.max(0, i - 1))
  const goNext = () => setIndex((i) => Math.min(samples.length - 1, i + 1))

  return (
    <Dialog open={open} onClose={onClose} className="max-w-4xl">
      <DialogHeader onClose={onClose}>
        <div className="flex items-center justify-between gap-3 w-full">
          <div className="min-w-0">
            <DialogTitle>{template?.manifest.name ?? 'Template preview'}</DialogTitle>
            {template?.manifest.description ? (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                {template.manifest.description}
              </p>
            ) : null}
          </div>
          {supportsMobile && supportsDesktop ? (
            <div className="inline-flex items-center gap-1 rounded-full bg-foreground/5 p-1 mr-8">
              <button
                type="button"
                onClick={() => setViewport('mobile')}
                aria-pressed={viewport === 'mobile'}
                className={cn(
                  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition',
                  viewport === 'mobile'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Smartphone className="h-3.5 w-3.5" /> Mobile
              </button>
              <button
                type="button"
                onClick={() => setViewport('desktop')}
                aria-pressed={viewport === 'desktop'}
                className={cn(
                  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition',
                  viewport === 'desktop'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Monitor className="h-3.5 w-3.5" /> Desktop
              </button>
            </div>
          ) : null}
        </div>
      </DialogHeader>
      <DialogContent className="p-0 overflow-hidden">
        <div className="flex flex-col">
          {/* Preview area */}
          <div
            className="flex items-center justify-center px-8 py-8"
            style={{
              background: 'linear-gradient(160deg, hsl(38 60% 93%) 0%, hsl(24 18% 86%) 100%)',
              minHeight: 560,
            }}
          >
            {Preview ? (
              <div
                className={cn(
                  'w-full transition-[max-width] duration-300 ease-out flex flex-col',
                  viewport === 'mobile' ? 'max-w-[360px]' : 'max-w-2xl',
                )}
                style={{ height: 520, overflow: 'hidden' }}
              >
                <Preview
                  stepType={sample.stepType}
                  config={sample.config}
                  stepKey={sample.stepKey ?? sample.stepType}
                  funnelName={funnelName ?? 'Lovify'}
                  funnelDefaults={{ ...EMPTY_DEFAULTS, ...(sample.funnelDefaults ?? {}) }}
                  viewport={viewport}
                />
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">Loading template…</div>
            )}
          </div>

          {/* Nav bar */}
          <div className="border-t border-border px-6 py-3 flex items-center justify-between gap-3 bg-card">
            <Button
              variant="outline"
              size="sm"
              onClick={goPrev}
              disabled={index === 0 || !template}
              className="w-20"
            >
              <ChevronLeft className="h-4 w-4" /> Prev
            </Button>
            <div className="text-xs font-semibold text-foreground">
              {sample.label ?? sample.stepType}
              <span className="ml-2 font-normal text-muted-foreground">
                {Math.min(index + 1, samples.length)} / {samples.length}
              </span>
            </div>
            <Button
              size="sm"
              onClick={goNext}
              disabled={index >= samples.length - 1 || !template}
              className="w-20"
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
