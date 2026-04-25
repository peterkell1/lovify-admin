import { useEffect, useMemo, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Dialog, DialogHeader, DialogTitle, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Field } from './step-forms/shared'
import { STEP_FORMS, defaultConfigFor } from './step-forms'
import type { Funnel, FunnelStep, PlanOption, StepType } from '@/types/funnels'
import { StepPreview } from './preview/StepPreview'
import { cn } from '@/lib/utils'
import {
  STEP_PRESETS,
  STEP_PRESET_GROUP_LABEL,
  findPreset,
  generateStepKey,
  type StepPreset,
  type StepPresetGroup,
} from '@/config/step-presets'

export type StepEditorFunnelDefaults = {
  planOptions: PlanOption[]
  defaultPlanKey: string | null
  defaultInterval: Funnel['default_interval']
}

export type StepEditorDraft = {
  id?: string
  step_key: string
  step_type: StepType
  config: Record<string, unknown>
}

const PREVIEW_PREF_KEY = 'funnel.step-editor.preview'

// Marketer picks a preset by id. On edit, we resolve the step's
// current (step_type + step_key) back to the preset it most likely
// came from so the dropdown shows the right label — but the selector
// is locked in edit mode either way.
function matchPresetForStep(step: Partial<FunnelStep> | undefined): StepPreset | undefined {
  if (!step) return undefined
  // Prefer an exact fixedKey match (magic presets).
  const byKey = STEP_PRESETS.find(
    (p) => p.fixedKey === step.step_key && p.stepType === step.step_type,
  )
  if (byKey) return byKey
  // Otherwise, first custom preset for the step_type.
  return STEP_PRESETS.find(
    (p) => p.stepType === step.step_type && !p.fixedKey,
  )
}

const GROUP_ORDER: StepPresetGroup[] = ['standard-quiz', 'content', 'system', 'custom']

