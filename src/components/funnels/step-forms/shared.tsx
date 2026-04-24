import type { Dispatch, SetStateAction } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { QuizOption } from '@/types/funnels'

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-semibold text-foreground">{label}</span>
      {children}
      {hint ? <p className="text-xs text-tertiary">{hint}</p> : null}
    </label>
  )
}

export function OptionList({
  options,
  setOptions,
  withEmoji = true,
}: {
  options: QuizOption[]
  setOptions: Dispatch<SetStateAction<QuizOption[]>>
  withEmoji?: boolean
}) {
  const update = (i: number, patch: Partial<QuizOption>) => {
    setOptions((curr) => curr.map((o, idx) => (idx === i ? { ...o, ...patch } : o)))
  }
  const remove = (i: number) => setOptions((curr) => curr.filter((_, idx) => idx !== i))
  const add = () => setOptions((curr) => [...curr, { value: '', label: '' }])

  return (
    <div className="space-y-2">
      {options.map((opt, i) => (
        <div
          key={i}
          className="flex items-center gap-2 rounded-lg border border-border bg-card p-2"
        >
          {withEmoji ? (
            <Input
              placeholder="🙂"
              value={opt.emoji ?? ''}
              onChange={(e) => update(i, { emoji: e.target.value })}
              className="w-14 text-center"
            />
          ) : null}
          <Input
            placeholder="value"
            value={opt.value}
            onChange={(e) => update(i, { value: e.target.value, label: opt.label || e.target.value })}
            className="flex-1 font-mono text-xs"
          />
          <Input
            placeholder="label"
            value={opt.label}
            onChange={(e) => update(i, { label: e.target.value })}
            className="flex-1"
          />
          <button
            onClick={() => remove(i)}
            className="rounded-md p-2 text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={add} type="button">
        <Plus className="h-3 w-3" /> Add option
      </Button>
    </div>
  )
}

export function StringListInput({
  values,
  setValues,
  placeholder,
}: {
  values: string[]
  setValues: Dispatch<SetStateAction<string[]>>
  placeholder?: string
}) {
  return (
    <div className="space-y-2">
      {values.map((v, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input
            value={v}
            onChange={(e) =>
              setValues((curr) => curr.map((x, idx) => (idx === i ? e.target.value : x)))
            }
            placeholder={placeholder}
            className="flex-1"
          />
          <button
            type="button"
            onClick={() => setValues((curr) => curr.filter((_, idx) => idx !== i))}
            className="rounded-md p-2 text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        type="button"
        onClick={() => setValues((curr) => [...curr, ''])}
      >
        <Plus className="h-3 w-3" /> Add
      </Button>
    </div>
  )
}
