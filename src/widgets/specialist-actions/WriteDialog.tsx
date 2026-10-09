import { useState } from 'react'
import { MessageCircleIcon, SendIcon } from 'lucide-react'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Dialog, DialogBody, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/shadcn/dialog'
import { Label } from '@/shared/ui/shadcn/label'
import { Textarea } from '@/shared/ui/shadcn/textarea'

type WriteDialogProps = {
  trigger: React.ReactElement
  specialist: string
  onSent?: () => void
}

// Первое обращение, пока контакт закрыт: уходит через Rentybot в подключённый канал специалиста (CAT-09).
// Механизм доставки ещё выбирается — в макете это MAX
export const WriteDialog = ({ trigger, specialist, onSent }: WriteDialogProps) => {
  const [open, setOpen] = useState(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="gap-2">
          <span className="mono-label text-smoke">Первое сообщение · {specialist}</span>
          <DialogTitle className="section-heading text-heading-sm">Написать специалисту</DialogTitle>
          <DialogDescription className="text-body-sm text-slate">Сообщение уйдёт специалисту в MAX от Rentybot. Ответ придёт вам в MAX и в «Мои обращения».</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <form
            id="write-specialist-form"
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault()
              onSent?.()
              setOpen(false)
            }}
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="write-specialist-text" className="text-body-sm font-medium">
                Сообщение
              </Label>
              <Textarea id="write-specialist-text" rows={5} maxLength={1000} required placeholder="Здравствуйте! Нужна помощь с…" />
            </div>
            <p className="flex items-start gap-2 rounded-2xl bg-mist p-3 text-body-sm text-slate">
              <MessageCircleIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
              Ваш телефон специалист не увидит, пока вы сами его не напишете.
            </p>
          </form>
        </DialogBody>
        <DialogFooter className="gap-2">
          <DialogClose render={<Button variant="ghost" />}>Отмена</DialogClose>
          <Button type="submit" form="write-specialist-form">
            <SendIcon /> Отправить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
