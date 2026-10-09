import { useState } from 'react'
import { BadgeCheckIcon, StarIcon } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Dialog, DialogBody, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/shadcn/dialog'
import { Label } from '@/shared/ui/shadcn/label'
import { Textarea } from '@/shared/ui/shadcn/textarea'

export type ReviewEligibility = { ok: true; basis: string } | { ok: false; reason: string }

type ReviewDialogProps = {
  trigger: React.ReactElement
  specialist: string
  eligibility: ReviewEligibility
  // Своя действующая оценка: правка заменяет её, число оценок не растёт (CAT-15, приёмка п.5)
  existing?: { rating: number; text: string }
}

const RATING_LABEL = ['', 'Плохо', 'Слабо', 'Нормально', 'Хорошо', 'Отлично']

export const ReviewDialog = ({ trigger, specialist, eligibility, existing }: ReviewDialogProps) => {
  const [open, setOpen] = useState(false)
  const [rating, setRating] = useState(existing?.rating ?? 0)
  const [hover, setHover] = useState(0)
  const shown = hover || rating

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="gap-2">
          <span className="mono-label text-smoke">Отзыв · {specialist}</span>
          <DialogTitle className="section-heading text-heading-sm">{existing ? 'Изменить отзыв' : 'Оставить отзыв'}</DialogTitle>
          <DialogDescription className="text-body-sm text-slate">
            {eligibility.ok ? 'Оценивают только пользователи с подтверждённой бронью площадки — так рейтингу можно верить.' : 'Сейчас оценить специалиста нельзя.'}
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          {eligibility.ok ? (
            <form
              id="review-form"
              className="flex flex-col gap-5"
              onSubmit={(event) => {
                event.preventDefault()
                setOpen(false)
              }}
            >
              {/* Основание проверяется ещё раз при отправке (CAT-14); данные брони в отзыв не попадают */}
              <div className="flex items-start gap-3 rounded-2xl bg-background p-4">
                <BadgeCheckIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
                <span className="flex flex-col gap-0.5">
                  <span className="text-body-sm font-medium">{eligibility.basis}</span>
                  <span className="text-caption text-smoke">Проверим ещё раз при отправке. В отзыве будет подпись «Пользователь с подтверждённой бронью» — без объекта и дат.</span>
                </span>
              </div>

              <fieldset className="flex flex-col gap-2">
                <legend className="mb-2 text-body-sm font-medium">Оценка</legend>
                <div className="flex items-center gap-3" onMouseLeave={() => setHover(0)}>
                  <div role="radiogroup" aria-label="Оценка от 1 до 5" className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        role="radio"
                        aria-checked={rating === value}
                        aria-label={`${value} из 5`}
                        onClick={() => setRating(value)}
                        onMouseEnter={() => setHover(value)}
                        className="flex size-10 items-center justify-center rounded-full outline-none transition-colors hover:bg-mist focus-visible:ring-3 focus-visible:ring-ring/30"
                      >
                        <StarIcon className={cn('size-6 transition-colors', value <= shown ? 'fill-current' : 'text-foreground/25')} aria-hidden />
                      </button>
                    ))}
                  </div>
                  <span className="text-body-sm text-slate">{RATING_LABEL[shown]}</span>
                </div>
              </fieldset>

              <div className="flex flex-col gap-2">
                <Label htmlFor="review-text" className="text-body-sm font-medium">
                  Отзыв <span className="font-normal text-smoke">— необязательно</span>
                </Label>
                <Textarea id="review-text" rows={4} maxLength={1500} defaultValue={existing?.text} placeholder="Что понравилось, что стоит учесть другим владельцам" />
              </div>

              {existing && (
                <p className="rounded-2xl bg-mist p-3 text-body-sm text-slate">
                  Новая оценка заменит вашу прежнюю ({existing.rating} из 5) — число оценок у специалиста не изменится.
                </p>
              )}
            </form>
          ) : (
            <p className="rounded-2xl bg-mist p-4 text-body-sm text-slate">{eligibility.reason}</p>
          )}
        </DialogBody>
        <DialogFooter className="gap-2">
          <DialogClose render={<Button variant="ghost" />}>{eligibility.ok ? 'Отмена' : 'Понятно'}</DialogClose>
          {eligibility.ok && (
            <Button type="submit" form="review-form" disabled={rating === 0}>
              {existing ? 'Обновить отзыв' : 'Опубликовать'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
