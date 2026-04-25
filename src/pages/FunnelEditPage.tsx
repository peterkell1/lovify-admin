import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  useFunnel,
  useCreateFunnel,
  useUpdateFunnel,
  useCreateStep,
  useUpdateStep,
  useDeleteStep,
  useReorderSteps,
} from '@/hooks/use-funnels'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Field } from '@/components/funnels/step-forms/shared'
import { StepList } from '@/components/funnels/StepList'
import { StepEditor, type StepEditorDraft } from '@/components/funnels/StepEditor'
import { PaywallPlanPicker } from '@/components/funnels/PaywallPlanPicker'
import type { Funnel, FunnelStep, PlanOption } from '@/types/funnels'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

type Props = { mode: 'create' | 'edit' }

// Mirror GitHub's branch/repo slug rule: lowercase, spaces & punctuation →
// dashes, collapse repeats, trim leading/trailing dashes. Cheap to run on
// every keystroke. The user's raw input is preserved in state so they
// can see what they're typing; the slugified version is derived and
// shown as a live preview under the field.
function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Entry point chosen by App.tsx's route table: `mode="create"` renders the
// skinny CreateFunnelForm; `mode="edit"` loads the full editor. We split
// these into two separate top-level components so each only calls the
// hooks it actually needs — previously the same component called
// useParams + useFunnel conditionally, which broke the Rules of Hooks
// on navigation from /funnels/new to /funnels/:id/edit.
export default function FunnelEditPage({ mode }: Props) {
  if (mode === 'create') return <CreateEntry />
  return <EditEntry />
}

function CreateEntry() {
  const navigate = useNavigate()
  return <CreateFunnelForm onCreated={(f) => navigate(`/funnels/${f.id}/edit`)} />
}

function EditEntry() {
  const { id } = useParams<{ id: string }>()
  const { data, isLoading } = useFunnel(id)
  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }
  return <EditExisting funnel={data.funnel} steps={data.steps} />
}

