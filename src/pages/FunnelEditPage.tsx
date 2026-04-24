import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Plus } from 'lucide-react'
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

const slugRegex = /^[a-z0-9-]+$/

export default function FunnelEditPage({ mode }: Props) {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  if (mode === 'create') return <CreateFunnelForm onCreated={(f) => navigate(`/funnels/${f.id}/edit`)} />

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
  const [slug, setSlug] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const create = useCreateFunnel()

  const slugError = slug && !slugRegex.test(slug) ? 'Lowercase letters, numbers, and dashes only' : null
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
              onChange={(e) => setName(e.target.value)}
              placeholder="Lovify Music — Spring TikTok"
            />
          </Field>
          <Field label="Slug" hint="URL segment: funnel.trylovify.com/<slug>">
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase())}
              placeholder="lovify-music-v1"
              className="font-mono"
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

  useEffect(() => {
    setName(funnel.name)
    setDescription(funnel.description ?? '')
    setMetaPixelId(funnel.meta_pixel_id ?? '')
    setPlanOptions(funnel.plan_options ?? [])
    setDefaultPlanKey(funnel.default_plan_key ?? null)
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
        plan_options: planOptions,
        default_plan_key: defaultPlanKey,
      },
    })
    toast.success('Funnel saved')
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
        await updateStep.mutateAsync({
          id: draft.id,
          funnel_id: funnel.id,
          funnel_slug: funnel.slug,
          patch: {
            step_key: draft.step_key,
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

  const handleMove = async (step: FunnelStep, dir: 'up' | 'down') => {
    const idx = steps.findIndex((s) => s.id === step.id)
    const target = dir === 'up' ? steps[idx - 1] : steps[idx + 1]
    if (!target) return
    try {
      await reorder.mutateAsync({
        funnel_id: funnel.id,
        funnel_slug: funnel.slug,
        a: { id: step.id, position: step.position },
        b: { id: target.id, position: target.position },
      })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to reorder')
    }
  }

  const saving = updateFunnel.isPending

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

      <Card>
        <CardHeader>
          <CardTitle>Plans</CardTitle>
          <p className="text-xs text-tertiary">
            Paste Stripe Price IDs. Paywall steps choose from these by plan key.
          </p>
        </CardHeader>
        <CardContent>
          <PaywallPlanPicker
            value={planOptions}
            onChange={setPlanOptions}
            defaultPlanKey={defaultPlanKey}
            onDefaultChange={setDefaultPlanKey}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSaveMeta} disabled={saving}>
          {saving ? 'Saving…' : 'Save meta + plans'}
        </Button>
      </div>

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
            onMove={handleMove}
            busy={reorder.isPending}
          />
        </CardContent>
      </Card>

      <StepEditor
        open={!!stepDialog}
        onClose={() => setStepDialog(null)}
        onSave={handleStepSave}
        mode={stepDialog?.mode ?? 'create'}
        initial={stepDialog?.mode === 'edit' ? stepDialog.step : undefined}
        saving={createStep.isPending || updateStep.isPending}
        existingKeys={existingStepKeys}
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
