import { useState } from 'react'
import { ArrowRightIcon, HistoryIcon } from 'lucide-react'
import { formatMoney } from '@/shared/lib/format'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Dialog, DialogBody, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/shadcn/dialog'
import { Input } from '@/shared/ui/shadcn/input'
import { Label } from '@/shared/ui/shadcn/label'
import { Textarea } from '@/shared/ui/shadcn/textarea'

type CorrectPaymentDialogProps = {
  trigger: React.ReactElement
  record: string
  amount: number
  confirmedBy: string
}

// Исправление — не правка задним числом (§4.6): исходная запись остаётся в истории, рядом появляется корректировка с причиной
export const CorrectPaymentDialog = ({ trigger, record, amount, confirmedBy }: CorrectPaymentDialogProps) => {
  const [next, setNext] = useState(String(amount))
  const [reason, setReason] = useState('')
  const value = Number(next.replace(/\D/g, '')) || 0
  const changed = value !== amount

  return (
    <Dialog
      onOpenChange={(open) => {
        if (!open) {
          setNext(String(amount))
          setReason('')
        }
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="gap-2">
          <span className="mono-label text-smoke">Корректировка · {record}</span>
          <DialogTitle className="section-heading text-heading-sm">Исправить поступление</DialogTitle>
          <DialogDescription className="text-body-sm text-slate">
            Подтвердил {confirmedBy}. Исходная сумма не удаляется: в истории останутся обе записи и ваша причина.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
            <div className="flex flex-col gap-2">
              <span className="text-body-sm font-medium">Было</span>
              <span className="flex h-11 items-center rounded-lg bg-mist px-3 text-body tabular-nums text-smoke line-through">{formatMoney(amount)}</span>
            </div>
            <ArrowRightIcon className="mb-3.5 size-4 text-smoke" aria-hidden />
            <div className="flex flex-col gap-2">
              <Label htmlFor="correct-amount" className="text-body-sm font-medium">
                Стало, ₽
              </Label>
              <Input id="correct-amount" inputMode="numeric" value={next} onChange={(event) => setNext(event.target.value)} className="tabular-nums" />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="correct-reason" className="text-body-sm font-medium">
              Причина — обязательно
            </Label>
            <Textarea
              id="correct-reason"
              rows={3}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Например, гость перевёл двумя частями, вторую 800 ₽ — позже"
            />
          </div>
          <p className="flex items-start gap-2 rounded-2xl bg-mist p-3 text-body-sm text-slate">
            <HistoryIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
            Остаток по брони пересчитается, гость получит обновлённый расчёт.
          </p>
        </DialogBody>
        <DialogFooter className="gap-2">
          <DialogClose render={<Button variant="ghost" />}>Отмена</DialogClose>
          <Button className="shadow-control" disabled={!changed || reason.trim().length < 5}>
            Сохранить корректировку
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
