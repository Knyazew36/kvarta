import { useSetTaskChecklist } from '@/entities/task'
import type { Task } from '@/shared/api/generated/models'
import { cn } from '@/shared/lib/utils'
import { Checkbox } from '@/shared/ui/shadcn/animate-ui/components/radix/checkbox'

// Отметки сразу уходят на бэк: completed_indexes — полный набор отмеченных пунктов, а не один переключённый
export const TaskChecklist = ({ task }: { task: Task }) => {
  const setChecklist = useSetTaskChecklist(task.organization_id, task.id)
  const editable = task.allowed_actions.includes('checklist')
  const doneCount = task.checklist.filter((item) => item.done).length

  const toggle = (index: number, checked: boolean) =>
    setChecklist.mutate({
      version: task.version,
      completed_indexes: task.checklist.flatMap((item, itemIndex) => ((itemIndex === index ? checked : item.done) ? [itemIndex] : [])),
    })

  return (
    <div className="mt-5 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-mist">
          <div className="h-full rounded-full bg-foreground transition-all" style={{ width: `${(doneCount / task.checklist.length) * 100}%` }} />
        </div>
        <span className="mono-label text-smoke tabular-nums">
          {doneCount}/{task.checklist.length}
        </span>
      </div>
      <ul className="flex flex-col">
        {task.checklist.map((item, index) => (
          // Пункты приходят без id и после создания не меняются — индекс и есть их ключ на бэке
          <li key={index}>
            <label className={cn('flex cursor-pointer items-center gap-3 rounded-2xl px-3 py-3 transition-colors hover:bg-mist', !editable && 'pointer-events-none')}>
              {/* Пока запрос идёт, версия задачи устарела: следующую отметку бэк отклонил бы с 409 */}
              <Checkbox checked={item.done} disabled={!editable || setChecklist.isPending} onCheckedChange={(checked) => toggle(index, checked === true)} />
              <span className={cn('flex-1 text-body-sm', item.done && 'text-smoke line-through')}>{item.text}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  )
}
