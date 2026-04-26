import useEmblaCarousel from 'embla-carousel-react'
import { ArrowLeft, Check, ChevronRight, ImageOff, Lock, X } from 'lucide-react'
import type { PlanOption } from '@/types/funnels'
import type { PreviewProps } from '@/templates/types'
import { resolveAdminImageUrl } from '@/lib/asset-manifest'
import './theme.css'

// Read-only mirror of lovify-funnel/src/templates/lovify-template-2.
// Same visual contract, no animations, no API calls.

type Cfg = Record<string, unknown>

type ImgOption = {
  value: string
  label: string
  emoji?: string
  image_asset_key?: string
  character_image_url?: string
}

export function Preview({
  stepType,
  config,
  funnelName,
  funnelDefaults,
  viewport = 'desktop',
}: PreviewProps) {
  return (
    <div className="lt2-root w-full min-h-full rounded-2xl overflow-hidden border border-[var(--lt2-border)] shadow-sm flex flex-col">
      {/* Header — matches Layout.tsx exactly: back arrow | brand | spacer, no hamburger */}
      <header className="border-b border-[var(--lt2-border)]">
        <div className="w-full px-5 md:px-10 h-14 flex items-center gap-3">
          <span className="h-9 w-9 inline-flex items-center justify-center rounded-full border border-[var(--lt2-border)] flex-shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </span>
          <div className="flex-1 flex items-center justify-center gap-2 min-w-0">
            <img
              src="/lovify-logo.png"
              alt=""
              className="h-6 w-6 object-contain select-none shrink-0"
              draggable={false}
            />
            <span
              className="lt2-headline select-none truncate"
              style={{ fontSize: 16, letterSpacing: '-0.03em', lineHeight: 1 }}
            >
              {funnelName || 'Lovify'}
            </span>
          </div>
          {/* Mirror-width spacer keeps wordmark centered — no hamburger */}
          <span className="h-9 w-9 flex-shrink-0" aria-hidden="true" />
        </div>
        {/* Progress bar: flush full-width, no rounding */}
        <div className="lt2-progress-track">
          <div className="lt2-progress-fill" style={{ width: '40%' }} />
        </div>
      </header>

      {/* Main content — flex-1 so card fills remaining height */}
      <div className="w-full flex-1 max-w-3xl mx-auto px-5 py-6 flex flex-col">
        {renderBody(stepType, config, funnelDefaults, viewport)}
      </div>
    </div>
  )
}

function renderBody(
  stepType: PreviewProps['stepType'],
  config: Cfg,
  funnelDefaults: PreviewProps['funnelDefaults'],
  viewport: 'mobile' | 'desktop',
) {
  switch (stepType) {
    case 'welcome':       return <WelcomePreview config={config} />
    case 'email-capture': return <EmailPreview config={config} />
    case 'quiz-single':   return <QuizSinglePreview config={config} />
    case 'quiz-multi':    return <QuizMultiPreview config={config} />
    case 'narrative':     return <NarrativePreview config={config} />
    case 'statement':     return <StatementPreview config={config} />
    case 'crafting':      return <CraftingPreview config={config} />
    case 'time-picker':   return <TimePickerPreview config={config} />
    case 'number-picker': return <NumberPickerPreview config={config} />
    case 'genre-picker':  return <GenrePickerPreview config={config} />
    case 'paywall':       return <PaywallPreview config={config} funnelDefaults={funnelDefaults} viewport={viewport} />
    case 'success':       return <SuccessPreview config={config} />
    default:
      return (
        <div className="py-12 text-center text-[var(--lt2-muted)] text-sm">
          This step type isn&apos;t supported on lovify-template-2 yet.
        </div>
      )
  }
}

function pickAssetUrl(config: Cfg): string | null {
  return resolveAdminImageUrl(
    config.image_asset_key as string | undefined,
    config.character_image_url as string | undefined,
  )
}

// Shared sticky CTA — matches Cta.tsx (full width, pill, dark)
function CtaBlock({ children, disabled }: { children: React.ReactNode; disabled?: boolean }) {
  return (
    <div className="pt-6 pb-2">
      <button
        disabled={disabled}
        className={'lt2-cta w-full h-14 px-8 flex items-center justify-center gap-2 text-base ' + (disabled ? 'opacity-40' : '')}
      >
        {children}
      </button>
    </div>
  )
}

