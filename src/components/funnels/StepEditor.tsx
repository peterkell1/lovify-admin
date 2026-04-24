import { useEffect, useState } from 'react'
import { Dialog, DialogHeader, DialogTitle, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Field } from './step-forms/shared'
import { STEP_FORMS, defaultConfigFor } from './step-forms'
import { STEP_TYPES, STEP_TYPE_LABEL } from '@/types/funnels'
import type { FunnelStep, StepType } from '@/types/funnels'

export type StepEditorDraft = {
  id?: string
  step_key: string
  step_type: StepType
  config: Record<string, unknown>
}

export function StepEditor({
  open,
  onClose,
  onSave,
  initial,
  mode,
  saving,
  existingKeys,
}: {
  open: boolean
  onClose: () => void
  onSave: (draft: StepEditorDraft) => void
  initial?: Partial<FunnelStep>
  mode: 'create' | 'edit'
  saving: boolean
  existingKeys: string[]
}) {
  const [stepKey, setStepKey] = useState(initial?.step_key ?? '')
  const [stepType, setStepType] = useState<StepType>((initial?.step_type as StepType) ?? 'welcome')
  const [config, setConfig] = useState<Record<string, unknown>>(
    initial?.config ?? defaultConfigFor(stepType),
  )

  useEffect(() => {
    if (open) {
      setStepKey(initial?.step_key ?? '')
      setStepType((initial?.step_type as StepType) ?? 'welcome')
      setConfig(initial?.config ?? defaultConfigFor((initial?.step_type as StepType) ?? 'welcome'))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial?.id])

  const handleTypeChange = (next: StepType) => {
    setStepType(next)
    // Reset config to the default shape for the new type — otherwise stale
    // fields from the previous type would leak into the JSONB row.
    setConfig(defaultConfigFor(next))
  }

  const FormComponent = STEP_FORMS[stepType]

  const keyError =
    !stepKey.trim()
      ? 'Step key is required'
      : !/^[a-z0-9_-]+$/.test(stepKey)
      ? 'Lowercase letters, numbers, dash and underscore only'
      : mode === 'create' && existingKeys.includes(stepKey)
      ? 'This step key already exists in the funnel'
      : mode === 'edit' &&
        existingKeys.filter((k) => k !== initial?.step_key).includes(stepKey)
      ? 'This step key already exists in the funnel'
      : null

  const canSave = !keyError && !saving

  return (
    <Dialog open={open} onClose={onClose} className="max-w-2xl">
      <DialogHeader onClose={onClose}>
        <DialogTitle>{mode === 'create' ? 'Add step' : 'Edit step'}</DialogTitle>
      </DialogHeader>
      <DialogContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Step key" hint="URL segment within the funnel">
            <Input
              value={stepKey}
              onChange={(e) => setStepKey(e.target.value)}
              placeholder="mindset"
              className="font-mono"
            />
            {keyError ? <p className="mt-1 text-xs text-destructive">{keyError}</p> : null}
          </Field>
          <Field label="Step type">
            <Select
              value={stepType}
              disabled={mode === 'edit'}
              onChange={(e) => handleTypeChange(e.target.value as StepType)}
            >
              {STEP_TYPES.map((t) => (
                <option key={t} value={t}>
                  {STEP_TYPE_LABEL[t]}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="border-t border-border pt-4 space-y-3">
          <FormComponent value={config} onChange={setConfig} />
        </div>

        <div className="flex gap-2 border-t border-border pt-4">
          <Button variant="outline" onClick={onClose} className="flex-1" disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={() =>
              onSave({
                id: initial?.id,
                step_key: stepKey.trim(),
                step_type: stepType,
                config,
              })
            }
            className="flex-1"
            disabled={!canSave}
          >
            {saving ? 'Saving…' : 'Save step'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
