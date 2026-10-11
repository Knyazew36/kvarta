import { formatDue } from '@/entities/task'
import { GENERATION_ISSUE_TEXT } from '@/entities/task-series'
import type { TaskSeriesPreview } from '@/shared/api/generated/models'
import { ErrorText } from '@/shared/ui/rb/ErrorText'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Dialog, DialogBody, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/shadcn/dialog'
import { Spinner } from '@/shared/ui/shadcn/spinner'

// Длинный план (ежедневная серия на 30 дней) не должен растягивать диалог: показываем начало и число остальных
const SHOWN = 5

const Group = ({ title, hint, lines }: { title: string; hint: string; lines: { key: string; text: string }[] }) => {
  if (lines.length === 0) return null

  return (
    <div className="flex flex-col gap-2">
      <span className="mono-label text-smoke">
        {title} · {lines.length}
      </span>
      <ul className="flex flex-col gap-1 rounded-3xl border border-mist p-2">
        {lines.slice(0, SHOWN).map((line) => (
          <li key={line.key} className="mono-label rounded-2xl px-3 py-2 tabular-nums">
            {line.text}
          </li>
        ))}
        {lines.length > SHOWN && <li className="px-3 py-2 text-caption text-smoke">и ещё {lines.length - SHOWN}</li>}
      </ul>
      <span className="text-caption text-smoke">{hint}</span>
    </div>
  )
}

type SeriesScopeDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  series: string
  // План изменений от бэка; пока его нет, диалог закрыт
  preview: TaskSeriesPreview | undefined
  isApplying: boolean
  // Предпросмотр запрашивается заново: задачи серии изменились, пока диалог был открыт
  isRefreshing: boolean
  error?: string
  onApply: () => void
}

// Изменение серии задевает уже созданные задачи: бэк считает план (что перенесётся, отменится, создастся, останется),
// и он виден до сохранения, а не после
export const SeriesScopeDialog = ({ open, onOpenChange, series, preview, isApplying, isRefreshing, error, onApply }: SeriesScopeDialogProps) => {
  if (!preview) return null

  const { updates, cancellations, creations, preserved } = preview
  const untouched = updates.length + cancellations.length + creations.length === 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="gap-2">
          <span className="mono-label text-smoke">Серия · {series}</span>
          <DialogTitle className="section-heading text-heading-sm">Применить изменения?</DialogTitle>
          <DialogDescription className="text-body-sm text-slate">
            Изменения действуют с {preview.effective_from}; план посчитан по {preview.through}. Начатые, выполненные и изменённые вручную задачи не меняются.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          {untouched && <p className="rounded-3xl bg-mist p-4 text-body-sm text-slate">Уже созданные задачи не изменятся: новое правило коснётся только будущих выполнений.</p>}
          <Group
            title="Перенесутся"
            hint="Ещё не начатые задачи получат новый срок, название или исполнителя"
            lines={updates.map((item) => ({
              key: String(item.task_id),
              text: `#${item.task_id} · ${formatDue(item.before.due_at, item.slot.timezone)} → ${formatDue(item.slot.due_at, item.slot.timezone)}`,
            }))}
          />
          <Group
            title="Отменятся"
            hint="По новому правилу этих дат нет"
            lines={cancellations.map((item) => ({ key: String(item.task_id), text: `#${item.task_id} · ${formatDue(item.before.due_at, null)}` }))}
          />
          <Group
            title="Создадутся"
            hint="Новые задачи по изменённому правилу"
            lines={creations.map((item) => ({ key: item.period, text: formatDue(item.slot.due_at, item.slot.timezone) }))}
          />
          <Group
            title="Останутся как есть"
            hint="Начатые, закрытые и изменённые вручную — правило серии их не трогает"
            lines={preserved.map((item) => ({ key: String(item.task_id), text: `#${item.task_id} · ${formatDue(item.before.due_at, null)}` }))}
          />
          {preview.generation_issue && <ErrorText>{GENERATION_ISSUE_TEXT[preview.generation_issue]}</ErrorText>}
          {error && <ErrorText>{error}</ErrorText>}
        </DialogBody>
        <DialogFooter className="gap-2">
          <DialogClose render={<Button type="button" variant="ghost" />}>Отмена</DialogClose>
          <Button type="button" className="shadow-control" disabled={isApplying || isRefreshing} onClick={onApply}>
            {(isApplying || isRefreshing) && <Spinner />} {isRefreshing ? 'Пересчитываем…' : 'Применить'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
