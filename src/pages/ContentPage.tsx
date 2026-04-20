import { useSearchParams } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { ContentSongsTab } from '@/components/content/ContentSongsTab'
import { ContentVisionsTab } from '@/components/content/ContentVisionsTab'
import { ContentVideosTab } from '@/components/content/ContentVideosTab'

const tabs = [
  { id: 'songs', label: 'Songs' },
  { id: 'visions', label: 'Visions' },
  { id: 'videos', label: 'Mind Movies' },
] as const

type TabId = (typeof tabs)[number]['id']

const tabIds = tabs.map((t) => t.id) as readonly TabId[]
const defaultTab: TabId = 'songs'

export default function ContentPage() {
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
        <h1 className="text-2xl font-bold text-foreground">Content</h1>
        <p className="text-tertiary text-sm mt-1">Browse and manage all user-generated content</p>
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

      {activeTab === 'songs' && <ContentSongsTab />}
      {activeTab === 'visions' && <ContentVisionsTab />}
      {activeTab === 'videos' && <ContentVideosTab />}
    </div>
  )
}
