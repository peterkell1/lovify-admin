import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Copy, Edit, BarChart3, Trash2, Play, Pause, Palette } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useFunnel, usePublishFunnel, useDeleteFunnel, useUpdateFunnel } from '@/hooks/use-funnels'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { formatDate } from '@/lib/utils'
import { STEP_TYPE_LABEL } from '@/types/funnels'
import { getAdminTemplateManifest } from '@/templates/registry'
import { TemplatePreviewDialog } from '@/components/funnels/TemplatePreviewDialog'
import { ChangeTemplateDialog } from '@/components/funnels/ChangeTemplateDialog'
import type { AdminTemplateManifest } from '@/templates/types'

export default function FunnelDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data, isLoading } = useFunnel(id)
  const publish = usePublishFunnel()
  const del = useDeleteFunnel()
  const update = useUpdateFunnel()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [previewTemplateOpen, setPreviewTemplateOpen] = useState(false)
  const [changeTemplateOpen, setChangeTemplateOpen] = useState(false)
  // Template the user picked in the gallery — held in state so the
  // confirm step can show its name. Cleared on cancel/confirm.
  const [pendingTemplate, setPendingTemplate] = useState<AdminTemplateManifest | null>(null)
  const funnelBaseUrl = import.meta.env.VITE_FUNNEL_BASE_URL

  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  const { funnel, steps } = data
  const adUrl = funnelBaseUrl ? `${funnelBaseUrl}/${funnel.slug}` : `/${funnel.slug}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(adUrl)
      toast.success('Ad URL copied')
    } catch {
      toast.error('Copy failed')
    }
  }

  const handleStatusToggle = async () => {
    const next = funnel.status === 'live' ? 'paused' : 'live'
    try {
      await publish.mutateAsync({ id: funnel.id, slug: funnel.slug, status: next })
      toast.success(next === 'live' ? 'Funnel live' : 'Funnel paused')
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : 'Failed to update funnel status',
      )
    }
  }

  const handleDelete = async () => {
    try {
      await del.mutateAsync({ id: funnel.id, slug: funnel.slug })
      toast.success('Funnel deleted')
      navigate('/funnels')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete funnel')
    }
  }

  const handlePickTemplate = (m: AdminTemplateManifest) => {
    setChangeTemplateOpen(false)
    setPendingTemplate(m)
  }

  const handleConfirmTemplate = async () => {
    if (!pendingTemplate) return
    try {
      await update.mutateAsync({
        id: funnel.id,
        slug: funnel.slug,
        patch: { template: pendingTemplate.id },
      })
      toast.success(`Switched to ${pendingTemplate.name}`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to change template')
    } finally {
      setPendingTemplate(null)
    }
  }

  return (
    <div className="space-y-6">
      <Link to="/funnels" className="inline-flex items-center gap-2 text-sm text-tertiary hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to funnels
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-foreground">{funnel.name}</h1>
            <Badge variant={funnel.status === 'live' ? 'default' : 'secondary'}>
              {funnel.status}
            </Badge>
            <button
              type="button"
              onClick={() => setPreviewTemplateOpen(true)}
              title="Preview this template"
              className="cursor-pointer"
            >
              <Badge variant="outline" className="hover:bg-foreground/5 transition">
                {getAdminTemplateManifest(funnel.template).name}
              </Badge>
            </button>
          </div>
          <p className="mt-1 font-mono text-sm text-tertiary">/{funnel.slug}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to={`/funnels/${funnel.id}/analytics`}>
            <Button variant="outline" size="sm">
              <BarChart3 className="h-4 w-4" /> Analytics
            </Button>
          </Link>
          <Link to={`/funnels/${funnel.id}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4" /> Edit
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setChangeTemplateOpen(true)}
            disabled={update.isPending}
          >
            <Palette className="h-4 w-4" /> Change template
          </Button>
          <Button size="sm" onClick={handleStatusToggle} disabled={publish.isPending}>
            {funnel.status === 'live' ? (
              <><Pause className="h-4 w-4" /> Pause</>
            ) : (
              <><Play className="h-4 w-4" /> {funnel.status === 'paused' ? 'Resume' : 'Publish'}</>
            )}
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setConfirmDelete(true)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ad URL</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded-md bg-secondary px-3 py-2 text-sm">{adUrl}</code>
            <Button variant="outline" size="sm" onClick={handleCopy}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <p className="mt-2 text-xs text-tertiary">
            Append ad-click params like <span className="font-mono">?ttclid=...&amp;utm_source=tiktok&amp;utm_campaign=...</span>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Steps ({steps.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {steps.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-xs font-bold">
                    {s.position}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {(s.config as { title?: string }).title ?? s.step_key}
                    </p>
                    <p className="text-xs text-tertiary">
                      <span className="font-mono">{s.step_key}</span> · {STEP_TYPE_LABEL[s.step_type]}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div>
            <span className="text-tertiary">Template</span>
            <p className="font-mono text-foreground">{funnel.template ?? '—'}</p>
          </div>
          <div>
            <span className="text-tertiary">Default plan</span>
            <p className="font-mono text-foreground">{funnel.default_plan_key ?? '—'}</p>
          </div>
          <div>
            <span className="text-tertiary">Meta Pixel</span>
            <p className="font-mono text-foreground">{funnel.meta_pixel_id ?? 'Global default'}</p>
          </div>
          <div>
            <span className="text-tertiary">Created</span>
            <p className="text-foreground">{formatDate(funnel.created_at)}</p>
          </div>
          <div>
            <span className="text-tertiary">Published</span>
            <p className="text-foreground">
              {funnel.published_at ? formatDate(funnel.published_at) : '—'}
            </p>
          </div>
          <div>
            <span className="text-tertiary">Plans configured</span>
            <p className="text-foreground">{funnel.plan_options.length}</p>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete funnel"
        description={`This will delete "${funnel.name}" and all its sessions and answers. This cannot be undone.`}
        onConfirm={handleDelete}
        confirmLabel="Delete"
        variant="destructive"
        loading={del.isPending}
      />

      <TemplatePreviewDialog
        open={previewTemplateOpen}
        onClose={() => setPreviewTemplateOpen(false)}
        templateId={funnel.template}
        funnelName={funnel.name}
      />

      <ChangeTemplateDialog
        open={changeTemplateOpen}
        onClose={() => setChangeTemplateOpen(false)}
        currentTemplateId={funnel.template}
        onSelect={handlePickTemplate}
      />

      <ConfirmDialog
        open={!!pendingTemplate}
        onClose={() => setPendingTemplate(null)}
        title={`Switch to ${pendingTemplate?.name ?? ''}?`}
        description={
          funnel.status === 'live'
            ? `This funnel is live. End users will see the new look on next visit (within ~60s). Step content and plans carry over.`
            : `Step content and plans carry over — only the look changes.`
        }
        onConfirm={handleConfirmTemplate}
        confirmLabel="Switch template"
        loading={update.isPending}
      />
    </div>
  )
}
