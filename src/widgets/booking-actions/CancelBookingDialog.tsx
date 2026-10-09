import { BanknoteIcon, CalendarX2Icon, ClipboardListIcon, KeyRoundIcon } from 'lucide-react'
import { type Consequence, ConsequencesPreview } from '@/shared/ui/rb/ConsequencesPreview'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Dialog, DialogBody, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/shadcn/dialog'
import { Label } from '@/shared/ui/shadcn/label'
import { Textarea } from '@/shared/ui/shadcn/textarea'

// ── Макетные последствия отмены ─────────────────────────────────────────────

const CONSEQUENCES: Consequence[] = [
  {
    icon: CalendarX2Icon,
    area: 'Даты',
    text: '12–14 окт откроются для гостей на всех площадках после следующего обмена.',
  },
  { icon: ClipboardListIcon, area: 'Задачи', text: '2 задачи подготовки будут отменены: уборка и передача ключей.' },
  { icon: KeyRoundIcon, area: 'Доступ', text: 'Инструкции по заселению станут недоступны гостю.' },
  {
    icon: BanknoteIcon,
    area: 'Деньги',
    text: 'Предоплата 6 800 ₽ получена. Возврат оформляется отдельно — автоматически не уходит.',
    severity: 'warn',
  },
]

// Отмена — необратимое действие: последствия перечислены до кнопки, а не после
export const CancelBookingDialog = ({ trigger, number }: { trigger: React.ReactElement; number: string }) => (
  <Dialog>
    <DialogTrigger render={trigger} />
    <DialogContent className="sm:max-w-lg">
      <DialogHeader className="gap-2">
        <span className="mono-label text-smoke">Бронь {number} · прямая</span>
        <DialogTitle className="section-heading text-heading-sm">Отменить бронь?</DialogTitle>
        <DialogDescription className="text-body-sm text-slate">
          Гость получит сообщение об отмене. Вернуть бронь после отмены нельзя — только создать заново.
        </DialogDescription>
      </DialogHeader>
      <DialogBody>
        <ConsequencesPreview items={CONSEQUENCES} />
        <div className="flex flex-col gap-2">
          <Label htmlFor="cancel-reason" className="text-body-sm font-medium">
            Причина для гостя
          </Label>
          <Textarea id="cancel-reason" rows={3} placeholder="Например, авария в квартире" />
        </div>
      </DialogBody>
      <DialogFooter className="gap-2">
        <DialogClose render={<Button variant="ghost" />}>Не отменять</DialogClose>
        <Button variant="destructive">Отменить бронь</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)
