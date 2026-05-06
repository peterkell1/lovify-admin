import { type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface MissingDataCardProps {
  title: string
  reason: string
  hint?: string
  icon?: ReactNode
  className?: string
}

export function MissingDataCard({ title, reason, hint, icon, className }: MissingDataCardProps) {
  return (
    <Card className={cn('border-dashed', className)}>
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-lg bg-muted text-muted-foreground flex items-center justify-center shrink-0">
            {icon ?? <AlertTriangle className="h-4 w-4" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">{title}</p>
            <p className="text-xs text-muted-foreground mt-1">{reason}</p>
            {hint && <p className="text-xs text-tertiary mt-2">{hint}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
