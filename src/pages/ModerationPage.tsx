import { Card, CardContent } from '@/components/ui/card'
import { Shield } from 'lucide-react'

export default function ModerationPage() {
  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Moderation</h1>
        <p className="text-tertiary text-sm mt-1">Content moderation and takedown management</p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-20">
          <div className="h-14 w-14 rounded-2xl bg-accent/10 text-accent flex items-center justify-center mb-4">
            <Shield className="h-7 w-7" />
          </div>
          <p className="text-tertiary font-medium">Moderation tools coming in Phase 3</p>
        </CardContent>
      </Card>
    </div>
  )
}
