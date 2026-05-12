import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

const STORAGE_KEY = 'lovify_admin_sidebar_collapsed'
const DASHBOARD_ROUTES = ['/', '/business', '/growth', '/vanity']

function isDashboardRoute(pathname: string): boolean {
  if (pathname === '/') return true
  return DASHBOARD_ROUTES.some((r) => r !== '/' && pathname.startsWith(r))
}

export function useSidebarState() {
  const { pathname } = useLocation()

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
    if (stored === 'true') return true
    if (stored === 'false') return false
    return isDashboardRoute(pathname)
  })

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === null) {
      setCollapsed(isDashboardRoute(pathname))
    }
  }, [pathname])

  const toggle = () => {
    setCollapsed((prev) => {
      const next = !prev
      localStorage.setItem(STORAGE_KEY, String(next))
      return next
    })
  }

  return { collapsed, toggle }
}