// Embla-powered image card carousel — same feel as the real funnel
function ImageCardCarousel({ options }: { options: ImgOption[] }) {
  const [emblaRef] = useEmblaCarousel({
    align: 'center',
    containScroll: 'trimSnaps',
    dragFree: false,
    loop: false,
  })

  const cards = options.map((opt) => {
    const url = resolveAdminImageUrl(opt.image_asset_key, opt.character_image_url)
    return (
      <div
        key={opt.value}
        className="relative overflow-hidden bg-[var(--lt2-card)] flex-shrink-0"
        style={{ width: 140, height: 240, borderRadius: 18, minWidth: 140 }}
      >
        {url ? (
          <img src={url} alt={opt.label} className="absolute inset-0 h-full w-full object-cover object-top" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-[var(--lt2-muted)]">
            <ImageOff className="h-6 w-6" />
          </div>
        )}
        <div
          className="absolute inset-x-0 bottom-0 flex items-center justify-between"
          style={{ background: '#311E17', padding: '12px 10px' }}
        >
          <span className="lt2-headline text-[#FFFEFA]" style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.2 }}>
            {opt.label}
          </span>
          <span className="inline-flex items-center justify-center rounded-full border-2 border-[#FFFEFA] w-7 h-7 flex-shrink-0">
            <ChevronRight className="h-3.5 w-3.5 text-[#FFFEFA]" />
          </span>
        </div>
      </div>
    )
  })

  // In the narrow preview panel always use the carousel
  return (
    <div className="w-full overflow-hidden" ref={emblaRef}>
      <div className="flex gap-3 px-4">
        {cards}
      </div>
    </div>
  )
}

function WelcomePreview({ config }: { config: Cfg }) {
  const options = (config.options as ImgOption[] | undefined) ?? []
  // Image-card picker for horizontal 2-3 option steps. Vertical layout uses hero/plain welcome.
  const isPicker =
    config.layout !== 'vertical' &&
    options.length >= 2 &&
    options.length <= 3
  const heroImage = pickAssetUrl(config)

  if (isPicker) {
    return (
      <div className="flex flex-col items-center justify-center py-4 gap-6">
        <div className="text-center px-2">
          <h1 className="lt2-headline text-3xl leading-[1.08]">{(config.title as string) || 'Welcome'}</h1>
          {config.subtitle ? (
            <p className="mt-2 text-sm text-[var(--lt2-muted)]">{config.subtitle as string}</p>
          ) : null}
        </div>
        <ImageCardCarousel options={options} />
        {config.legal_note ? (
          <p className="text-center text-xs text-[var(--lt2-muted)] px-4">{config.legal_note as string}</p>
        ) : null}
      </div>
    )
  }

  // Hero / plain welcome
  return (
    <>
      <div className="flex flex-col items-center text-center gap-6 py-4">
        {config.hero_emoji && !heroImage ? (
          <div className="text-6xl">{config.hero_emoji as string}</div>
        ) : null}
        <h1 className="lt2-headline text-3xl max-w-xl">{(config.title as string) || 'Welcome'}</h1>
        {config.subtitle ? (
          <p className="text-[var(--lt2-muted)] text-sm max-w-md">{config.subtitle as string}</p>
        ) : null}
        {heroImage ? (
          <img src={heroImage} alt="" className="rounded-2xl w-full max-w-md max-h-[320px] object-cover" />
        ) : null}
      </div>
      <CtaBlock>{(config.cta_label as string) || 'Continue'}</CtaBlock>
    </>
  )
}

