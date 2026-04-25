import { ArrowUp, ArrowDown, Edit, GripVertical, Trash2 } from 'lucide-react'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Badge } from '@/components/ui/badge'
import type { FunnelStep } from '@/types/funnels'
import { STEP_TYPE_LABEL } from '@/types/funnels'
import { cn } from '@/lib/utils'

export function StepList({
  steps,
  onEdit,
  onDelete,
  onReorder,
  busy,
}: {
  steps: FunnelStep[]
  onEdit: (step: FunnelStep) => void
  onDelete: (step: FunnelStep) => void
  // Called with the full ordered list of step ids after a drop or
  // arrow-button move. Parent persists via the bulk reorder hook.
  onReorder: (orderedIds: string[]) => void
  busy: boolean
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Don't start a drag from a tiny accidental click on the row;
      // require a few pixels of movement first.
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const oldIndex = steps.findIndex((s) => s.id === active.id)
    const newIndex = steps.findIndex((s) => s.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return
    onReorder(arrayMove(steps, oldIndex, newIndex).map((s) => s.id))
  }

  const handleArrowMove = (i: number, dir: 'up' | 'down') => {
    const target = dir === 'up' ? i - 1 : i + 1
    if (target < 0 || target >= steps.length) return
    onReorder(arrayMove(steps, i, target).map((s) => s.id))
  }

  if (steps.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-tertiary">
        No steps yet. Add your first step to build the funnel flow.
      </div>
    )
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={steps.map((s) => s.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {steps.map((s, i) => (
            <SortableStepRow
              key={s.id}
              step={s}
              index={i}
              total={steps.length}
              busy={busy}
              onEdit={onEdit}
              onDelete={onDelete}
              onArrowMove={handleArrowMove}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}

function SortableStepRow({
  step,
  index,
  total,
  busy,
  onEdit,
  onDelete,
  onArrowMove,
}: {
  step: FunnelStep
  index: number
  total: number
  busy: boolean
  onEdit: (s: FunnelStep) => void
  onDelete: (s: FunnelStep) => void
  onArrowMove: (i: number, dir: 'up' | 'down') => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: step.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-2 py-3',
        isDragging && 'opacity-60 shadow-lg ring-2 ring-orange-400/40',
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
          className="touch-none cursor-grab active:cursor-grabbing rounded-md p-1.5 text-tertiary hover:bg-secondary hover:text-foreground"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-xs font-bold">
          {step.position}
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground truncate">
              {(step.config as { title?: string }).title ?? step.step_key}
            </span>
            <Badge variant="outline">{STEP_TYPE_LABEL[step.step_type]}</Badge>
          </div>
          <p className="mt-0.5 font-mono text-xs text-tertiary">{step.step_key}</p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onArrowMove(index, 'up')}
          disabled={busy || index === 0}
          className="rounded-md p-2 text-tertiary hover:bg-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
          aria-label="Move step up"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
        <button
          onClick={() => onArrowMove(index, 'down')}
          disabled={busy || index === total - 1}
          className="rounded-md p-2 text-tertiary hover:bg-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
          aria-label="Move step down"
        >
          <ArrowDown className="h-4 w-4" />
        </button>
        <button
          onClick={() => onEdit(step)}
          className="rounded-md p-2 text-tertiary hover:bg-secondary hover:text-foreground"
          aria-label="Edit step"
        >
          <Edit className="h-4 w-4" />
        </button>
        <button
          onClick={() => onDelete(step)}
          className="rounded-md p-2 text-destructive hover:bg-destructive/10"
          aria-label="Delete step"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
