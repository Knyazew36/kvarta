import { useState } from 'react'
import { getCurrentSegment, useEndTaskSeries } from '@/entities/task-series'
import type { TaskSeries } from '@/shared/api/generated/models'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/shadcn/dialog'
import { Spinner } from '@/shared/ui/shadcn/spinner'

// Завершение необратимо: возобновить завершённую серию бэк не даёт
export const EndSeriesDialog = ({ trigger, series }: { trigger: React.ReactElement; series: TaskSeries }) => {
  const [open, setOpen] = useState(false)
  const endSeries = useEndTaskSeries(series.organization_id, series.id)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="gap-2">
          <span className="mono-label text-smoke">
            Серия #{series.id} · {getCurrentSegment(series).template.title}
          </span>
          <DialogTitle className="section-heading text-heading-sm">Завершить серию?</DialogTitle>
          <DialogDescription className="text-body-sm text-slate">
            Новые задачи по серии создаваться перестанут, возобновить её будет нельзя — только создать новую. Уже созданные задачи останутся: ненужные отмените отдельно.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <DialogClose render={<Button type="button" variant="ghost" />}>Не завершать</DialogClose>
          <Button type="button" variant="destructive" disabled={endSeries.isPending} onClick={() => endSeries.mutate({ version: series.version }, { onSuccess: () => setOpen(false) })}>
            {endSeries.isPending && <Spinner />} Завершить серию
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