function EmailPreview({ config }: { config: Cfg }) {
  return (
    <>
      <div className="flex-1 flex flex-col justify-center max-w-lg mx-auto w-full pt-6 md:pt-12">
        <h1 className="lt2-headline text-2xl md:text-4xl text-center">{(config.title as string) || 'Enter your email'}</h1>
        {config.subtitle ? (
          <p className="mt-3 text-center text-[var(--lt2-muted)] text-sm md:text-base leading-relaxed">{config.subtitle as string}</p>
        ) : null}
        <div className="mt-8">
          <div className="w-full h-14 rounded-xl border border-[var(--lt2-border)] bg-white px-5 flex items-center text-base text-[var(--lt2-muted)]">
            you@example.com
          </div>
          {(config.terms_url as string) || (config.privacy_url as string) ? (
            <p className="mt-3 flex items-start gap-2 text-xs text-(--lt2-muted) leading-relaxed">
              <Lock className="h-3.5 w-3.5 shrink-0 mt-px" />
              {(config.terms_url as string) && (config.privacy_url as string)
                ? <span>By continuing you agree to our <span className="underline">Terms</span> and <span className="underline">Privacy Policy</span>.</span>
                : (config.terms_url as string)
                ? <span>By continuing you agree to our <span className="underline">Terms of Service</span>.</span>
                : <span>We respect your privacy and process your data per our <span className="underline">Privacy Policy</span>.</span>}
            </p>
          ) : null}
        </div>
      </div>
      <CtaBlock>{(config.cta_label as string) || 'Continue'}</CtaBlock>
    </>
  )
}

function QuizSinglePreview({ config }: { config: Cfg }) {
  const options = (config.options as ImgOption[] | undefined) ?? []
  const isImagePicker =
    config.layout !== 'vertical' &&
    options.length >= 2 &&
    options.length <= 3

  if (isImagePicker) {
    return (
      <div className="flex flex-col items-center justify-center py-4 gap-6">
        <div className="text-center px-2">
          <h1 className="lt2-headline text-3xl leading-[1.08]">{(config.title as string) || 'Question'}</h1>
          {config.subtitle ? (
            <p className="mt-2 text-sm text-[var(--lt2-muted)]">{config.subtitle as string}</p>
          ) : null}
        </div>
        <ImageCardCarousel options={options} />
      </div>
    )
  }

  return (
    <>
      <div className="text-center pt-4 md:pt-8">
        <h1 className="lt2-headline text-2xl md:text-[2rem] max-w-2xl mx-auto leading-tight">
          {(config.title as string) || 'Question'}
        </h1>
        {config.subtitle ? (
          <p className="mt-3 text-[var(--lt2-muted)] text-sm md:text-base">{config.subtitle as string}</p>
        ) : null}
      </div>
      <div className="pt-6 md:pt-8 w-full flex flex-col gap-2.5">
        {options.map((opt) => (
          <div
            key={opt.value}
            className="lt2-row w-full px-4 py-[14px] flex items-center justify-between gap-3"
          >
            <span className="flex items-center gap-3 min-w-0">
              {opt.emoji ? <span className="text-xl flex-shrink-0 w-7 inline-flex items-center justify-center">{opt.emoji}</span> : null}
              <span className="font-medium text-base text-[var(--lt2-fg)] truncate">{opt.label}</span>
            </span>
            <span className="lt2-radio" />
          </div>
        ))}
      </div>
    </>
  )
}

function QuizMultiPreview({ config }: { config: Cfg }) {
  const options = (config.options as ImgOption[] | undefined) ?? []
  return (
    <>
      <div className="text-center pt-4 md:pt-8">
        <h1 className="lt2-headline text-2xl md:text-[2rem] max-w-2xl mx-auto leading-tight">
          {(config.title as string) || 'Pick all that apply'}
        </h1>
        {config.subtitle ? (
          <p className="mt-3 text-[var(--lt2-muted)] text-sm md:text-base">{config.subtitle as string}</p>
        ) : null}
      </div>
      {/* Single column — matches funnel QuizMultiStep (no md:grid-cols-2) */}
      <div className="pt-6 md:pt-8 grid grid-cols-1 gap-2.5 w-full">
        {options.map((opt) => (
          <div key={opt.value} className="lt2-row w-full px-4 py-[14px] flex items-center justify-between gap-3">
            <span className="flex items-center gap-3 min-w-0">
              {opt.emoji ? <span className="text-xl flex-shrink-0 w-7 inline-flex items-center justify-center">{opt.emoji}</span> : null}
              <span className="font-medium text-base text-[var(--lt2-fg)] truncate">{opt.label}</span>
            </span>
            <span className="lt2-check" />
          </div>
        ))}
      </div>
      <CtaBlock disabled>{(config.cta_label as string) || 'Next step'}</CtaBlock>
    </>
  )
}

