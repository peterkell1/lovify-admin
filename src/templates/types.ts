import type { ComponentType } from 'react'
import type { PlanOption, StepType, Funnel } from '@/types/funnels'

// Admin-side mirror of lovify-funnel/src/templates/types.ts. Each
// template owns its own admin-side live preview — a faithful (read-only,
// no animations, no API calls) render of what end users see for that
// template. Same registry shape as the funnel app; same `Template.id`
// keys both sides so the funnel and the admin preview never disagree
// about which template a funnel uses.

export type PreviewFunnelDefaults = {
  planOptions: PlanOption[]
  defaultPlanKey: string | null
  // Drives the "MOST POPULAR" ribbon in templates that surface it.
  // Templates that don't render a ribbon ignore this. Falls back to
  // defaultPlanKey at render time when null.
  mostPopularPlanKey?: string | null
  defaultInterval: Funnel['default_interval']
}

export type PreviewProps = {
  stepType: StepType
  // Live config the marketer is editing in the side form. Shape per
  // step_type matches the funnel's StepConfigByType, but we accept
  // unknown here so editing partial configs doesn't blow up the preview.
  config: Record<string, unknown>
  stepKey: string
  funnelName: string
  funnelDefaults: PreviewFunnelDefaults
  // Optional: lets the parent (preview dialog) drive a desktop/mobile
  // simulation independent of the actual window width. Templates can
  // ignore this and rely on Tailwind's `md:` breakpoints, but that only
  // tracks real window size — it won't switch when the dialog's
  // viewport toggle flips. Default 'desktop' so the live editor (which
  // shows real desktop dimensions) reads correctly.
  viewport?: 'mobile' | 'desktop'
}

export type AdminTemplateManifest = {
  id: string
  name: string
  description: string
  thumbnailUrl?: string
  supportsViewports: ReadonlyArray<'mobile' | 'desktop'>
}

export type TemplateSample = {
  // Short label shown in the preview dialog's step counter (e.g.
  // "Welcome", "Quiz", "Paywall"). Optional — falls back to step type.
  label?: string
  stepType: StepType
  // Frozen example config the preview renderer will paint. Each
  // template ships hand-picked samples so the gallery is honest about
  // what the template actually looks like across step types.
  config: Record<string, unknown>
  stepKey?: string
  // Sample-level overrides for the funnel-level context the preview
  // renderer reads. The paywall preview, for instance, reads
  // planOptions / defaultPlanKey / defaultInterval to render the real
  // tiered UI — without these the paywall sample falls back to an
  // empty "no plans enabled" state. Templates that don't need this
  // (welcome, quiz, narrative) leave it undefined.
  funnelDefaults?: Partial<PreviewFunnelDefaults>
}

export type AdminTemplate = {
  manifest: AdminTemplateManifest
  // The single entry point for previewing any step type in this
  // template. Templates that want a per-step-type renderer map can
  // implement it internally — the admin only ever calls Preview.
  Preview: ComponentType<PreviewProps>
  // Hand-picked representative samples used by the gallery card and
  // the carousel preview dialog. Templates that ship without samples
  // fall back to a generic welcome stub at the registry layer.
  samples?: TemplateSample[]
}
