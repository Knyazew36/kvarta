import { useState } from 'react'
import { cn } from '@/shared/lib/utils'
import { type StatusMeta, StatusFromMeta } from '@/shared/ui/rb/StatusBadge'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { RadioGroup, RadioGroupItem } from '@/shared/ui/shadcn/animate-ui/components/radix/radio-group'
import { Dialog, DialogBody, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/shadcn/dialog'

export type AffectedTask = { id: string; date: string; status: StatusMeta }

type SeriesScopeDialogProps = {
  trigger: React.ReactElement
  series: string
  // Ближайшее выполнение — первое в списке затронутых
  affected: AffectedTask[]
}

// Изменение серии задевает уже созданные задачи: список затронутых виден до сохранения, а не после
export const SeriesScopeDialog = ({ trigger, series, affected }: SeriesScopeDialogProps) => {
  const [scope, setScope] = useState<'one' | 'future'>('future')
  const shown = scope === 'one' ? affected.slice(0, 1) : affected

  return (
    <Dialog>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="gap-2">
          <span className="mono-label text-smoke">Серия · {series}</span>
          <DialogTitle className="section-heading text-heading-sm">К чему применить изменения?</DialogTitle>
          <DialogDescription className="text-body-sm text-slate">Выполненные и принятые задачи не меняются ни в одном из вариантов.</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <RadioGroup value={scope} onValueChange={(value) => setScope(value as 'one' | 'future')} aria-label="Область изменений" className="gap-2">
            {[
              { value: 'one', title: 'Только это выполнение', text: `${affected[0]?.date}, остальные останутся как были` },
              { value: 'future', title: 'Это и все будущие', text: 'Правило серии изменится, новые задачи создадутся по нему' },
            ].map((item) => (
              <label key={item.value} className={cn('flex cursor-pointer items-start gap-3 rounded-3xl p-4 transition-colors hover:bg-mist', scope === item.value && 'bg-mist')}>
                <RadioGroupItem value={item.value} className="mt-0.5" />
                <span className="flex flex-col gap-0.5">
                  <span className="text-body-sm font-medium">{item.title}</span>
                  <span className="text-caption text-smoke">{item.text}</span>
                </span>
              </label>
            ))}
          </RadioGroup>
          <div className="flex flex-col gap-2">
            <span className="mono-label text-smoke">Затронет задачи · {shown.length}</span>
            <ul className="flex flex-col gap-1 rounded-3xl border border-mist p-2">
              {shown.map((task) => (
                <li key={task.id} className="flex items-center justify-between gap-3 rounded-2xl px-3 py-2">
                  <span className="mono-label tabular-nums">{task.date}</span>
                  <StatusFromMeta meta={task.status} size="sm" />
                </li>
              ))}
            </ul>
          </div>
        </DialogBody>
        <DialogFooter className="gap-2">
          <DialogClose render={<Button variant="ghost" />}>Отмена</DialogClose>
          <Button>Сохранить</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
