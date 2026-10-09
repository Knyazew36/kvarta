import { SendIcon } from 'lucide-react'
import { PersonLine } from '@/shared/ui/rb/PersonAvatar'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Dialog, DialogBody, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/shadcn/dialog'
import { Label } from '@/shared/ui/shadcn/label'
import { Textarea } from '@/shared/ui/shadcn/textarea'

type HelpRequestDialogProps = {
  trigger: React.ReactElement
  task: string
  // Кому уйдёт просьба — показываем явно, а не «команде»
  to: { name: string; caption: string }
}

export const HelpRequestDialog = ({ trigger, task, to }: HelpRequestDialogProps) => (
  <Dialog>
    <DialogTrigger render={trigger} />
    <DialogContent className="sm:max-w-lg">
      <DialogHeader className="gap-2">
        <span className="mono-label text-smoke">Помощь · {task}</span>
        <DialogTitle className="section-heading text-heading-sm">Нужна помощь</DialogTitle>
        <DialogDescription className="text-body-sm text-slate">Сообщение уйдёт вместе с номером задачи, объектом и фото из отчёта.</DialogDescription>
      </DialogHeader>
      <DialogBody>
        <div className="flex items-center justify-between gap-3 rounded-3xl bg-mist p-4">
          <PersonLine name={to.name} caption={to.caption} />
          <span className="mono-label text-smoke">получатель</span>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="help-text" className="text-body-sm font-medium">
            Что случилось
          </Label>
          <Textarea id="help-text" rows={3} placeholder="Например, нет ключа от кладовки с бельём" />
        </div>
      </DialogBody>
      <DialogFooter className="gap-2">
        <DialogClose render={<Button variant="ghost" />}>Отмена</DialogClose>
        <Button>
          <SendIcon /> Отправить
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)
