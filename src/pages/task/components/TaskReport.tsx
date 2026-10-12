import { useState } from 'react'
import { formatDue, formatMoment, useTaskPeople } from '@/entities/task'
import type { Task } from '@/shared/api/generated/models'
import { PersonAvatar } from '@/shared/ui/rb/PersonAvatar'
import { SectionCard } from '@/shared/ui/rb/Section'
import { TaskPhotoGallery } from './TaskPhotoGallery'
import { TaskPhotoThumb } from './TaskPhotos'

type Report = NonNullable<Task['current_report']>

const DECISION_LABEL: Record<Report['decision'], string> = {
  pending: 'ждёт проверки',
  completed: 'принят без проверки',
  accepted: 'принят',
  returned: 'возвращён на доработку',
}

// Возврат — главное, что должен увидеть исполнитель: что исправить и к какому сроку
export const TaskReturnedNote = ({ task, report }: { task: Task; report: Report }) => {
  const { userName } = useTaskPeople()
  const reviewer = report.reviewed_by !== null ? userName(report.reviewed_by) : 'Проверяющий'

  return (
    <section className="flex flex-col gap-4 rounded-card bg-foreground p-4 text-background shadow-card md:p-8 dark:bg-mist dark:text-foreground">
      <span className="flex items-center gap-3">
        <PersonAvatar name={reviewer} tone="inverse" size="sm" />
        <span className="flex flex-col">
          <span className="text-body-sm font-medium">Возвращено на доработку</span>
          <span className="text-caption text-smoke">
            {reviewer}
            {report.reviewed_at && ` · ${formatMoment(report.reviewed_at)}`}
          </span>
        </span>
      </span>
      {report.return_comment && <p className="text-body">«{report.return_comment}»</p>}
      <span className="mono-label text-smoke">Новый срок {formatDue(task.due_at, task.timezone)}</span>
    </section>
  )
}

// Последний отправленный отчёт: комментарий, решение и фото. Прежние отчёты остаются в истории
export const TaskReport = ({ task, report }: { task: Task; report: Report }) => {
  const { userName } = useTaskPeople()
  const photos = report.photos ?? []
  const [opened, setOpened] = useState<number | null>(null)

  return (
    <SectionCard title={`Отчёт №${report.number}`} count={DECISION_LABEL[report.decision]}>
      <div className="flex flex-col gap-4">
        <span className="mono-label text-smoke">
          {userName(report.submitted_by)} · {formatMoment(report.submitted_at)}
          {report.checklist.length > 0 && ` · чек-лист ${report.checklist.filter((item) => item.done).length}/${report.checklist.length}`}
        </span>
        {report.comment ? <p className="text-body text-slate">{report.comment}</p> : <p className="text-body-sm text-smoke">Без комментария</p>}
        {photos.length > 0 && (
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {photos.map((photo) => (
              <TaskPhotoThumb key={photo.id} task={task} photo={photo} onOpen={() => setOpened(photo.id)} />
            ))}
          </ul>
        )}
        <TaskPhotoGallery task={task} photos={photos} openedId={opened} onClose={() => setOpened(null)} />
      </div>
    </SectionCard>
  )
}
