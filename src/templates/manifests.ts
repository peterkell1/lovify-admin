import type { AdminTemplateManifest } from './types'

// Eager list of every template's metadata. Components (Preview, samples)
// are loaded lazily via registry.ts so the admin's first paint stays
// fast as the catalogue grows. The id here is the contract — it must
// match `lovify-funnel/src/templates/<id>/index.ts` so the funnel
// renderer and admin preview never disagree about the active template.
export const TEMPLATE_MANIFESTS: AdminTemplateManifest[] = [
  {
    id: 'lovify-music-v1',
    name: 'Lovify Music — v1',
    description:
      'Mobile-first phone frame, peach gradient, Montserrat. The original Lovify onboarding look.',
    // Mobile-only by design — same phone frame at every viewport. A
    // future desktop-first template would set ['mobile','desktop']
    // and the preview dialog would surface the toggle.
    supportsViewports: ['mobile'],
  },
  {
    id: 'lovify-template-2',
    name: 'Lovify — v2',
    description:
      'Full-bleed responsive shell, cream + dark, 3-up plan cards. Designed for desktop and mobile from the same template.',
    supportsViewports: ['mobile', 'desktop'],
  },
]

export const DEFAULT_TEMPLATE_ID = TEMPLATE_MANIFESTS[0].id