function CreateFunnelForm({ onCreated }: { onCreated: (f: Funnel) => void }) {
  // `slugInput` is what the user is typing (spaces, caps, anything).
  // `slug` — the slugified version used on save — is derived from it.
  // Decoupling them lets the user type naturally while we show a live
  // preview of what actually gets stored, GitHub-style.
  const [slugInput, setSlugInput] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  // Track whether the user has touched the slug themselves. If they
  // haven't, we mirror the Name into Slug (GitHub "new repo" behaviour).
  // Once they edit Slug directly we stop auto-suggesting so we don't
  // stomp their input.
  const [slugTouched, setSlugTouched] = useState(false)
  const create = useCreateFunnel()

  const slug = slugify(slugInput)
  const slugError = slugInput && !slug ? 'Enter at least one letter or number' : null
  const canSave = !!slug && !!name && !slugError && !create.isPending

  const handleSave = async () => {
    try {
      const funnel = await create.mutateAsync({ slug, name, description })
      toast.success('Funnel created')
      onCreated(funnel)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to create funnel')
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <Link to="/funnels" className="inline-flex items-center gap-2 text-sm text-tertiary hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Cancel
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-foreground">New funnel</h1>
        <p className="mt-1 text-sm text-tertiary">
          Create a funnel shell, then add steps and plans on the next page.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-4 py-6">
          <Field label="Name">
            <Input
              value={name}
              onChange={(e) => {
                const next = e.target.value
                setName(next)
                if (!slugTouched) setSlugInput(next)
              }}
              placeholder="Lovify Music — Spring TikTok"
            />
          </Field>
          <Field
            label="Slug"
            hint={
              slug
                ? `URL: funnel.trylovify.com/${slug}`
                : 'URL segment: funnel.trylovify.com/<slug>'
            }
          >
            <Input
              value={slugInput}
              onChange={(e) => {
                setSlugInput(e.target.value)
                setSlugTouched(true)
              }}
              placeholder="Lovify Music v1"
            />
            {slugError ? <p className="text-xs text-destructive">{slugError}</p> : null}
          </Field>
          <Field label="Description (internal)">
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="First live funnel for the spring TikTok campaign"
            />
          </Field>
          <div className="flex gap-2 pt-2">
            <Link to="/funnels" className="flex-1">
              <Button variant="outline" className="w-full">Cancel</Button>
            </Link>
            <Button onClick={handleSave} disabled={!canSave} className="flex-1">
              {create.isPending ? 'Creating…' : 'Create funnel'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function EditExisting({ funnel, steps }: { funnel: Funnel; steps: FunnelStep[] }) {
  const navigate = useNavigate()
  const [name, setName] = useState(funnel.name)
  const [description, setDescription] = useState(funnel.description ?? '')
  const [metaPixelId, setMetaPixelId] = useState(funnel.meta_pixel_id ?? '')
  const [planOptions, setPlanOptions] = useState<PlanOption[]>(funnel.plan_options ?? [])
  const [defaultPlanKey, setDefaultPlanKey] = useState<string | null>(funnel.default_plan_key ?? null)
  const [defaultInterval, setDefaultInterval] = useState<Funnel['default_interval']>(
    funnel.default_interval ?? null,
  )

  useEffect(() => {
    setName(funnel.name)
    setDescription(funnel.description ?? '')
    setMetaPixelId(funnel.meta_pixel_id ?? '')
    setPlanOptions(funnel.plan_options ?? [])
    setDefaultPlanKey(funnel.default_plan_key ?? null)
    setDefaultInterval(funnel.default_interval ?? null)
  }, [funnel])

  const updateFunnel = useUpdateFunnel()
  const createStep = useCreateStep()
  const updateStep = useUpdateStep()
  const deleteStep = useDeleteStep()
  const reorder = useReorderSteps()

  const [stepDialog, setStepDialog] = useState<
    | { mode: 'create' }
    | { mode: 'edit'; step: FunnelStep }
    | null
  >(null)
  const [confirmDeleteStep, setConfirmDeleteStep] = useState<FunnelStep | null>(null)

  const existingStepKeys = useMemo(() => steps.map((s) => s.step_key), [steps])
  const nextPosition = (steps[steps.length - 1]?.position ?? 0) + 1

  const handleSaveMeta = async () => {
    await updateFunnel.mutateAsync({
      id: funnel.id,
      slug: funnel.slug,
      patch: {
        name,
        description: description || null,
        meta_pixel_id: metaPixelId || null,
      },
    })
    toast.success('Meta saved')
  }

  const handleSavePlans = async () => {
    await updateFunnel.mutateAsync({
      id: funnel.id,
      slug: funnel.slug,
      patch: {
        plan_options: planOptions,
        default_plan_key: defaultPlanKey,
        default_interval: defaultInterval,
      },
    })
    toast.success('Plans saved')
  }

  const handleStepSave = async (draft: StepEditorDraft) => {
    try {
      if (stepDialog?.mode === 'create') {
        await createStep.mutateAsync({
          funnel_id: funnel.id,
          funnel_slug: funnel.slug,
          step_key: draft.step_key,
          step_type: draft.step_type,
          position: nextPosition,
          config: draft.config,
        })
      } else if (stepDialog?.mode === 'edit' && draft.id) {
        // step_key is deliberately NOT in the patch. Once a step is
        // created, its key is frozen — rewriting it orphans any
        // funnel_answers rows that reference the old key, breaks the
        // funnel's client-side cached links, and surfaces as
        // step_mismatch 400s on playback.
        await updateStep.mutateAsync({
          id: draft.id,
          funnel_id: funnel.id,
          funnel_slug: funnel.slug,
          patch: {
            config: draft.config,
          },
        })
      }
      toast.success('Step saved')
      setStepDialog(null)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save step')
    }
  }

  const handleDeleteStep = async () => {
    if (!confirmDeleteStep) return
    try {
      await deleteStep.mutateAsync({
        id: confirmDeleteStep.id,
        funnel_id: funnel.id,
        funnel_slug: funnel.slug,
      })
      toast.success('Step deleted')
      setConfirmDeleteStep(null)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete step')
    }
  }

  const handleReorder = async (orderedIds: string[]) => {
    try {
      await reorder.mutateAsync({
        funnel_id: funnel.id,
        funnel_slug: funnel.slug,
        step_ids: orderedIds,
      })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to reorder')
    }
  }

  const saving = updateFunnel.isPending

  // Tab state synced with the URL so refresh / deep-linking preserves the
  // chosen section. Steps goes first — that's what marketers come to touch.
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')
  const activeTab: 'steps' | 'plans' | 'meta' =
    tabParam === 'plans' || tabParam === 'meta' ? tabParam : 'steps'
  const setTab = (t: 'steps' | 'plans' | 'meta') => {
    const next = new URLSearchParams(searchParams)
    if (t === 'steps') next.delete('tab')
    else next.set('tab', t)
    setSearchParams(next, { replace: true })
  }

  const TABS: Array<{ id: 'steps' | 'plans' | 'meta'; label: string; count?: number }> = [
    { id: 'steps', label: 'Steps', count: steps.length },
    { id: 'plans', label: 'Plans', count: planOptions.length },
    { id: 'meta', label: 'Meta' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link to={`/funnels/${funnel.id}`} className="inline-flex items-center gap-2 text-sm text-tertiary hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to detail
        </Link>
        <Button onClick={() => navigate(`/funnels/${funnel.id}`)} variant="outline" size="sm">
          Done
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-foreground">Edit funnel</h1>
        <p className="mt-1 font-mono text-sm text-tertiary">/{funnel.slug}</p>
      </div>

      <div className="border-b border-border">
        <div className="flex gap-1" role="tablist">
          {TABS.map((t) => {
            const isActive = activeTab === t.id
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setTab(t.id)}
                className={cn(
                  'relative px-4 py-2.5 text-sm font-semibold transition-colors',
                  isActive
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <span className="inline-flex items-center gap-2">
                  {t.label}
                  {typeof t.count === 'number' ? (
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[11px] font-bold',
                        isActive ? 'bg-orange-500/15 text-orange-600' : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {t.count}
                    </span>
                  ) : null}
                </span>
                {isActive ? (
                  <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-gradient-to-r from-orange-500 to-rose-500" />
                ) : null}
              </button>
            )
          })}
        </div>
      </div>

      {activeTab === 'steps' ? (
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Steps</CardTitle>
            <Button size="sm" onClick={() => setStepDialog({ mode: 'create' })}>
              <Plus className="h-4 w-4" /> Add step
            </Button>
          </CardHeader>
          <CardContent>
            <StepList
              steps={steps}
              onEdit={(s) => setStepDialog({ mode: 'edit', step: s })}
              onDelete={(s) => setConfirmDeleteStep(s)}
              onReorder={handleReorder}
              busy={reorder.isPending}
            />
          </CardContent>
        </Card>
      ) : null}

      {activeTab === 'plans' ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Plans</CardTitle>
              <p className="text-xs text-tertiary">
                Toggle which plans end users can pick on the paywall. Set one as default.
              </p>
            </CardHeader>
            <CardContent>
              <PaywallPlanPicker
                value={planOptions}
                onChange={setPlanOptions}
                defaultPlanKey={defaultPlanKey}
                onDefaultChange={setDefaultPlanKey}
                defaultInterval={defaultInterval}
                onDefaultIntervalChange={setDefaultInterval}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSavePlans} disabled={saving}>
              {saving ? 'Saving…' : 'Save plans'}
            </Button>
          </div>
        </>
      ) : null}

      {activeTab === 'meta' ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Meta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Field label="Name">
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </Field>
              <Field label="Description (internal)">
                <Input value={description} onChange={(e) => setDescription(e.target.value)} />
              </Field>
              <Field label="Meta Pixel ID" hint="Leave blank to use the global fallback pixel.">
                <Input
                  value={metaPixelId}
                  onChange={(e) => setMetaPixelId(e.target.value)}
                  placeholder="123456789012345"
                  className="font-mono"
                />
              </Field>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSaveMeta} disabled={saving}>
              {saving ? 'Saving…' : 'Save meta'}
            </Button>
          </div>
        </>
      ) : null}

      <StepEditor
        open={!!stepDialog}
        onClose={() => setStepDialog(null)}
        onSave={handleStepSave}
        mode={stepDialog?.mode ?? 'create'}
        initial={stepDialog?.mode === 'edit' ? stepDialog.step : undefined}
        saving={createStep.isPending || updateStep.isPending}
        existingKeys={existingStepKeys}
        funnelName={name || funnel.name}
        funnelDefaults={{
          planOptions,
          defaultPlanKey,
          defaultInterval,
        }}
      />

      <ConfirmDialog
        open={!!confirmDeleteStep}
        onClose={() => setConfirmDeleteStep(null)}
        title="Delete step"
        description={`Delete "${confirmDeleteStep?.step_key}" and all answers collected on it?`}
        onConfirm={handleDeleteStep}
        confirmLabel="Delete"
        variant="destructive"
        loading={deleteStep.isPending}
      />
    </div>
  )
}
