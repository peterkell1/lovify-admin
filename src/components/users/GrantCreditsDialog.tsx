import { useState } from 'react'
import { Dialog, DialogHeader, DialogTitle, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { useGrantCredits } from '@/hooks/use-users'
import { toast } from 'sonner'

interface GrantCreditsDialogProps {
  open: boolean
  onClose: () => void
  userId: string
  userEmail: string | null
}

const QUICK_AMOUNTS = [50, 100, 200, 500, 1000]

export function GrantCreditsDialog({ open, onClose, userId, userEmail }: GrantCreditsDialogProps) {
  const [amount, setAmount] = useState('')
  const [type, setType] = useState('admin_grant')
  const [description, setDescription] = useState('')
  const grantCredits = useGrantCredits()

  const handleGrant = async () => {
    const numAmount = parseInt(amount, 10)
    if (!numAmount || numAmount <= 0) return

    try {
      await grantCredits.mutateAsync({
        userId,
        amount: numAmount,
        type,
        description: description || undefined,
      })
      toast.success(`Granted ${numAmount} credits to ${userEmail}`)
      setAmount('')
      setDescription('')
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to grant credits')
    }
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader onClose={onClose}>
        <DialogTitle>Grant Credits</DialogTitle>
      </DialogHeader>
      <DialogContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Granting credits to <span className="font-medium text-foreground">{userEmail}</span>
        </p>

        {/* Quick amounts */}
        <div className="flex flex-wrap gap-2">
          {QUICK_AMOUNTS.map((q) => (
            <Button
              key={q}
              variant={amount === String(q) ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAmount(String(q))}
            >
              +{q}
            </Button>
          ))}
        </div>

        {/* Custom amount */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Amount</label>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Custom amount"
            min={1}
          />
        </div>

        {/* Type */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Transaction Type</label>
          <Select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="admin_grant">Admin Grant</option>
            <option value="refund">Refund</option>
            <option value="compensation">Compensation</option>
            <option value="promo">Promo</option>
          </Select>
        </div>

        {/* Reason */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Reason (optional)</label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Why are you granting these credits?"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleGrant}
            disabled={!amount || parseInt(amount) <= 0 || grantCredits.isPending}
            className="flex-1"
          >
            {grantCredits.isPending ? 'Granting...' : `Grant ${amount || 0} credits`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
