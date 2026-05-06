import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Sparkles,
  HeartPulse,
  TrendingUp,
  Trophy,
  Users,
  Music,
  DollarSign,
  Megaphone,
  BarChart3,
  ClipboardList,
  MessageSquare,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Archive,
} from 'lucide-react'
import { useState } from 'react'

const mainNavItems = [
  { to: '/', icon: Sparkles, label: 'Product Health' },
  { to: '/business-health', icon: HeartPulse, label: 'Business Health' },
  { to: '/growth', icon: TrendingUp, label: 'Growth' },
  { to: '/vanity', icon: Trophy, label: 'Vanity' },
  { to: '/users', icon: Users, label: 'Users' },
  { to: '/content', icon: Music, label: 'Content' },
  // { to: '/moderation', icon: Shield, label: 'Moderation' }, // TODO: enable when moderate-prompt edge function is fixed
  { to: '/feedback', icon: MessageSquare, label: 'Feedback' },
  { to: '/audit', icon: ClipboardList, label: 'Audit Log' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

// Sunsetted pages — kept accessible but de-emphasized.
const outdatedItems = [
  { to: '/overview', icon: LayoutDashboard, label: 'Overview' },
  { to: '/funnels', icon: Megaphone, label: 'Funnels' },
  { to: '/finance', icon: DollarSign, label: 'Finance (legacy)' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [outdatedOpen, setOutdatedOpen] = useState(false)

  return (
    <aside
      className={cn(
        'h-screen bg-sidebar-bg text-sidebar-foreground flex flex-col transition-all duration-200 sticky top-0',
        collapsed ? 'w-[68px]' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-sidebar-border">
        <img
          src="/lovify-logo.png"
          alt="Lovify"
          className="h-9 w-9 rounded-lg shrink-0"
        />
        {!collapsed && (
          <span className="ml-3 font-bold text-base text-white tracking-tight">
            Lovify Admin
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 space-y-1 px-3 overflow-y-auto">
        {mainNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
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

        {/* Outdated section — collapsible */}
        <div className="pt-3 mt-3 border-t border-sidebar-border/50">
          <button
            onClick={() => setOutdatedOpen((o) => !o)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 text-sidebar-foreground/40 hover:bg-sidebar-muted hover:text-sidebar-foreground/70 cursor-pointer'
            )}
            title="Sunsetted pages — kept around but not in active use"
          >
            <Archive className="h-[16px] w-[16px] shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1 text-left uppercase tracking-wider">Outdated</span>
                <ChevronDown
                  className={cn(
                    'h-3 w-3 transition-transform',
                    outdatedOpen && 'rotate-180'
                  )}
                />
              </>
            )}
          </button>

          {outdatedOpen && (
            <div className="mt-1 space-y-1">
              {outdatedItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150',
                      collapsed ? '' : 'pl-8',
                      isActive
                        ? 'bg-sidebar-muted text-sidebar-foreground/80'
                        : 'text-sidebar-foreground/40 hover:bg-sidebar-muted hover:text-sidebar-foreground/70'
                    )
                  }
                >
                  <item.icon className="h-[15px] w-[15px] shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="h-12 flex items-center justify-center border-t border-sidebar-border text-sidebar-foreground/40 hover:text-sidebar-foreground transition-colors cursor-pointer"
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </aside>
  )
}
