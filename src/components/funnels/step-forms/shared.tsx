import { useState, type Dispatch, type SetStateAction } from 'react'
import { ChevronUp, Image, Plus, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { QuizOption } from '@/types/funnels'
import { EmojiInput } from '../EmojiInput'
import { AssetPicker } from '../AssetPicker'
import { resolveAdminAssetUrl } from '@/lib/asset-manifest'

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
  withImage = false,
}: {
  options: QuizOption[]
  setOptions: Dispatch<SetStateAction<QuizOption[]>>
  withEmoji?: boolean
  withImage?: boolean
}) {
  const [expandedImg, setExpandedImg] = useState<number | null>(null)
  const [pickerOpen, setPickerOpen] = useState<number | null>(null)

  const update = (i: number, patch: Partial<QuizOption>) => {
    setOptions((curr) => curr.map((o, idx) => (idx === i ? { ...o, ...patch } : o)))
  }
  const remove = (i: number) => {
    setExpandedImg(null)
    setPickerOpen(null)
    setOptions((curr) => curr.filter((_, idx) => idx !== i))
  }
  const add = () => setOptions((curr) => [...curr, { value: '', label: '' }])

  return (
    <div className="space-y-2">
      {options.map((opt, i) => {
        const hasImage = !!(opt.image_asset_key || opt.character_image_url)
        const previewUrl = opt.image_asset_key
          ? resolveAdminAssetUrl(opt.image_asset_key)
          : opt.character_image_url ?? null
        return (
          <div key={i} className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="flex items-center gap-2 p-2">
              {withEmoji ? (
                <EmojiInput
                  value={opt.emoji ?? ''}
                  onChange={(next) => update(i, { emoji: next })}
                  ariaLabel={`Emoji for option ${i + 1}`}
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
              {withImage ? (
                <button
                  type="button"
                  title="Pick image from library"
                  onClick={() => setExpandedImg(expandedImg === i ? null : i)}
                  className={
                    'rounded-md p-2 transition-colors ' +
                    (hasImage
                      ? 'text-blue-600 hover:bg-blue-50'
                      : 'text-muted-foreground hover:bg-muted')
                  }
                >
                  {expandedImg === i ? <ChevronUp className="h-4 w-4" /> : <Image className="h-4 w-4" />}
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => remove(i)}
                className="rounded-md p-2 text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            {withImage && expandedImg === i ? (
              <div className="px-3 pb-3 pt-2 border-t border-border bg-muted/30 flex items-center gap-3">
                <div className="h-14 w-10 shrink-0 rounded-md border border-border bg-background overflow-hidden flex items-center justify-center">
                  {previewUrl ? (
                    <img src={previewUrl} alt="" className="h-full w-full object-cover object-top" />
                  ) : (
                    <Image className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-[11px] text-muted-foreground truncate">
                    {opt.image_asset_key ?? opt.character_image_url ?? 'No image set'}
                  </p>
                </div>
                <Button type="button" size="sm" variant="outline" onClick={() => setPickerOpen(i)}>
                  {hasImage ? 'Change' : 'Choose'}
                </Button>
                {hasImage ? (
                  <button
                    type="button"
                    onClick={() => update(i, { image_asset_key: undefined, character_image_url: undefined })}
                    className="rounded-md p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                ) : null}
                <AssetPicker
                  open={pickerOpen === i}
                  onClose={() => setPickerOpen(null)}
                  onPick={(key) => {
                    update(i, { image_asset_key: key, character_image_url: undefined })
                    setPickerOpen(null)
                  }}
                />
              </div>
            ) : null}
          </div>
        )
      })}
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
