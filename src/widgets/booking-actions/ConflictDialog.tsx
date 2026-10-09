import { CheckIcon, TriangleAlertIcon } from 'lucide-react'
import { useState } from 'react'
import { DEMO_TZ } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { type Source, SourceTag } from '@/shared/ui/rb/SourceTag'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Dialog, DialogBody, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/shadcn/dialog'

// ── Макетные данные: две записи на одни даты ────────────────────────────────

type Side = {
  id: string
  number: string
  source: Source
  guest: string
  from: string
  till: string
  days: number[]
  received: string
}

const DAYS = [10, 11, 12, 13, 14, 15]
const OVERLAP = [12, 13]

const SIDES: Side[] = [
  {
    id: 'b-1042',
    number: '#1042',
    source: 'avito',
    guest: 'Ольга Смирнова',
    from: '10 окт, 14:00',
    till: '14 окт, 12:00',
    days: [10, 11, 12, 13],
    received: `5 окт, 18:20 ${DEMO_TZ}`,
  },
  {
    id: 'b-1045',
    number: '#1045',
    source: 'sutochno',
    guest: 'Артём Белов',
    from: '12 окт, 15:00',
    till: '15 окт, 11:00',
    days: [12, 13, 14],
    received: `8 окт, 07:41 ${DEMO_TZ}`,
  },
]

// Полоса дат: пересечение видно глазами, а не только в тексте
const DayStrip = ({ days }: { days: number[] }) => (
  <div className="grid grid-cols-6 gap-1" aria-hidden>
    {DAYS.map((day) => {
      const busy = days.includes(day)
      const clash = busy && OVERLAP.includes(day)
      return (
        <div key={day} className="flex flex-col items-center gap-1">
          <span className={cn('h-6 w-full rounded-full', clash ? 'bg-destructive' : busy ? 'bg-foreground' : 'bg-mist')} />
          <span className={cn('text-caption tabular-nums', clash ? 'text-destructive font-medium' : 'text-smoke')}>{day}</span>
        </div>
      )
    })}
  </div>
)

// Разбор конфликта: две записи рядом, решение — какую оставить; вторую отменяют на её площадке
export const ConflictDialog = ({ trigger }: { trigger: React.ReactElement }) => {
  const [keep, setKeep] = useState<string | null>(null)
  const other = SIDES.find((side) => side.id !== keep)

  return (
    <Dialog>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader className="gap-2">
          <span className="mono-label text-destructive inline-flex items-center gap-1.5">
            <TriangleAlertIcon className="size-3.5" aria-hidden /> Конфликт · Студия на Лиговском
          </span>
          <DialogTitle className="section-heading text-heading-sm">Две брони на 12–13 октября</DialogTitle>
          <DialogDescription className="text-body-sm text-slate">
            Обе записи пришли с площадок и обе подтверждены там. Rentybot не выбирает сам: решите, какого гостя принимаете.
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          <div role="radiogroup" aria-label="Какую бронь оставить" className="grid gap-3 md:grid-cols-2">
            {SIDES.map((side) => (
              <button
                key={side.id}
                type="button"
                role="radio"
                aria-checked={keep === side.id}
                onClick={() => setKeep(side.id)}
                className={cn(
                  'focus-visible:ring-ring/30 flex flex-col gap-4 rounded-3xl p-5 text-left transition-colors outline-none focus-visible:ring-3',
                  keep === side.id ? 'bg-foreground text-background' : 'bg-card hover:bg-mist',
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2">
                    <span className="text-body font-medium">{side.number}</span>
                    <SourceTag source={side.source} inverted={keep === side.id} />
                  </span>
                  {keep === side.id && (
                    <span className="text-caption inline-flex items-center gap-1">
                      <CheckIcon className="size-3.5" aria-hidden /> Оставить
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-subheading-lg font-medium">{side.guest}</span>
                  <span className={cn('text-body-sm', keep === side.id ? 'text-smoke' : 'text-slate')}>
                    {side.from} → {side.till}
                  </span>
                </div>
                <DayStrip days={side.days} />
                <span className="mono-label text-smoke">Получено {side.received}</span>
              </button>
            ))}
          </div>

          {other && keep && (
            <p className="bg-mist text-body-sm text-slate rounded-2xl p-4">
              Бронь <span className="text-foreground font-medium">{other.number}</span> нужно отменить в кабинете площадки — Rentybot не
              отменяет брони площадок сам. До отмены даты останутся в конфликте, а задача «Отменить {other.number}» придёт вам.
            </p>
          )}
        </DialogBody>
        <DialogFooter className="gap-2">
          <DialogClose render={<Button variant="ghost" />}>Решить позже</DialogClose>
          <Button disabled={!keep} className="shadow-control">
            Оставить выбранную
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
