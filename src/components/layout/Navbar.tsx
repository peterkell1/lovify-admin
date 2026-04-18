import { useAdminAuth } from '@/hooks/use-admin-auth'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

export function Navbar() {
  const { user, logout } = useAdminAuth()

  const displayName = user?.user_metadata?.display_name
    || user?.user_metadata?.full_name
    || user?.email
    || 'Admin'

  return (
    <header className="h-16 border-b border-border bg-card/80 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-30">
      <div />

      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-semibold leading-none">{displayName}</p>
          <p className="text-xs text-tertiary mt-0.5">Admin</p>
        </div>
        <Avatar
          src={user?.user_metadata?.avatar_url}
          fallback={displayName}
          size="sm"
        />
        <Button variant="ghost" size="icon" onClick={logout} title="Sign out">
          <LogOut className="h-4 w-4 text-tertiary" />
        </Button>
      </div>
    </header>
  )
}