export function StepEditor({
  open,
  onClose,
  onSave,
  initial,
  mode,
  saving,
  existingKeys,
  funnelName,
  funnelDefaults,
}: {
  open: boolean
  onClose: () => void
  onSave: (draft: StepEditorDraft) => void
  initial?: Partial<FunnelStep>
  mode: 'create' | 'edit'
  saving: boolean
  existingKeys: string[]
  funnelName: string
  funnelDefaults: StepEditorFunnelDefaults
}) {
  const defaultPresetId = useMemo(() => {
    if (mode === 'edit') {
      const matched = matchPresetForStep(initial)
      if (matched) return matched.id
    }
    // Default to a content preset on create — first available "welcome" or the first entry.
    return STEP_PRESETS.find((p) => !alreadyUsed(p, existingKeys))?.id ?? STEP_PRESETS[0].id
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial?.id, mode])

  const [presetId, setPresetId] = useState(defaultPresetId)
  const preset = findPreset(presetId) ?? STEP_PRESETS[0]

  const [config, setConfig] = useState<Record<string, unknown>>(() => {
    if (mode === 'edit' && initial?.config) return initial.config
    return { ...defaultConfigFor(preset.stepType), ...(preset.configPatch ?? {}) }
  })

  const [showPreview, setShowPreview] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true
    const stored = window.localStorage.getItem(PREVIEW_PREF_KEY)
    return stored === null ? true : stored === '1'
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(PREVIEW_PREF_KEY, showPreview ? '1' : '0')
    }
  }, [showPreview])

  // Reset state every time the dialog opens. In create mode `initial?.id`
  // is undefined and never changes between opens, so we can't depend on
  // it — without this, two consecutive "Add step" clicks reuse the last
  // session's config and the new dialog renders e.g. gender's options
  // under a goals preset.
  useEffect(() => {
    if (!open) return
    const resolved =
      mode === 'edit'
        ? matchPresetForStep(initial)?.id ?? STEP_PRESETS[0].id
        : STEP_PRESETS.find((p) => !alreadyUsed(p, existingKeys))?.id ?? STEP_PRESETS[0].id
    setPresetId(resolved)
    const p = findPreset(resolved) ?? STEP_PRESETS[0]
    setConfig(
      mode === 'edit' && initial?.config
        ? initial.config
        : { ...defaultConfigFor(p.stepType), ...(p.configPatch ?? {}) },
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, initial?.id])

  const handlePresetChange = (nextId: string) => {
    const next = findPreset(nextId)
    if (!next) return
    setPresetId(nextId)
    setConfig({ ...defaultConfigFor(next.stepType), ...(next.configPatch ?? {}) })
  }

  // Grouped options for the preset dropdown. Magic presets already used on
  // the funnel are disabled so marketers can't create collisions.
  const groupedOptions = useMemo(() => {
    const groups: Record<StepPresetGroup, StepPreset[]> = {
      'standard-quiz': [],
      content: [],
      system: [],
      custom: [],
    }
    for (const p of STEP_PRESETS) groups[p.group].push(p)
    return GROUP_ORDER.map((g) => ({ group: g, presets: groups[g] }))
  }, [])

  const FormComponent = STEP_FORMS[preset.stepType]

  // Resolve the final step_key at save time so we always pick something
  // unique — marketers never see or type it.
  const resolvedStepKey = useMemo(() => {
    if (mode === 'edit' && initial?.step_key) return initial.step_key
    const title = typeof config.title === 'string' ? config.title : ''
    // When generating, exclude the one we're about to write so we don't
    // collide with ourselves (this mostly matters for edit flows, kept
    // defensive here).
    const existingExcludingSelf = existingKeys.filter((k) => k !== initial?.step_key)
    return generateStepKey(preset, title, existingExcludingSelf)
  }, [mode, initial?.step_key, config, preset, existingKeys])

  const isDuplicate =
    mode === 'create' &&
    preset.fixedKey != null &&
    existingKeys.includes(preset.fixedKey)

  const canSave = !isDuplicate && !saving

  return (
    <Dialog
      open={open}
      onClose={onClose}
      dismissOnBackdropClick={false}
      className={cn(
        'transition-[max-width] duration-300 ease-out',
        showPreview ? 'max-w-5xl' : 'max-w-2xl',
      )}
    >
      <DialogHeader onClose={onClose}>
        <div className="flex w-full items-center justify-between gap-3">
          <DialogTitle>{mode === 'create' ? 'Add step' : 'Edit step'}</DialogTitle>
          <button
            type="button"
            onClick={() => setShowPreview((v) => !v)}
            aria-pressed={showPreview}
            className="ml-auto inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors"
          >
            <span className="relative inline-flex h-3.5 w-3.5">
              <Eye
                className={cn(
                  'absolute inset-0 h-3.5 w-3.5 transition-all duration-200',
                  showPreview ? 'opacity-0 scale-75' : 'opacity-100 scale-100',
                )}
              />
              <EyeOff
                className={cn(
                  'absolute inset-0 h-3.5 w-3.5 transition-all duration-200',
                  showPreview ? 'opacity-100 scale-100' : 'opacity-0 scale-75',
                )}
              />
            </span>
            {showPreview ? 'Hide preview' : 'Show preview'}
          </button>
        </div>
      </DialogHeader>
      <DialogContent className="p-0">
        <div
          className={cn(
            'grid gap-0 transition-[grid-template-columns] duration-300 ease-out',
            showPreview
              ? 'md:grid-cols-[minmax(0,1fr)_minmax(0,400px)]'
              : 'md:grid-cols-[minmax(0,1fr)_0fr]',
          )}
        >
          {/* Form column */}
          <div className="space-y-4 p-6 overflow-y-auto max-h-[75vh]">
            <Field
              label="Step"
              hint={
                preset.description
                  ? preset.description
                  : 'Pick a preset to seed sensible defaults.'
              }
            >
              <Select
                value={presetId}
                disabled={mode === 'edit'}
                onChange={(e) => handlePresetChange(e.target.value)}
              >
                {groupedOptions.map(({ group, presets }) => (
                  <optgroup key={group} label={STEP_PRESET_GROUP_LABEL[group]}>
                    {presets.map((p) => {
                      const used = alreadyUsed(p, existingKeys) && p.id !== presetId
                      return (
                        <option key={p.id} value={p.id} disabled={used}>
                          {p.label}
                          {used ? ' — already added' : ''}
                        </option>
                      )
                    })}
                  </optgroup>
                ))}
              </Select>
            </Field>

            {isDuplicate ? (
              <p className="-mt-2 text-xs text-destructive">
                This step is already on the funnel. Edit it from the list instead.
              </p>
            ) : null}

            <div className="border-t border-border pt-4 space-y-3">
              <FormComponent value={config} onChange={setConfig} />
            </div>

            <div className="flex gap-2 border-t border-border pt-4">
              <Button variant="outline" onClick={onClose} className="flex-1" disabled={saving}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!canSave) return
                  onSave({
                    id: initial?.id,
                    step_key: resolvedStepKey,
                    step_type: preset.stepType,
                    config,
                  })
                }}
                className="flex-1"
                disabled={!canSave}
              >
                {saving ? 'Saving…' : 'Save step'}
              </Button>
            </div>
          </div>

          {/* Preview column */}
          <div
            aria-hidden={!showPreview}
            className={cn(
              'overflow-hidden border-t md:border-t-0 md:border-l border-border bg-background/60 transition-opacity duration-300',
              showPreview ? 'opacity-100' : 'opacity-0 pointer-events-none',
            )}
          >
            <div className="p-6 flex flex-col items-center min-w-[360px]">
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-3">
                Live preview
              </p>
              <div className="w-full flex-1 flex items-start justify-center">
                <StepPreview
                  stepType={preset.stepType}
                  config={config}
                  stepKey={resolvedStepKey}
                  funnelName={funnelName}
                  funnelDefaults={funnelDefaults}
                />
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Magic presets and system presets (paywall, success) can only appear once
// per funnel. Custom presets and content presets without a fixedKey can be
// added any number of times.
function alreadyUsed(preset: StepPreset, existingKeys: string[]): boolean {
  if (!preset.fixedKey) return false
  return existingKeys.includes(preset.fixedKey)
}
