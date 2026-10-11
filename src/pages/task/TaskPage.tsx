import { isAxiosError } from 'axios'
import { RefreshCwIcon, TriangleAlertIcon } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { isEmployee, useCurrentOrganization } from '@/entities/organization'
import { formatDue, useTask } from '@/entities/task'
import { to } from '@/shared/config/paths'
import { DeviationNote } from '@/shared/mock/DeviationNote'
import { SectionCard } from '@/shared/ui/rb/Section'
import { StateView } from '@/shared/ui/rb/StateView'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { TaskChecklist } from './components/TaskChecklist'
import { TaskHeader } from './components/TaskHeader'
import { TaskHistory } from './components/TaskHistory'
import { TaskPhotos } from './components/TaskPhotos'
import { TaskReport, TaskReturnedNote } from './components/TaskReport'
import { TaskSidebar } from './components/TaskSidebar'

const TaskPage = () => {
  const { organization, role } = useCurrentOrganization()
  const { taskId = '' } = useParams()
  const orgId = String(organization.id)
  const employee = isEmployee(role)
  // Бэк принимает только числовой id; остальное (старые ссылки макетов вида /tasks/t-301) — «не найдена» без запроса
  const isValidId = /^\d+$/.test(taskId)
  const { data: task, isPending, isError, error, refetch, isRefetching } = useTask(organization.id, Number(taskId))

  // 404 — задачи нет, она не назначена сотруднику или её объект недоступен текущему участнику
  if (!isValidId || (isError && isAxiosError(error) && error.response?.status === 404)) {
    return (
      <StateView
        state="empty"
        className="mt-4 md:mt-10"
        empty={{
          title: 'Задача не найдена',
          description: employee
            ? 'Ссылка устарела или задача назначена не вам. Если вас попросили помочь, попросите переназначить задачу.'
            : 'Ссылка устарела или объект этой задачи вам не назначен. Проверьте список задач.',
          action: (
            <Button variant="outline" size="sm" asChild>
              <Link to={to.tasks(orgId)}>К задачам</Link>
            </Button>
          ),
        }}
      />
    )
  }

  if (isPending) return <StateView state="loading" skeleton="record" className="pt-4 md:pt-10" />

  if (isError) {
    return (
      <StateView
        state="error"
        className="mt-4 md:mt-10"
        error={{
          title: 'Задача не загрузилась',
          description: 'Проверьте соединение и повторите попытку.',
          action: (
            <Button variant="outline" size="sm" disabled={isRefetching} onClick={() => refetch()}>
              <RefreshCwIcon /> Повторить
            </Button>
          ),
        }}
      />
    )
  }

  const report = task.current_report
  const returned = report?.decision === 'returned' && task.status === 'in_progress'

  return (
    <div className="flex flex-col gap-6 pt-4 pb-8 md:pt-8">
      <TaskHeader task={task} orgId={orgId} employee={employee} />

      <DeviationNote reason="Статуса «Запланирована» на бэке нет, а «Возвращена» и «Просрочена» вычисляются на фронте: по решению в последнем отчёте и флагу просрочки." />

      {task.is_overdue && (
        <p role="status" className="flex items-start gap-3 rounded-card bg-destructive/10 p-5 text-body-sm text-destructive dark:bg-destructive/20">
          <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
          Срок истёк: {formatDue(task.due_at, task.timezone)}.
        </p>
      )}

      <div className="grid items-start gap-4 lg:grid-cols-[1fr_360px]">
        <div className="flex min-w-0 flex-col gap-4">
          {returned && <TaskReturnedNote task={task} report={report} />}

          <SectionCard title="Что сделать">
            {task.description ? <p className="whitespace-pre-line text-body text-slate">{task.description}</p> : <p className="text-body-sm text-smoke">Без описания</p>}
            {task.checklist.length > 0 && <TaskChecklist task={task} />}
          </SectionCard>

          <TaskPhotos task={task} />

          {/* Возвращённый отчёт уже показан плашкой выше; его фото и текст остаются в истории */}
          {report && !returned && <TaskReport task={task} report={report} />}

          <TaskHistory task={task} />
        </div>

        <TaskSidebar task={task} orgId={orgId} employee={employee} />
      </div>
    </div>
  )
}

export default TaskPage
