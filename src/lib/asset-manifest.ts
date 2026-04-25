// Asset manifest fetched from the funnel app's public folder.
// The admin shows marketers an image picker built from this list, so
// devs only need to drop new files into lovify-funnel/public/funnel-assets/
// and add an entry — no admin redeploy.

export type AssetCategory = {
  id: string
  label: string
  description?: string
}

export type AssetEntry = {
  // Path relative to /funnel-assets/, e.g. "wellness/portrait-1.jpg".
  // This is what we store in step config (`image_asset_key`).
  key: string
  // Category id this asset belongs to. Must match an entry in
  // `categories`.
  category: string
  // Marketer-facing label.
  label: string
  // Optional alt text the funnel renderer uses on <img>.
  alt?: string
}

export type AssetManifest = {
  version: number
  categories: AssetCategory[]
  assets: AssetEntry[]
}

// Assets now live in admin's own public/funnel-assets/ — no cross-origin
// fetch needed. VITE_FUNNEL_BASE_URL is only kept for backward compat;
// all asset resolution uses local paths by default.

let cache: { promise: Promise<AssetManifest>; at: number } | null = null
const TTL_MS = 60_000

// Fetch the manifest from admin's own public folder.
export function fetchAssetManifest(): Promise<AssetManifest> {
  const now = Date.now()
  if (cache && now - cache.at < TTL_MS) return cache.promise
  const promise = (async (): Promise<AssetManifest> => {
    try {
      const res = await fetch('/funnel-assets/manifest.json', { cache: 'no-cache' })
      if (!res.ok) throw new Error(`manifest_${res.status}`)
      return (await res.json()) as AssetManifest
    } catch {
      return { version: 0, categories: [], assets: [] }
    }
  })()
  cache = { promise, at: now }
  return promise
}

// Resolve an asset key (e.g. "general/man.svg") → local public URL.
// Also handles keys that already include the "funnel-assets/" prefix.
export function resolveAdminAssetUrl(key: string | null | undefined): string | null {
  if (!key) return null
  const trimmed = key.replace(/^\/+/, '').replace(/^funnel-assets\//, '')
  return `/funnel-assets/${trimmed}`
}

// Resolve either image_asset_key OR character_image_url for preview.
// character_image_url may be "/funnel-assets/..." (funnel-relative) or
// a full http URL — both work correctly now that assets are local.
export function resolveAdminImageUrl(
  imageAssetKey: string | null | undefined,
  characterImageUrl: string | null | undefined,
): string | null {
  if (imageAssetKey) return resolveAdminAssetUrl(imageAssetKey)
  if (!characterImageUrl) return null
  if (characterImageUrl.startsWith('http')) return characterImageUrl
  // Funnel-relative path like "/funnel-assets/general/man.svg" — works as-is locally
  return characterImageUrl.startsWith('/') ? characterImageUrl : `/${characterImageUrl}`
}
