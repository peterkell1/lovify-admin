import type { AdminTemplate } from '@/templates/types'
import { TEMPLATE_MANIFESTS } from '@/templates/manifests'
import { Preview } from './Preview'
import { LOVIFY_TEMPLATE_2_SAMPLES } from './samples'

const manifest = TEMPLATE_MANIFESTS.find((t) => t.id === 'lovify-template-2')!

const lovifyTemplate2: AdminTemplate = {
  manifest,
  Preview,
  samples: LOVIFY_TEMPLATE_2_SAMPLES,
}

export default lovifyTemplate2
