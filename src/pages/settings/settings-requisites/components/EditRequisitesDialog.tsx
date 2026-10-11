import { HourglassIcon, ShieldCheckIcon } from 'lucide-react'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Dialog, DialogBody, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/shadcn/dialog'
import { Input } from '@/shared/ui/shadcn/input'
import { Label } from '@/shared/ui/shadcn/label'

type Requisites = { phone: string; bank: string; recipient: string }

// Смена реквизитов — самое чувствительное в организации: показываем, кого она затронет, и не трогаем уже выданные удержания
export const EditRequisitesDialog = ({ trigger, current, activeHolds }: { trigger: React.ReactElement; current?: Requisites; activeHolds: number }) => (
  <Dialog>
    <DialogTrigger render={trigger} />
    <DialogContent className="sm:max-w-lg">
      <DialogHeader className="gap-2">
        <span className="mono-label text-smoke">Реквизиты · перевод СБП</span>
        <DialogTitle className="section-heading text-heading-sm">{current ? 'Изменить реквизиты' : 'Новые реквизиты'}</DialogTitle>
        <DialogDescription className="text-body-sm text-slate">Гости видят их только во время удержания, чтобы перевести предоплату или остаток.</DialogDescription>
      </DialogHeader>
      <DialogBody>
        <div className="flex flex-col gap-2">
          <Label htmlFor="req-phone" className="text-body-sm font-medium">
            Телефон для СБП
          </Label>
          <Input id="req-phone" type="tel" defaultValue={current?.phone} placeholder="+7 (___) ___-__-__" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="req-bank" className="text-body-sm font-medium">
              Банк
            </Label>
            <Input id="req-bank" defaultValue={current?.bank} placeholder="Т-Банк" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="req-recipient" className="text-body-sm font-medium">
              Получатель
            </Label>
            <Input id="req-recipient" defaultValue={current?.recipient} placeholder="Как в банке" />
          </div>
        </div>
        {activeHolds > 0 && (
          <p className="flex items-start gap-2 rounded-2xl bg-mist p-3 text-body-sm text-slate">
            <HourglassIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
            Идёт {activeHolds} удержание: гость уже видит старые реквизиты и переводит по ним. Новые появятся только в следующих заявках.
          </p>
        )}
        <p className="flex items-start gap-2 rounded-2xl bg-mist p-3 text-body-sm text-slate">
          <ShieldCheckIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
          Изменение подтвердим кодом на телефон владельца и запишем в историю.
        </p>
      </DialogBody>
      <DialogFooter className="gap-2">
        <DialogClose render={<Button variant="ghost" />}>Отмена</DialogClose>
        <Button className="shadow-control">Получить код и сохранить</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)
