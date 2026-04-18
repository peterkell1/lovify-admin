import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useUserDetail, useUserTransactions, useToggleContentVisibility } from '@/hooks/use-users'
import { GrantCreditsDialog } from '@/components/users/GrantCreditsDialog'
import { SongCard } from '@/components/users/SongCard'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Skeleton, SkeletonCard } from '@/components/ui/skeleton'
import { formatDate, formatNumber } from '@/lib/utils'
import { ArrowLeft, Plus, Music, ImageIcon, CreditCard, Zap, Film, Play, Clock, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

export default function UserDetailPage() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const [showGrantDialog, setShowGrantDialog] = useState(false)

  const { data, isLoading } = useUserDetail(userId!)
  const { data: transactions } = useUserTransactions(userId!)
  const toggleVisibility = useToggleContentVisibility()
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const handleToggle = async (e: React.MouseEvent, table: 'generated_songs' | 'generated_visions' | 'generated_videos', id: string, currentPublic: boolean, label: string) => {
    e.stopPropagation()
    e.preventDefault()
    const newState = !currentPublic
    setTogglingId(id)
    try {
      await toggleVisibility.mutateAsync({ table, id, isPublic: newState })
      toast.success(newState ? `${label} made public` : `${label} unpublished`)
    } catch {
      toast.error(`Failed to update ${label.toLowerCase()}`)
    } finally {
      setTogglingId(null)
    }
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="flex items-center gap-3 flex-1">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          <Skeleton className="h-10 w-36 rounded-lg" />
        </div>
        {/* Stats skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
        {/* Info + Sub skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-52 rounded-xl" />
          <Skeleton className="h-52 rounded-xl" />
        </div>
        {/* Table skeleton */}
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  const { profile, credits, subscriptions, songs, visions, videos } = data

  // Build a vision image lookup so videos can fallback to their vision's image
  const visionImageMap = new Map(visions.map((v) => [v.id, v.image_url]))

  if (!profile) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">User not found</p>
        <Button variant="ghost" onClick={() => navigate('/users')} className="mt-4">
          Back to Users
        </Button>
      </div>
    )
  }

  const activeSub = subscriptions.find((s) => s.status === 'active')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/users')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3 flex-1">
          <Avatar src={profile.avatar_url} fallback={profile.display_name || profile.email || 'U'} size="lg" />
          <div>
            <h1 className="text-xl font-bold">{profile.display_name || 'No name'}</h1>
            <p className="text-sm text-muted-foreground">{profile.email}</p>
          </div>
        </div>
        <Button onClick={() => setShowGrantDialog(true)}>
          <Plus className="h-4 w-4 mr-2" /> Grant Credits
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
                <Zap className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-tertiary font-medium">Credits</p>
                <p className="text-lg font-bold">{formatNumber(credits?.credit_balance ?? 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
                <CreditCard className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-tertiary font-medium">Tier</p>
                <p className="text-lg font-bold capitalize">{credits?.subscription_tier ?? 'free'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
                <Music className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-tertiary font-medium">Songs</p>
                <p className="text-lg font-bold">{songs.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
                <ImageIcon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-tertiary font-medium">Visions</p>
                <p className="text-lg font-bold">{visions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
                <Film className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-tertiary font-medium">Mind Movies</p>
                <p className="text-lg font-bold">{videos.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info + Subscription */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Account Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">User ID</span>
              <span className="font-mono text-xs">{profile.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Joined</span>
              <span>{formatDate(profile.created_at)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Profile Public</span>
              <Badge variant={profile.is_public ? 'success' : 'secondary'}>
                {profile.is_public ? 'Yes' : 'No'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Post-signup Done</span>
              <Badge variant={profile.has_completed_post_signup ? 'success' : 'warning'}>
                {profile.has_completed_post_signup ? 'Yes' : 'No'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Trial Exhausted</span>
              <span>{credits?.trial_exhausted ? 'Yes' : 'No'}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subscription</CardTitle>
          </CardHeader>
          <CardContent>
            {activeSub ? (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant="success">{activeSub.status}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Plan</span>
                  <span>{activeSub.plan_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Price</span>
                  <span>${(activeSub.price_cents / 100).toFixed(2)}/mo</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Credits/Month</span>
                  <span>{formatNumber(activeSub.credits_per_month)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Period End</span>
                  <span>{activeSub.current_period_end ? formatDate(activeSub.current_period_end) : '—'}</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">No active subscription</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Credit Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {!transactions || transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No transactions</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(tx.created_at)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {tx.transaction_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {tx.description || '—'}
                    </TableCell>
                    <TableCell className={`text-right font-mono text-sm ${tx.amount >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {tx.amount >= 0 ? '+' : ''}{tx.amount}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Songs */}
      <Card>
        <CardHeader>
          <CardTitle>Songs ({songs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {songs.length === 0 ? (
            <p className="text-sm text-tertiary text-center py-6">No songs created</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {songs.map((song) => (
                <SongCard key={song.id} song={song} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Visions */}
      <Card>
        <CardHeader>
          <CardTitle>Visions ({visions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {visions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No visions created</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {visions.map((vision) => (
                <div key={vision.id} className="border border-border rounded-xl overflow-hidden bg-card">
                  <div className="relative">
                    {vision.image_url ? (
                      <img src={vision.image_url} alt="" className="w-full aspect-square object-cover" />
                    ) : (
                      <div className="w-full aspect-square bg-muted flex items-center justify-center">
                        <ImageIcon className="h-6 w-6 text-tertiary" />
                      </div>
                    )}
                    {/* Visibility toggle */}
                    <button
                      onClick={(e) => handleToggle(e, 'generated_visions', vision.id, vision.is_public, 'Vision')}
                      disabled={togglingId === vision.id}
                      title={vision.is_public ? 'Unpublish this vision' : 'Make public'}
                      className="absolute top-2 right-2 h-8 w-8 rounded-lg bg-white/90 shadow-sm flex items-center justify-center hover:bg-white transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {vision.is_public ? (
                        <EyeOff className="h-4 w-4 text-destructive" />
                      ) : (
                        <Eye className="h-4 w-4 text-tertiary" />
                      )}
                    </button>
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs truncate font-medium">{vision.prompt || 'No prompt'}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-tertiary">{formatDate(vision.created_at)}</p>
                      <Badge variant={vision.is_public ? 'success' : 'outline'} className="text-xs">
                        {vision.is_public ? 'Public' : 'Private'}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mind Movies */}
      <Card>
        <CardHeader>
          <CardTitle>Mind Movies ({videos.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {videos.length === 0 ? (
            <p className="text-sm text-tertiary text-center py-6">No mind movies created</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {videos.map((video) => (
                <div key={video.id} className="border border-border rounded-xl overflow-hidden">
                  {/* Thumbnail / Video preview — fallback to linked vision image */}
                  <div className="relative aspect-video bg-muted">
                    {(video.thumbnail_url || visionImageMap.get(video.vision_id)) ? (
                      <img
                        src={(video.thumbnail_url || visionImageMap.get(video.vision_id))!}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Film className="h-8 w-8 text-tertiary" />
                      </div>
                    )}
                    {/* Top row: visibility toggle + status */}
                    <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
                      <button
                        onClick={(e) => handleToggle(e, 'generated_videos', video.id, video.is_public, 'Mind Movie')}
                        disabled={togglingId === video.id}
                        title={video.is_public ? 'Unpublish this video' : 'Make public'}
                        className="h-8 w-8 rounded-lg bg-white/90 shadow-sm flex items-center justify-center hover:bg-white transition-colors cursor-pointer disabled:opacity-50 z-10"
                      >
                        {video.is_public ? (
                          <EyeOff className="h-4 w-4 text-destructive" />
                        ) : (
                          <Eye className="h-4 w-4 text-tertiary" />
                        )}
                      </button>
                      <Badge
                        variant={
                          video.status === 'completed' || video.status === 'ready' ? 'success'
                            : video.status === 'failed' ? 'destructive'
                            : 'warning'
                        }
                        className="text-xs"
                      >
                        {video.status}
                      </Badge>
                    </div>
                    {/* Play button overlay for completed videos */}
                    {video.video_url && (
                      <a
                        href={video.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute inset-0 flex items-center justify-center bg-foreground/20 opacity-0 hover:opacity-100 transition-opacity"
                      >
                        <div className="h-12 w-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                          <Play className="h-5 w-5 text-foreground ml-0.5" />
                        </div>
                      </a>
                    )}
                  </div>
                  {/* Info */}
                  <div className="p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-tertiary">
                        {video.duration_seconds && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {video.duration_seconds}s
                          </span>
                        )}
                        <Badge variant={video.is_public ? 'success' : 'outline'} className="text-xs">
                          {video.is_public ? 'Public' : 'Private'}
                        </Badge>
                      </div>
                    </div>
                    {video.status === 'failed' && (
                      <div className="flex items-center gap-1 text-xs text-destructive">
                        <AlertCircle className="h-3 w-3" />
                        <span>Generation failed</span>
                      </div>
                    )}
                    <p className="text-xs text-tertiary">{formatDate(video.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grant Credits Dialog */}
      <GrantCreditsDialog
        open={showGrantDialog}
        onClose={() => setShowGrantDialog(false)}
        userId={userId!}
        userEmail={profile.email}
      />
    </div>
  )
}
