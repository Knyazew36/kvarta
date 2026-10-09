import { useState } from 'react'
import { HourglassIcon, SendIcon, ShieldIcon } from 'lucide-react'
import { DEMO_USERS } from '@/shared/mock/state'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Dialog, DialogBody, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/shadcn/dialog'
import { Label } from '@/shared/ui/shadcn/label'
import { Textarea } from '@/shared/ui/shadcn/textarea'

type ContactRequestDialogProps = {
  trigger: React.ReactElement
  specialist: string
  onSent?: () => void
}

// Запрос контактов — не заказ (CAT-13): специалист сам выбирает, что открыть, и только этому заявителю (CAT-10)
export const ContactRequestDialog = ({ trigger, specialist, onSent }: ContactRequestDialogProps) => {
  const [open, setOpen] = useState(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="gap-2">
          <span className="mono-label text-smoke">Запрос контактов · {specialist}</span>
          <DialogTitle className="section-heading text-heading-sm">Запросить контакты</DialogTitle>
          <DialogDescription className="text-body-sm text-slate">Специалист решит, какие контакты открыть — телефон, MAX или мессенджер. Откроются только вам.</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <form
            id="contact-request-form"
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault()
              onSent?.()
              setOpen(false)
            }}
          >
            <div className="flex flex-col gap-2 rounded-2xl bg-background p-4">
              <span className="mono-label text-smoke">Специалист увидит</span>
              <span className="text-body-sm font-medium">{DEMO_USERS.owner.name} · организация «Волна»</span>
              <span className="flex items-start gap-2 text-caption text-smoke">
                <ShieldIcon className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                Данные гостей, адреса и коды объектов не передаём
              </span>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="contact-request-text" className="text-body-sm font-medium">
                Коротко о задаче <span className="font-normal text-smoke">— необязательно</span>
              </Label>
              <Textarea id="contact-request-text" rows={3} maxLength={500} placeholder="Например, уборка между заездами в студии на Лиговском, 2–3 раза в неделю" />
            </div>
            <p className="flex items-start gap-2 rounded-2xl bg-mist p-3 text-body-sm text-slate">
              <HourglassIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
              Без ответа за 72 часа запрос истечёт — молчание не считается согласием. Цену и время вы обсуждаете напрямую.
            </p>
          </form>
        </DialogBody>
        <DialogFooter className="gap-2">
          <DialogClose render={<Button variant="ghost" />}>Отмена</DialogClose>
          <Button type="submit" form="contact-request-form">
            <SendIcon /> Отправить запрос
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
