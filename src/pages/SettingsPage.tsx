import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAppSettings, useUpdateAppSetting, useFeatureFlags, useToggleFeatureFlag } from '@/hooks/use-settings'
import { cn } from '@/lib/utils'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { formatDate } from '@/lib/utils'
import { Save, Zap, Gift, Crown, Music, ImageIcon, Film } from 'lucide-react'
import { toast } from 'sonner'
import { CreditEconomyTab } from '@/components/finance/CreditEconomyTab'

// ─── Credits Config ───

const CREDIT_SETTINGS = [
  {
    key: 'signup_free_credits',
    label: 'Free Signup Credits',
    description: 'Credits given to every new user on signup (added to free_credits pool)',
    icon: Gift,
    defaultValue: '300',
  },
  {
    key: 'trial_credits',
    label: 'Trial Credits',
    description: 'Credits given during the yearly premium trial period',
    icon: Crown,
    defaultValue: '250',
  },
  {
    key: 'daily_bonus_credits',
    label: 'Daily Bonus Credits',
    description: 'Credits given to subscribers who claim their daily bonus',
    icon: Zap,
    defaultValue: '5',
  },
]

// ─── Feature labels + icons for known flags ───

const FEATURE_META: Record<string, { label: string; description: string; icon: typeof Music }> = {
  songs: {
    label: 'Song Creation',
    description: 'Allow users to create AI-generated songs',
    icon: Music,
  },
  visions: {
    label: 'Create Vision',
    description: 'Allow users to generate AI vision boards',
    icon: ImageIcon,
  },
  videos: {
    label: 'Mind Movies',
    description: 'Allow users to generate mind movie videos',
    icon: Film,
  },
}

// Flags to hide from the admin Feature Management list. The row can still exist
// in the DB (nothing reads it), but surfacing it in the UI was misleading
// because flipping it had no effect.
const HIDDEN_FLAGS = new Set<string>(['credits_enabled'])

// ─── Tabs ───

const tabs = [
  { id: 'credits', label: 'Credits Configuration' },
  { id: 'features', label: 'Feature Management' },
  { id: 'credit-economy', label: 'Credit Economy' },
] as const

type TabId = (typeof tabs)[number]['id']

const tabIds = tabs.map((t) => t.id) as readonly TabId[]
const defaultTab: TabId = 'credits'

// ─── Credits Tab ───

