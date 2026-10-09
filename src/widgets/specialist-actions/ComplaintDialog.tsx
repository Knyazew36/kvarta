import { useState } from 'react'
import { FlagIcon } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { RadioGroup, RadioGroupItem } from '@/shared/ui/shadcn/animate-ui/components/radix/radio-group'
import { Dialog, DialogBody, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/shadcn/dialog'
import { Label } from '@/shared/ui/shadcn/label'
import { Textarea } from '@/shared/ui/shadcn/textarea'

type ComplaintDialogProps = {
  trigger: React.ReactElement
  target: 'profile' | 'review'
  // Чей профиль или чей отзыв — в шапке, чтобы не пожаловаться не туда
  subject: string
}

const REASONS: Record<ComplaintDialogProps['target'], { value: string; label: string }[]> = {
  profile: [
    { value: 'fake', label: 'Недостоверные сведения или чужие фото' },
    { value: 'contacts', label: 'Контакты не работают или ведут не к нему' },
    { value: 'behavior', label: 'Грубость, давление или обман' },
    { value: 'other', label: 'Другое' },
  ],
  review: [
    { value: 'offensive', label: 'Оскорбления или угрозы' },
    { value: 'personal', label: 'Раскрыты личные данные' },
    { value: 'spam', label: 'Реклама или не по теме' },
    { value: 'false', label: 'Описанного не было' },
    { value: 'other', label: 'Другое' },
  ],
}

// Решает модератор и записывает причину; оценку автора молча не правят (CAT-18)
export const ComplaintDialog = ({ trigger, target, subject }: ComplaintDialogProps) => {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const reasons = REASONS[target]
  const formId = `complaint-${target}-form`

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setReason('')
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="gap-2">
          <span className="mono-label text-smoke">Жалоба · {subject}</span>
          <DialogTitle className="section-heading text-heading-sm">{target === 'profile' ? 'Пожаловаться на профиль' : 'Пожаловаться на отзыв'}</DialogTitle>
          <DialogDescription className="text-body-sm text-slate">Жалобу разберёт модератор. Решение и его причина появятся в истории, автора о жалобе не уведомляем.</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <form
            id={formId}
            className="flex flex-col gap-5"
            onSubmit={(event) => {
              event.preventDefault()
              setOpen(false)
            }}
          >
            <RadioGroup value={reason} onValueChange={setReason} aria-label="Причина" className="gap-1">
              {reasons.map((item) => (
                <label
                  key={item.value}
                  className={cn('flex cursor-pointer items-center gap-3 rounded-2xl p-3 transition-colors hover:bg-mist', reason === item.value && 'bg-mist')}
                >
                  <RadioGroupItem value={item.value} />
                  <span className="text-body-sm">{item.label}</span>
                </label>
              ))}
            </RadioGroup>
            <div className="flex flex-col gap-2">
              <Label htmlFor={`${formId}-text`} className="text-body-sm font-medium">
                Подробности {reason !== 'other' && <span className="font-normal text-smoke">— необязательно</span>}
              </Label>
              <Textarea id={`${formId}-text`} rows={3} maxLength={1000} required={reason === 'other'} />
            </div>
          </form>
        </DialogBody>
        <DialogFooter className="gap-2">
          <DialogClose render={<Button variant="ghost" />}>Отмена</DialogClose>
          <Button type="submit" form={formId} disabled={!reason}>
            <FlagIcon /> Отправить модератору
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
