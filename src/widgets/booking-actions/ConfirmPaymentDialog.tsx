import { BanknoteIcon } from 'lucide-react'
import { useState } from 'react'
import { DEMO_TZ, formatMoney } from '@/shared/lib/format'
import { MetaItem } from '@/shared/ui/rb/Section'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Checkbox } from '@/shared/ui/shadcn/animate-ui/components/radix/checkbox'
import { Dialog, DialogBody, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/shadcn/dialog'

type ConfirmPaymentDialogProps = {
  trigger: React.ReactElement
  record: string
  property: string
  amount: number
  purpose: string
  claimedAt: string
}

// Подтверждение денег — юридически значимое действие: бронь, объект, сумма и назначение названы явно,
// а кнопка активна только после отметки «проверил поступление»
export const ConfirmPaymentDialog = ({ trigger, record, property, amount, purpose, claimedAt }: ConfirmPaymentDialogProps) => {
  const [checked, setChecked] = useState(false)

  return (
    <Dialog onOpenChange={(open) => !open && setChecked(false)}>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="gap-2">
          <span className="mono-label text-smoke">Поступление денег</span>
          <DialogTitle className="section-heading text-heading-sm">Подтвердить {formatMoney(amount)}?</DialogTitle>
          <DialogDescription className="text-body-sm text-slate">
            Подтверждайте только после того, как увидели перевод в банке. Гость получит уведомление, удержание станет бронью.
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          <dl className="bg-mist grid grid-cols-2 gap-4 rounded-3xl p-5">
            <MetaItem label="Запись">{record}</MetaItem>
            <MetaItem label="Объект">{property}</MetaItem>
            <MetaItem label="Сумма">
              <span className="text-subheading-lg tabular-nums">{formatMoney(amount)}</span>
            </MetaItem>
            <MetaItem label="Назначение">{purpose}</MetaItem>
            <MetaItem label="Гость сообщил" className="col-span-2">
              {claimedAt} {DEMO_TZ}
            </MetaItem>
          </dl>

          <label className="text-body-sm flex cursor-pointer items-start gap-3 rounded-2xl p-1">
            <Checkbox checked={checked} onCheckedChange={(value) => setChecked(value === true)} className="mt-0.5" />Я проверил поступление{' '}
            {formatMoney(amount)} на счёт организации
          </label>
        </DialogBody>
        <DialogFooter className="gap-2">
          <DialogClose render={<Button variant="ghost" />}>Не сейчас</DialogClose>
          <Button disabled={!checked} className="shadow-control">
            <BanknoteIcon /> Подтвердить поступление
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