function CreditsConfigTab() {
  const { data: settings, isLoading } = useAppSettings()
  const updateSetting = useUpdateAppSetting()
  const [values, setValues] = useState<Record<string, string>>({})
  const [dirty, setDirty] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!settings) return
    const map: Record<string, string> = {}
    for (const s of settings) {
      map[s.key] = s.value
    }
    for (const cs of CREDIT_SETTINGS) {
      if (!map[cs.key]) map[cs.key] = cs.defaultValue
    }
    setValues(map)
    setDirty(new Set())
  }, [settings])

  const handleChange = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }))
    setDirty((prev) => new Set(prev).add(key))
  }

  const handleSave = async (key: string) => {
    const value = values[key]
    if (!value) return
    try {
      await updateSetting.mutateAsync({ key, value })
      toast.success(`${key} updated to ${value}`)
      setDirty((prev) => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })
    } catch {
      toast.error('Failed to update setting')
    }
  }

  const handleSaveAll = async () => {
    for (const key of dirty) {
      await handleSave(key)
    }
  }

  if (isLoading) {
    return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>
  }

  const settingMap = new Map(settings?.map((s) => [s.key, s]) ?? [])

  return (
    <div className="space-y-6">
      {dirty.size > 0 && (
        <div className="flex justify-end">
          <Button onClick={handleSaveAll} disabled={updateSetting.isPending}>
            <Save className="h-4 w-4 mr-2" />
            Save All Changes
          </Button>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Credits Configuration</CardTitle>
          <CardDescription>
            Control how many credits are assigned to users at different stages.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {CREDIT_SETTINGS.map((cs) => {
            const existing = settingMap.get(cs.key)
            const isDirty = dirty.has(cs.key)

            return (
              <div key={cs.key} className="flex items-start gap-4 p-4 bg-secondary rounded-xl">
                <div className="h-10 w-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0 mt-0.5">
                  <cs.icon className="h-5 w-5" />
                </div>
                <div className="flex-1 space-y-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{cs.label}</p>
                    <p className="text-xs text-tertiary">{cs.description}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      value={values[cs.key] ?? cs.defaultValue}
                      onChange={(e) => handleChange(cs.key, e.target.value)}
                      className="w-32 bg-card"
                      min={0}
                    />
                    <span className="text-sm text-tertiary">credits</span>
                    {isDirty && (
                      <Button
                        size="sm"
                        onClick={() => handleSave(cs.key)}
                        disabled={updateSetting.isPending}
                      >
                        <Save className="h-3.5 w-3.5 mr-1" />
                        Save
                      </Button>
                    )}
                  </div>
                  {existing && (
                    <p className="text-[11px] text-tertiary">
                      Current value: <span className="font-semibold text-foreground">{existing.value}</span>
                      {' '} &middot; Last updated: {formatDate(existing.updated_at)}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Feature Management Tab ───

function FeatureManagementTab() {
  const { data: flags, isLoading } = useFeatureFlags()
  const toggleFlag = useToggleFeatureFlag()
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const handleToggle = async (id: string, name: string, currentState: boolean | null) => {
    const newState = !currentState
    setTogglingId(id)
    try {
      await toggleFlag.mutateAsync({ id, isEnabled: newState })
      const meta = FEATURE_META[name]
      toast.success(`${meta?.label ?? name} ${newState ? 'enabled' : 'disabled'}`)
    } catch {
      toast.error('Failed to toggle feature')
    } finally {
      setTogglingId(null)
    }
  }

  if (isLoading) {
    return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Feature Management</CardTitle>
        <CardDescription>
          Enable or disable features across the platform. Changes take effect immediately for all users.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {(() => {
          const visibleFlags = (flags ?? []).filter((f) => !HIDDEN_FLAGS.has(f.name))
          if (visibleFlags.length === 0) {
            return <p className="text-sm text-tertiary text-center py-6">No features configured</p>
          }
          return visibleFlags.map((flag) => {
            const meta = FEATURE_META[flag.name]
            const Icon = meta?.icon ?? Zap
            const isOn = flag.is_enabled === true

            return (
              <div key={flag.id} className="flex items-center gap-4 p-4 bg-secondary rounded-xl">
                <div className={cn(
                  'h-10 w-10 rounded-xl flex items-center justify-center shrink-0',
                  isOn ? 'bg-success/10 text-success' : 'bg-muted text-tertiary'
                )}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{meta?.label ?? flag.name}</p>
                  <p className="text-xs text-tertiary">{meta?.description ?? flag.description ?? 'No description'}</p>
                  {flag.updated_at && (
                    <p className="text-[11px] text-tertiary mt-1">Last changed: {formatDate(flag.updated_at)}</p>
                  )}
                </div>
                <button
                  onClick={() => handleToggle(flag.id, flag.name, flag.is_enabled)}
                  disabled={togglingId === flag.id}
                  role="switch"
                  aria-checked={isOn}
                  aria-label={`Toggle ${meta?.label ?? flag.name}`}
                  className={cn(
                    'relative inline-flex h-7 w-12 flex-shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
                    'disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
                    isOn ? 'bg-success shadow-soft' : 'bg-muted'
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ease-in-out',
                      isOn ? 'translate-x-6' : 'translate-x-1'
                    )}
                  />
                </button>
              </div>
            )
          })
        })()}
      </CardContent>
    </Card>
  )
}

// ─── Settings Page ───

export default function SettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab') as TabId | null
  const activeTab: TabId = tabParam && tabIds.includes(tabParam) ? tabParam : defaultTab

  const setActiveTab = (id: TabId) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (id === defaultTab) next.delete('tab')
      else next.set('tab', id)
      return next
    }, { replace: true })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-tertiary text-sm mt-1">Platform configuration</p>
      </div>

      <div className="flex gap-1 bg-secondary rounded-xl p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer',
              activeTab === tab.id
                ? 'bg-card text-foreground shadow-soft'
                : 'text-tertiary hover:text-foreground'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'credits' && <CreditsConfigTab />}
      {activeTab === 'features' && <FeatureManagementTab />}
      {activeTab === 'credit-economy' && <CreditEconomyTab />}
    </div>
  )
}
