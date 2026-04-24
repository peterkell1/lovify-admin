// Admin-side preview mirror of lovify-funnel/src/lib/interpolate.ts.
// Preview has no real prior answers, so we replace {{answer.<key>}} with a
// visible placeholder like [answer.monthly] — that way marketers can see at a
// glance which tokens would land at runtime.
const TOKEN_RE = /\{\{\s*answer\.([a-z0-9_-]+)\s*\}\}/gi

export function interpolatePreview(template: string): string {
  if (!template) return template
  return template.replace(TOKEN_RE, (_m, key: string) => `[answer.${key}]`)
}
