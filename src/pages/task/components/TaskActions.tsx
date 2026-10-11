import { BellIcon, CircleCheckIcon, CirclePlayIcon, LifeBuoyIcon, PauseIcon, PencilIcon, RotateCcwIcon, SendIcon, XIcon } from 'lucide-react'
import { useStartTask } from '@/entities/task'
import type { Task } from '@/shared/api/generated/models'
import { MOCK_BORDER } from '@/shared/mock/mock-border'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Spinner } from '@/shared/ui/shadcn/spinner'
import { HelpRequestDialog } from '@/widgets/task-actions/HelpRequestDialog'
import { PostponeTaskDialog } from '@/widgets/task-actions/PostponeTaskDialog'
import { ReviewTaskDialog } from '@/widgets/task-actions/ReviewTaskDialog'
import { CancelTaskDialog } from './CancelTaskDialog'
import { CompleteTaskDialog } from './CompleteTaskDialog'
import { TaskEditSheet } from './TaskEditSheet'

type TaskActionsProps = {
  task: Task
  assigneeName: string
  // Кому уйдёт просьба о помощи в макетном диалоге
  reviewerName: string
}

// Кнопки — строго по allowed_actions: кто исполнитель, автор или проверяющий, бэк уже посчитал
export const TaskActions = ({ task, assigneeName, reviewerName }: TaskActionsProps) => {
  const startTask = useStartTask(task.organization_id, task.id)
  const can = (action: Task['allowed_actions'][number]) => task.allowed_actions.includes(action)
  const isExecutor = can('complete')

  return (
    <>
      {can('cancel') && (
        <CancelTaskDialog
          task={task}
          trigger={
            <Button variant="ghost">
              <XIcon /> Отменить
            </Button>
          }
        />
      )}
      {can('update') && (
        <TaskEditSheet
          task={task}
          trigger={
            <Button variant="ghost">
              <PencilIcon /> Изменить
            </Button>
          }
        />
      )}

      {/* Ручек «попросить помощь», «отложить» и «напомнить» на бэке нет: срок меняет только автор через «Изменить» */}
      {isExecutor && (
        <>
          <HelpRequestDialog
            task={task.title}
            to={{ name: reviewerName, caption: 'Проверяющий' }}
            trigger={
              <Button variant="ghost" className={MOCK_BORDER}>
                <LifeBuoyIcon /> Нужна помощь
              </Button>
            }
          />
          <PostponeTaskDialog
            task={task.title}
            trigger={
              <Button variant="ghost" className={MOCK_BORDER}>
                <PauseIcon /> Отложить
              </Button>
            }
          />
        </>
      )}
      {can('update') && !isExecutor && (
        <Button variant="outline" className={`bg-canvas ${MOCK_BORDER}`}>
          <BellIcon /> Напомнить исполнителю
        </Button>
      )}

      {can('return') && (
        <ReviewTaskDialog
          mode="return"
          task={task}
          assigneeName={assigneeName}
          trigger={
            <Button variant="outline" className="bg-canvas">
              <RotateCcwIcon /> Вернуть
            </Button>
          }
        />
      )}
      {can('approve') && (
        <ReviewTaskDialog
          mode="accept"
          task={task}
          assigneeName={assigneeName}
          trigger={
            <Button className="shadow-control">
              <CircleCheckIcon /> Принять
            </Button>
          }
        />
      )}

      {/* Повторный start у задачи в работе бэк принимает, но ничего не меняет — кнопку показываем только до начала */}
      {can('start') && task.status === 'open' && (
        <Button className="shadow-control" disabled={startTask.isPending} onClick={() => startTask.mutate({ version: task.version })}>
          {startTask.isPending ? <Spinner /> : <CirclePlayIcon />} Начать
        </Button>
      )}
      {can('complete') && task.status === 'in_progress' && (
        <CompleteTaskDialog
          task={task}
          trigger={
            <Button className="shadow-control">
              <SendIcon /> {task.requires_review ? 'Выполнено, на проверку' : 'Выполнено'}
            </Button>
          }
        />
      )}
    </>
  )
}
