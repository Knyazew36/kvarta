import { CalendarClockIcon } from 'lucide-react'
import { DEMO_TZ } from '@/shared/lib/format'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { DateInput } from '@/shared/ui/shadcn/date-input'
import { Dialog, DialogBody, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/shadcn/dialog'
import { Input } from '@/shared/ui/shadcn/input'
import { Label } from '@/shared/ui/shadcn/label'
import { Textarea } from '@/shared/ui/shadcn/textarea'

type PostponeTaskDialogProps = {
  trigger: React.ReactElement
  task: string
  // Перенос задачи подготовки упирается в заезд — предупреждаем до сохранения
  deadline?: string
}

export const PostponeTaskDialog = ({ trigger, task, deadline }: PostponeTaskDialogProps) => (
  <Dialog>
    <DialogTrigger render={trigger} />
    <DialogContent className="sm:max-w-lg">
      <DialogHeader className="gap-2">
        <span className="mono-label text-smoke">Перенос · {task}</span>
        <DialogTitle className="section-heading text-heading-sm">Отложить задачу</DialogTitle>
        <DialogDescription className="text-body-sm text-slate">Проверяющий увидит новый срок и причину переноса.</DialogDescription>
      </DialogHeader>
      <DialogBody>
        <div className="grid grid-cols-[1fr_120px] gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="postpone-date" className="text-body-sm font-medium">
              Новая дата
            </Label>
            <DateInput id="postpone-date" defaultValue="2026-10-08" min="2026-10-08" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="postpone-time" className="text-body-sm font-medium">
              Время, {DEMO_TZ}
            </Label>
            <Input id="postpone-time" type="time" defaultValue="16:00" />
          </div>
        </div>
        {deadline && (
          <p className="flex items-start gap-2 rounded-2xl bg-mist p-3 text-body-sm text-slate">
            <CalendarClockIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
            {deadline}
          </p>
        )}
        <div className="flex flex-col gap-2">
          <Label htmlFor="postpone-reason" className="text-body-sm font-medium">
            Причина
          </Label>
          <Textarea id="postpone-reason" rows={2} placeholder="Например, гость задерживает выезд" />
        </div>
      </DialogBody>
      <DialogFooter className="gap-2">
        <DialogClose render={<Button variant="ghost" />}>Отмена</DialogClose>
        <Button>Перенести</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)
