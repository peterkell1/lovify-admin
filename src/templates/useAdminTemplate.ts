import { useEffect, useState } from 'react'
import type { AdminTemplate } from './types'
import { loadAdminTemplate } from './registry'

// React-friendly wrapper around loadAdminTemplate(). Returns the cached
// template synchronously on subsequent renders for the same id, and
// `null` while the chunk is loading on first hit. Callers should
// render a small placeholder (skeleton, spinner, empty preview) while
// `template === null`. We deliberately avoid Suspense here so the
// surrounding form/page doesn't blank out when a marketer flips
// between templates in the picker.
export function useAdminTemplate(
  id: string | null | undefined,
): AdminTemplate | null {
  const [tpl, setTpl] = useState<AdminTemplate | null>(null)

  useEffect(() => {
    let alive = true
    setTpl(null)
    loadAdminTemplate(id).then((t) => {
      if (alive) setTpl(t)
    })
    return () => {
      alive = false
    }
  }, [id])

  return tpl
}
