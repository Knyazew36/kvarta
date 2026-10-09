import { useState } from 'react'
import { CircleCheckIcon, RotateCcwIcon } from 'lucide-react'
import { DEMO_TZ } from '@/shared/lib/format'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { DateInput } from '@/shared/ui/shadcn/date-input'
import { Dialog, DialogBody, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/shadcn/dialog'
import { Input } from '@/shared/ui/shadcn/input'
import { Label } from '@/shared/ui/shadcn/label'
import { Textarea } from '@/shared/ui/shadcn/textarea'

type ReviewTaskDialogProps = {
  trigger: React.ReactElement
  mode: 'accept' | 'return'
  task: string
  assignee: string
}

// Приёмка и возврат — одно окно: возврат без комментария и нового срока исполнителю непонятен, поэтому поля обязательны
export const ReviewTaskDialog = ({ trigger, mode, task, assignee }: ReviewTaskDialogProps) => {
  const [comment, setComment] = useState('')
  const isReturn = mode === 'return'

  return (
    <Dialog>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="gap-2">
          <span className="mono-label text-smoke">Проверка · {task}</span>
          <DialogTitle className="section-heading text-heading-sm">{isReturn ? 'Вернуть на доработку' : 'Принять работу?'}</DialogTitle>
          <DialogDescription className="text-body-sm text-slate">
            {isReturn
              ? `${assignee} получит задачу обратно с вашим комментарием и новым сроком.`
              : `${assignee} получит уведомление, задача закроется. Фотоотчёт останется в истории объекта.`}
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <div className="flex flex-col gap-2">
            <Label htmlFor="review-comment" className="text-body-sm font-medium">
              {isReturn ? 'Что исправить' : 'Комментарий'}
              {!isReturn && <span className="font-normal text-smoke"> · необязательно</span>}
            </Label>
            <Textarea
              id="review-comment"
              rows={3}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder={isReturn ? 'Например, не видно ванную на фото, пыль на полках в спальне' : 'Спасибо, всё чисто'}
              aria-required={isReturn}
            />
          </div>
          {isReturn && (
            <div className="grid grid-cols-[1fr_120px] gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="review-date" className="text-body-sm font-medium">
                  Новый срок
                </Label>
                <DateInput id="review-date" defaultValue="2026-10-08" min="2026-10-08" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="review-time" className="text-body-sm font-medium">
                  Время, {DEMO_TZ}
                </Label>
                <Input id="review-time" type="time" defaultValue="14:00" />
              </div>
            </div>
          )}
        </DialogBody>
        <DialogFooter className="gap-2">
          <DialogClose render={<Button variant="ghost" />}>Отмена</DialogClose>
          {isReturn ? (
            <Button disabled={!comment.trim()}>
              <RotateCcwIcon /> Вернуть
            </Button>
          ) : (
            <Button>
              <CircleCheckIcon /> Принять
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
