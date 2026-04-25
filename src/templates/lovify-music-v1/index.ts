import { StepPreview } from '@/components/funnels/preview/StepPreview'
import type { AdminTemplate } from '@/templates/types'
import { TEMPLATE_MANIFESTS } from '@/templates/manifests'
import { LOVIFY_MUSIC_V1_SAMPLES } from './samples'

const manifest = TEMPLATE_MANIFESTS.find((t) => t.id === 'lovify-music-v1')!

// Keep the existing StepPreview as the v1 preview entry point. Future
// templates plug their own component in here and live in their own
// folder under src/templates/<id>/.
export const lovifyMusicV1: AdminTemplate = {
  manifest,
  Preview: StepPreview,
  samples: LOVIFY_MUSIC_V1_SAMPLES,
}

// Default export so the lazy registry can `import('./lovify-music-v1')`
// and read `.default` without bespoke wiring per template.
export default lovifyMusicV1
