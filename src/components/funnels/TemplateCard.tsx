import { useEffect, useRef, useState } from 'react'
import { Eye, ArrowRight, Smartphone, Monitor } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAdminTemplate } from '@/templates/useAdminTemplate'
import type { AdminTemplateManifest, PreviewFunnelDefaults } from '@/templates/types'
import { cn } from '@/lib/utils'

const EMPTY_DEFAULTS: PreviewFunnelDefaults = {
  planOptions: [],
  defaultPlanKey: null,
  defaultInterval: null,
}

// Natural rendered size of the lovify-music-v1 PhoneFrame. We scale
// the live Preview down to fit the card thumbnail, computing the
// factor from the card's actual width. If a future template paints
// at a different intrinsic size, the scale calculation still works
// — only the divisor changes per template, and any reasonable
// natural width keeps the preview legible inside the card.
const PREVIEW_INTRINSIC_WIDTH = 360
const PREVIEW_INTRINSIC_HEIGHT = 560

// One template's gallery card. We render the actual `Preview` at small
// scale rather than embedding a screenshot — so the card is never out
// of date when the template's CSS changes. Render is gated on
// IntersectionObserver so a 20-template gallery doesn't churn React on
// first paint.
export function TemplateCard({
  manifest,
  onPreview,
  onSelect,
  selected,
  funnelName,
}: {
  manifest: AdminTemplateManifest
  onPreview: () => void
  onSelect: () => void
  selected?: boolean
  funnelName?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const thumbRef = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  const [scale, setScale] = useState<number>(0)

  useEffect(() => {
    if (!ref.current) return
    const el = ref.current
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          obs.disconnect()
        }
      },
      { rootMargin: '200px' },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  // Recompute scale whenever the thumbnail container resizes (responsive
  // grid columns at sm/md/lg). Ratio is min(width/360, height/560) so
  // the scaled preview fits both dimensions, with a small inset margin
  // so it doesn't hug the card's edges.
  useEffect(() => {
    const el = thumbRef.current
    if (!el) return
    const compute = () => {
      const inset = 16
      const usableW = el.clientWidth - inset * 2
      const usableH = el.clientHeight - inset * 2
      const next = Math.min(
        usableW / PREVIEW_INTRINSIC_WIDTH,
        usableH / PREVIEW_INTRINSIC_HEIGHT,
      )
      setScale(next > 0 && Number.isFinite(next) ? next : 0)
    }
    compute()
    const ro = new ResizeObserver(compute)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Only load the template once the card is near the viewport.
  const template = useAdminTemplate(inView ? manifest.id : null)
  const sample = template?.samples?.[0]
  const Preview = template?.Preview

  return (
    <div
      ref={ref}
      className={cn(
        'group flex flex-col rounded-2xl border bg-card overflow-hidden transition-all',
        selected
          ? 'border-orange-400 ring-2 ring-orange-400/40 shadow-lg'
          : 'border-border hover:border-foreground/20 hover:shadow-md',
      )}
    >
      {/* Mini-preview frame. The live Preview renders at its natural
          size in an absolutely-positioned wrapper; we measure the
          card's thumbnail box and apply a CSS transform scale so the
          scaled element fits without overflowing. The pointer-events
          block keeps inner buttons / inputs from stealing focus. */}
      <div
        ref={thumbRef}
        className="relative bg-background/60 border-b border-border h-[280px] overflow-hidden"
      >
        {Preview && sample && scale > 0 ? (
          <div
            className="absolute top-1/2 left-1/2 pointer-events-none"
            style={{
              width: `${PREVIEW_INTRINSIC_WIDTH}px`,
              height: `${PREVIEW_INTRINSIC_HEIGHT}px`,
              transform: `translate(-50%, -50%) scale(${scale})`,
              transformOrigin: 'center center',
            }}
          >
            <Preview
              stepType={sample.stepType}
              config={sample.config}
              stepKey={sample.stepKey ?? sample.stepType}
              funnelName={funnelName ?? manifest.name}
              funnelDefaults={{ ...EMPTY_DEFAULTS, ...(sample.funnelDefaults ?? {}) }}
            />
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
            {inView ? 'Loading preview…' : ''}
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col gap-3 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground truncate">{manifest.name}</h3>
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
              {manifest.description}
            </p>
          </div>
          <div className="flex flex-col gap-1 items-end shrink-0">
            {manifest.supportsViewports.includes('mobile') ? (
              <Badge variant="outline" className="gap-1">
                <Smartphone className="h-3 w-3" /> Mobile
              </Badge>
            ) : null}
            {manifest.supportsViewports.includes('desktop') ? (
              <Badge variant="outline" className="gap-1">
                <Monitor className="h-3 w-3" /> Desktop
              </Badge>
            ) : null}
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <Button variant="outline" size="sm" className="flex-1" onClick={onPreview}>
            <Eye className="h-4 w-4" /> Preview
          </Button>
          <Button size="sm" className="flex-1" onClick={onSelect}>
            Use this <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
