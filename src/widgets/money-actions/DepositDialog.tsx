import { useState } from 'react'
import { Undo2Icon } from 'lucide-react'
import { formatMoney } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Dialog, DialogBody, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/shadcn/dialog'
import { Input } from '@/shared/ui/shadcn/input'
import { Label } from '@/shared/ui/shadcn/label'
import { Textarea } from '@/shared/ui/shadcn/textarea'

type DepositDialogProps = {
  trigger: React.ReactElement
  record: string
  guest: string
  amount: number
}

// Залог — деньги гостя: вернуть целиком или удержать часть, но удержание всегда с причиной, которую увидит гость
export const DepositDialog = ({ trigger, record, guest, amount }: DepositDialogProps) => {
  const [mode, setMode] = useState<'full' | 'partial'>('full')
  const [withheld, setWithheld] = useState('')
  const [reason, setReason] = useState('')
  const kept = Math.min(Number(withheld.replace(/\D/g, '')) || 0, amount)
  const ready = mode === 'full' || (kept > 0 && reason.trim().length >= 5)

  return (
    <Dialog onOpenChange={(open) => !open && setMode('full')}>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="gap-2">
          <span className="mono-label text-smoke">Залог · {record}</span>
          <DialogTitle className="section-heading text-heading-sm">Вернуть залог {formatMoney(amount)}</DialogTitle>
          <DialogDescription className="text-body-sm text-slate">{guest} получит сообщение с суммой возврата и причиной удержания, если оно есть.</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Как вернуть">
            {(
              [
                ['full', 'Вернуть полностью'],
                ['partial', 'Удержать часть'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={mode === value}
                onClick={() => setMode(value)}
                className={cn(
                  'h-12 rounded-2xl text-body-sm font-medium outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/30',
                  mode === value ? 'bg-foreground text-background' : 'bg-mist hover:bg-ash/40',
                )}
              >
                {label}
              </button>
            ))}
          </div>
          {mode === 'partial' && (
            <>
              <div className="flex flex-col gap-2">
                <Label htmlFor="deposit-kept" className="text-body-sm font-medium">
                  Удержать, ₽
                </Label>
                <Input id="deposit-kept" inputMode="numeric" value={withheld} onChange={(event) => setWithheld(event.target.value)} placeholder="1500" className="tabular-nums" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="deposit-reason" className="text-body-sm font-medium">
                  Причина для гостя
                </Label>
                <Textarea
                  id="deposit-reason"
                  rows={2}
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Например, разбит бокал и пятно на диване — химчистка 1 500 ₽"
                />
              </div>
            </>
          )}
          <dl className="flex flex-col gap-2 rounded-3xl bg-mist p-4 text-body-sm">
            <div className="flex justify-between">
              <dt className="text-slate">Залог</dt>
              <dd className="tabular-nums">{formatMoney(amount)}</dd>
            </div>
            {mode === 'partial' && (
              <div className="flex justify-between">
                <dt className="text-slate">Удерживается</dt>
                <dd className="tabular-nums">−{formatMoney(kept)}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-foreground/10 pt-2 font-medium">
              <dt>Вернуть гостю</dt>
              <dd className="tabular-nums">{formatMoney(mode === 'full' ? amount : amount - kept)}</dd>
            </div>
          </dl>
        </DialogBody>
        <DialogFooter className="gap-2">
          <DialogClose render={<Button variant="ghost" />}>Отмена</DialogClose>
          <Button className="shadow-control" disabled={!ready}>
            <Undo2Icon /> Отметить возврат
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