function NarrativePreview({ config }: { config: Cfg }) {
  const imageUrl = pickAssetUrl(config)
  const bullets = (config.bullets as Array<{ emoji?: string; text: string }> | undefined) ?? []
  return (
    <>
      <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full pt-2 md:pt-8">
        {config.hero_emoji ? <div className="text-3xl">{config.hero_emoji as string}</div> : null}
        <h1 className="lt2-headline text-2xl md:text-4xl">{(config.title as string) || 'Title'}</h1>
        {config.subtitle ? (
          <p className="mt-3 text-[var(--lt2-muted)] text-base md:text-lg leading-relaxed">{config.subtitle as string}</p>
        ) : null}
        {imageUrl ? (
          <img src={imageUrl} alt="" className="w-full object-cover rounded-2xl" style={{ maxHeight: 280 }} />
        ) : null}
        {bullets.length > 0 ? (
          <div className="lt2-card p-5 md:p-6">
            <ul className="flex flex-col gap-3">
              {bullets.map((b, i) => (
                <li key={i} className="flex items-start gap-3 pb-3 border-b border-[var(--lt2-border)] last:border-0 last:pb-0">
                  {b.emoji ? (
                    <span className="text-base mt-0.5">{b.emoji}</span>
                  ) : (
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--lt2-fg)] flex-shrink-0" />
                  )}
                  <span className="text-sm md:text-base leading-snug">{b.text}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
      <CtaBlock>{(config.cta_label as string) || 'Continue'}</CtaBlock>
    </>
  )
}

function StatementPreview({ config }: { config: Cfg }) {
  const scale = config.scale as { max: number; min_label?: string; max_label?: string } | undefined
  return (
    <>
      <div className="text-center pt-4 md:pt-8">
        <h1 className="lt2-headline text-2xl md:text-4xl max-w-2xl mx-auto">{(config.title as string) || 'Do you agree?'}</h1>
        {config.statement ? (
          <p className="mt-4 text-[var(--lt2-muted)] text-base md:text-lg max-w-xl mx-auto">{config.statement as string}</p>
        ) : null}
      </div>
      <div className="flex items-center justify-center py-10">
        {scale && scale.max >= 2 ? (
          <div className="w-full max-w-lg">
            <div className="flex items-center justify-center gap-2 md:gap-3">
              {Array.from({ length: scale.max }, (_, i) => i + 1).map((v) => (
                <div key={v} className="h-14 w-14 md:h-16 md:w-16 rounded-2xl border lt2-headline text-xl md:text-2xl flex items-center justify-center bg-[var(--lt2-bg)] border-[var(--lt2-border)]">
                  {v}
                </div>
              ))}
            </div>
            <div className="mt-3 flex justify-between text-xs md:text-sm text-[var(--lt2-muted)] px-1">
              <span>{scale.min_label ?? ''}</span>
              <span>{scale.max_label ?? ''}</span>
            </div>
          </div>
        ) : (
          <div className="flex gap-3 w-full max-w-md">
            {(['no', 'yes'] as const).map((v) => {
              const Icon = v === 'yes' ? Check : X
              return (
                <div key={v} className="flex-1 py-5 rounded-2xl border lt2-headline text-base capitalize flex items-center justify-center gap-2 bg-[var(--lt2-bg)] border-[var(--lt2-border)]">
                  <Icon className="h-4 w-4" />
                  {v}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}

function CraftingPreview({ config }: { config: Cfg }) {
  const messages = (config.messages as string[] | undefined) ?? ['Analyzing your answers…']
  // Ring metrics match funnel CraftingStep exactly: r=88, viewBox=200x200, stroke=8
  const r = 88
  const c = 2 * Math.PI * r
  const offset = c - 0.42 * c // frozen at 42% for preview

  return (
    <div className="flex flex-col items-center py-8 md:py-12 max-w-md mx-auto w-full">
      <div className="relative h-52 w-52 md:h-60 md:w-60 flex items-center justify-center">
        <svg viewBox="0 0 200 200" className="absolute inset-0 -rotate-90">
          <circle cx="100" cy="100" r={r} stroke="var(--lt2-border)" strokeWidth="8" fill="none" />
          <circle cx="100" cy="100" r={r} stroke="var(--lt2-fg)" strokeWidth="8" strokeLinecap="round"
            strokeDasharray={c} strokeDashoffset={offset} fill="none" />
        </svg>
        <div className="lt2-headline text-4xl md:text-5xl tabular-nums">
          42<span className="text-lg md:text-xl align-top ml-1 font-semibold">%</span>
        </div>
      </div>

      <h2 className="mt-8 lt2-headline text-2xl md:text-3xl text-center">
        {(config.title as string) || 'Crafting your experience…'}
      </h2>

      <ul className="mt-7 w-full flex flex-col gap-3 border-t border-[var(--lt2-border)] pt-6">
        {messages.map((m, i) => {
          const done = i === 0
          const active = i === 1
          return (
            <li key={i} className={'flex items-center gap-3 text-sm md:text-base ' + (done ? 'text-[var(--lt2-fg)] font-semibold' : 'text-[var(--lt2-muted)]')}>
              <span className={'h-6 w-6 inline-flex items-center justify-center flex-shrink-0 rounded-full ' + (done ? 'bg-[var(--lt2-fg)] text-white' : active ? 'border border-[var(--lt2-fg)]' : 'border border-[var(--lt2-border)]')}>
                {done ? <Check className="h-3.5 w-3.5" /> : active ? <span className="h-2 w-2 rounded-full bg-[var(--lt2-fg)]" /> : <span className="h-1.5 w-1.5 rounded-full bg-[var(--lt2-border)]" />}
              </span>
              <span>{m}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

const ITEM_H = 56
const VISIBLE = 5

function WheelPreview({ values, selectedIndex, renderItem, width = 80 }: {
  values: (string | number)[]
  selectedIndex: number
  renderItem: (v: string | number) => string
  width?: number
}) {
  return (
    <div className="relative flex flex-col items-center" style={{ width }}>
      <div
        className="absolute left-0 right-0 pointer-events-none rounded-xl border border-(--lt2-fg) bg-(--lt2-card)"
        style={{ top: `${((VISIBLE - 1) / 2) * ITEM_H}px`, height: `${ITEM_H}px` }}
      />
      <div style={{ height: `${VISIBLE * ITEM_H}px`, overflow: 'hidden', position: 'relative' }}>
        <div style={{ height: `${((VISIBLE - 1) / 2) * ITEM_H}px` }} />
        {values.map((v, i) => {
          const dist = Math.abs(i - selectedIndex)
          const isSelected = dist === 0
          return (
            <div key={i} className="flex items-center justify-center relative z-10" style={{ height: `${ITEM_H}px` }}>
              <span
                className={'lt2-headline tabular-nums select-none ' + (
                  isSelected ? 'text-2xl text-(--lt2-fg)'
                    : dist === 1 ? 'text-xl text-(--lt2-muted) opacity-70'
                    : 'text-lg text-(--lt2-muted) opacity-30'
                )}
              >
                {renderItem(v)}
              </span>
            </div>
          )
        })}
        <div style={{ height: `${((VISIBLE - 1) / 2) * ITEM_H}px` }} />
      </div>
    </div>
  )
}

function TimePickerPreview({ config }: { config: Cfg }) {
  const minuteStep = (config.minute_step as number) || 5
  const hours = Array.from({ length: 12 }, (_, i) => i + 1)
  const minutes: number[] = []
  for (let m = 0; m < 60; m += minuteStep) minutes.push(m)
  const periods = ['AM', 'PM']

  const defaultHourIdx = Math.max(0, hours.indexOf((config.default_hour as number) || 9))
  const defaultMinIdx = Math.max(0, minutes.indexOf((config.default_minute as number) || 0))
  const defaultPeriodIdx = config.default_period === 'PM' ? 1 : 0

  const pad2 = (n: number) => n < 10 ? `0${n}` : String(n)

  return (
    <>
      <div className="text-center pt-2 md:pt-6">
        <h1 className="lt2-headline text-2xl md:text-4xl max-w-2xl mx-auto">
          {(config.title as string) || '21 days is a great start to building healthy habits'}
        </h1>
        {config.subtitle ? (
          <p className="mt-2 text-(--lt2-muted) text-sm md:text-base max-w-xl mx-auto">
            {config.subtitle as string}
          </p>
        ) : null}
      </div>
      <div className="flex-1 flex items-center justify-center py-8">
        <div className="relative flex items-center gap-1">
          <WheelPreview values={hours} selectedIndex={defaultHourIdx} renderItem={(v) => String(v)} width={70} />
          <span className="lt2-headline text-2xl text-(--lt2-fg) px-1 z-10 relative">:</span>
          <WheelPreview values={minutes} selectedIndex={defaultMinIdx} renderItem={(v) => pad2(v as number)} width={70} />
          <WheelPreview values={periods} selectedIndex={defaultPeriodIdx} renderItem={(v) => String(v)} width={70} />
        </div>
      </div>
      <CtaBlock>{(config.cta_label as string) || 'Continue'}</CtaBlock>
    </>
  )
}

function NumberPickerPreview({ config }: { config: Cfg }) {
  const min = (config.min as number) ?? 0
  const max = (config.max as number) ?? 100
  const step = (config.step as number) || 1
  const defaultVal = (config.default as number) ?? Math.floor((min + max) / 2)
  const values: number[] = []
  for (let v = min; v <= max; v += step) values.push(v)
  const selectedIndex = Math.max(0, values.indexOf(defaultVal))

  return (
    <>
      <div className="text-center pt-2 md:pt-6">
        <h1 className="lt2-headline text-2xl md:text-4xl max-w-2xl mx-auto">
          {(config.title as string) || 'Pick a number'}
        </h1>
        {config.subtitle ? (
          <p className="mt-2 text-(--lt2-muted) text-sm md:text-base">{config.subtitle as string}</p>
        ) : null}
      </div>
      <div className="flex-1 flex items-center justify-center py-8">
        <div className="relative flex items-center gap-6">
          <WheelPreview values={values} selectedIndex={selectedIndex} renderItem={(v) => String(v)} width={140} />
          {config.unit_label ? (
            <span className="lt2-headline text-xl text-(--lt2-accent)">{config.unit_label as string}</span>
          ) : null}
        </div>
      </div>
      <CtaBlock>{(config.cta_label as string) || 'Continue'}</CtaBlock>
    </>
  )
}

function GenrePickerPreview({ config }: { config: Cfg }) {
  type Genre = { value: string; label: string; emoji?: string }
  const genres = (config.genres as Genre[] | undefined) ?? []
  const min = (config.min as number) ?? 1
  return (
    <>
      <div className="text-center pt-4 md:pt-8">
        <h1 className="lt2-headline text-2xl md:text-[2rem] max-w-2xl mx-auto leading-tight">
          {(config.title as string) || 'Pick genres'}
        </h1>
        {config.subtitle ? (
          <p className="mt-3 text-(--lt2-muted) text-sm md:text-base">{config.subtitle as string}</p>
        ) : null}
      </div>
      <div className="pt-6 flex flex-wrap gap-2.5 justify-center">
        {genres.map((g, i) => (
          <div key={i} className="px-4 py-2 rounded-full border border-(--lt2-border) bg-(--lt2-card) flex items-center gap-2 text-sm font-semibold text-(--lt2-fg)">
            {g.emoji ? <span className="text-base">{g.emoji}</span> : null}
            <span>{g.label || g.value}</span>
          </div>
        ))}
      </div>
      <p className="mt-4 text-sm text-(--lt2-muted) text-center">Select at least {min} to continue</p>
      <CtaBlock disabled>{(config.cta_label as string) || 'Continue'}</CtaBlock>
    </>
  )
}

function PaywallPreview({
  config,
  funnelDefaults,
}: {
  config: Cfg
  funnelDefaults: PreviewProps['funnelDefaults']
  viewport: 'mobile' | 'desktop'
}) {
  const enabledPlans: PlanOption[] = funnelDefaults.planOptions ?? []
  const popularKey = funnelDefaults.mostPopularPlanKey ?? funnelDefaults.defaultPlanKey ?? null
  const selectedKey = funnelDefaults.defaultPlanKey ?? enabledPlans[0]?.planKey ?? null
  const hasTrial = enabledPlans.some((p) => p.trialDays && p.trialDays > 0)

  return (
    <>
      <div className="text-center pt-2">
        <h1 className="lt2-headline text-3xl max-w-2xl mx-auto leading-tight">
          {(config.title as string) || 'Pick a plan'}
        </h1>
        {config.subtitle ? (
          <p className="mt-2 text-[var(--lt2-muted)] text-sm max-w-xl mx-auto">{config.subtitle as string}</p>
        ) : null}
      </div>

      {enabledPlans.length === 0 ? (
        <div className="mt-6 lt2-card p-6 text-center text-sm text-[var(--lt2-muted)]">
          No plans enabled yet — toggle some on the Plans tab.
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-3 w-full">
          {enabledPlans.map((p) => {
            const isSelected = p.planKey === selectedKey
            const isPopular = p.planKey === popularKey
            const priceStr = `$${(p.amountCents / 100).toFixed(2)}`
            const periodStr = p.trialDays && p.trialDays > 0
              ? `then /${p.interval ?? 'year'}`
              : `per ${p.interval ?? 'year'}`
            return (
              <div
                key={p.planKey}
                className={
                  'relative text-left rounded-2xl border bg-[var(--lt2-card)] px-4 py-4 flex items-center justify-between gap-4 ' +
                  (isSelected
                    ? 'border-[var(--lt2-fg)] shadow-[0_0_0_1px_var(--lt2-fg)]'
                    : 'border-[var(--lt2-border)]')
                }
              >
                {isPopular ? (
                  <span className="absolute -top-3 left-4 bg-[var(--lt2-cta-bg)] text-[var(--lt2-cta-fg)] text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full whitespace-nowrap">
                    Most popular
                  </span>
                ) : null}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="lt2-radio shrink-0" data-checked={isSelected}>
                    {isSelected ? <span className="block h-2.5 w-2.5 rounded-full bg-[var(--lt2-bg)]" /> : null}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="lt2-headline text-sm leading-tight">{p.label}</div>
                    {p.credits ? (
                      <div className="text-xs text-[var(--lt2-muted)] mt-0.5">{p.credits.toLocaleString()} credits</div>
                    ) : null}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="lt2-headline text-lg">{priceStr}</div>
                  <div className="text-[10px] text-[var(--lt2-muted)]">{periodStr}</div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {(config.features as string[] | undefined)?.length ? (
        <ul className="mt-5 flex flex-col gap-2 text-sm w-full">
          {(config.features as string[]).map((f, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <Check className="h-4 w-4 mt-0.5 text-[var(--lt2-accent)] flex-shrink-0" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      ) : null}

      <CtaBlock>{hasTrial ? 'Start my free trial' : 'Continue to payment'}</CtaBlock>
      {config.guarantee_copy ? (
        <p className="-mt-2 text-center text-xs text-[var(--lt2-muted)]">{config.guarantee_copy as string}</p>
      ) : null}
    </>
  )
}

function SuccessPreview({ config }: { config: Cfg }) {
  const hasUrls = !!(config.app_store_url as string) || !!(config.play_store_url as string)
  return (
    <div className="flex flex-col items-center text-center gap-4 py-6 max-w-lg mx-auto w-full">
      <div className="h-16 w-16 rounded-full bg-[var(--lt2-cta-bg)] text-[var(--lt2-cta-fg)] flex items-center justify-center">
        <Check className="h-7 w-7" />
      </div>
      <h1 className="lt2-headline text-2xl md:text-4xl">{(config.headline as string) || "You're in."}</h1>
      <p className="text-(--lt2-muted) text-sm">
        {(config.body_md as string) || 'Check your email to set your password, then download the app.'}
      </p>
      {config.show_set_password_cta !== false ? (
        <div className="lt2-card p-4 flex items-start gap-3 text-left w-full max-w-sm">
          <div className="h-4 w-4 mt-0.5 shrink-0 text-(--lt2-accent)">✉</div>
          <div>
            <p className="text-xs font-semibold">Check your email</p>
            <p className="mt-0.5 text-[11px] text-(--lt2-muted) leading-relaxed">We've sent you a link to set your password and log into the app.</p>
          </div>
        </div>
      ) : null}
      <div className={`flex flex-col gap-2 w-full max-w-sm mt-2 ${!hasUrls ? 'opacity-30' : ''}`}>
        <div className="lt2-cta h-14 px-6 flex flex-col items-center justify-center">
          <span className="text-[9px] font-medium opacity-70 uppercase tracking-widest">Download on the</span>
          <span className="text-sm font-bold">App Store</span>
        </div>
        <div className="h-14 px-6 flex flex-col items-center justify-center rounded-full border-2 border-(--lt2-fg) text-(--lt2-fg)">
          <span className="text-[9px] font-medium opacity-60 uppercase tracking-widest">Get it on</span>
          <span className="text-sm font-bold">Google Play</span>
        </div>
      </div>
    </div>
  )
}
