import { NavLink } from 'react-router-dom'
import { useAdminAuth } from '@/hooks/use-admin-auth'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'

const dashboards = [
  { to: '/', label: 'Product', end: true },
  { to: '/business', label: 'Business Health', end: false },
  { to: '/growth', label: 'Growth', end: false },
  { to: '/vanity', label: 'Vanity', end: false, muted: true },
]

export function Navbar() {
  const { user, logout } = useAdminAuth()

  const displayName = user?.user_metadata?.display_name
    || user?.user_metadata?.full_name
    || user?.email
    || 'Admin'

  return (
    <header className="h-16 border-b border-sidebar-border bg-sidebar-bg flex items-center justify-end px-6 sticky top-0 z-30">
      <nav className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1 h-16">
        {dashboards.map((d) => (
          <NavLink
            key={d.to}
            to={d.to}
            end={d.end}
            className={({ isActive }) =>
              cn(
                'relative px-4 h-16 inline-flex items-center text-sm font-medium transition-colors',
                d.muted
                  ? isActive
                    ? 'text-white after:absolute after:bottom-0 after:inset-x-3 after:h-0.5 after:bg-sidebar-foreground/50'
                    : 'text-sidebar-foreground/40 hover:text-sidebar-foreground/70'
                  : isActive
                    ? 'text-accent after:absolute after:bottom-0 after:inset-x-3 after:h-0.5 after:bg-accent'
                    : 'text-sidebar-foreground/70 hover:text-white'
              )
            }
          >
            {d.label}
          </NavLink>
        ))}
      </nav>

      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-semibold leading-none text-white">{displayName}</p>
          <p className="text-xs text-sidebar-foreground/60 mt-0.5">Admin</p>
        </div>
        <Avatar
          src={user?.user_metadata?.avatar_url}
          fallback={displayName}
          size="sm"
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={logout}
          title="Sign out"
          className="text-sidebar-foreground/70 hover:text-white hover:bg-sidebar-muted"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}
