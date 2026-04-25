import type { AdminTemplate, AdminTemplateManifest } from './types'
import { TEMPLATE_MANIFESTS, DEFAULT_TEMPLATE_ID } from './manifests'

// Lazy registry. Manifests (id, name, description, supportsViewports)
// stay eager because the gallery needs them all to render cards. The
// heavy bits — Preview component, samples, anything that imports React
// — load only when a template is actually rendered. This keeps the
// admin's first paint flat as the catalogue grows from 1 to 20+ templates.
//
// Each template's `index.ts` exports a `default` of type AdminTemplate
// so we can `import('./<id>')` uniformly without per-template plumbing.

const LOADERS: Record<string, () => Promise<{ default: AdminTemplate }>> = {
  'lovify-music-v1': () => import('./lovify-music-v1'),
  'lovify-template-2': () => import('./lovify-template-2'),
}

const CACHE: Map<string, AdminTemplate> = new Map()

export { DEFAULT_TEMPLATE_ID }

export function listAdminTemplateManifests(): AdminTemplateManifest[] {
  return TEMPLATE_MANIFESTS
}

export function getAdminTemplateManifest(
  id: string | null | undefined,
): AdminTemplateManifest {
  const found = id ? TEMPLATE_MANIFESTS.find((t) => t.id === id) : undefined
  return found ?? TEMPLATE_MANIFESTS.find((t) => t.id === DEFAULT_TEMPLATE_ID)!
}

// Async load. Returns the cached template instance on subsequent calls
// so React Suspense boundaries / state can rely on referential equality.
export async function loadAdminTemplate(
  id: string | null | undefined,
): Promise<AdminTemplate> {
  const resolvedId = id && LOADERS[id] ? id : DEFAULT_TEMPLATE_ID
  const cached = CACHE.get(resolvedId)
  if (cached) return cached
  const mod = await LOADERS[resolvedId]()
  CACHE.set(resolvedId, mod.default)
  return mod.default
}
