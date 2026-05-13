import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  Users,
  Music,
  Megaphone,
  CreditCard,
  ClipboardList,
  MessageSquare,
  Settings,
  Menu,
} from 'lucide-react'

const navItems = [
  { to: '/users', icon: Users, label: 'Users' },
  { to: '/content', icon: Music, label: 'Content' },
  { to: '/funnels', icon: Megaphone, label: 'Funnels' },
  { to: '/subscriptions', icon: CreditCard, label: 'Subscriptions' },
  { to: '/feedback', icon: MessageSquare, label: 'Feedback' },
  { to: '/audit', icon: ClipboardList, label: 'Audit Log' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  return (
    <aside
      className={cn(
        'h-screen bg-sidebar-bg text-sidebar-foreground flex flex-col transition-all duration-200 sticky top-0',
        collapsed ? 'w-[68px]' : 'w-60'
      )}
    >
      <div
        className={cn(
          'h-16 flex items-center border-b border-sidebar-border',
          collapsed ? 'justify-center px-0' : 'px-3 gap-2'
        )}
      >
        <button
          onClick={onToggle}
          aria-label="Toggle sidebar"
          className="h-9 w-9 inline-flex items-center justify-center rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-muted hover:text-white transition-colors shrink-0"
        >
          <Menu className="h-[18px] w-[18px]" />
        </button>
        {!collapsed && (
          <div className="flex items-center gap-2 min-w-0">
            <img
              src="/lovify-logo.png"
              alt="Lovify"
              className="h-8 w-8 rounded-lg shrink-0"
            />
            <span className="font-bold text-base text-white tracking-tight truncate">
              Lovify Admin
            </span>
          </div>
        )}
      </div>

      <nav className="flex-1 py-4 space-y-1 px-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-150',
                collapsed ? 'justify-center h-10 w-10 mx-auto' : 'px-3 py-2.5',
                isActive
                  ? 'bg-sidebar-accent text-white shadow-sm'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-muted hover:text-sidebar-foreground'
              )
            }
          >
            <item.icon className="h-[18px] w-[18px] shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
