import { BellIcon, RepeatIcon } from 'lucide-react'
import { Link } from 'react-router'
import { useTaskPeople } from '@/entities/task'
import type { Task } from '@/shared/api/generated/models'
import { to } from '@/shared/config/paths'
import { DeviationNote } from '@/shared/mock/DeviationNote'
import { MOCK_BORDER } from '@/shared/mock/mock-border'
import { PersonLine } from '@/shared/ui/rb/PersonAvatar'
import { SectionCard } from '@/shared/ui/rb/Section'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

type TaskSidebarProps = {
  task: Task
  orgId: string
  employee: boolean
}

export const TaskSidebar = ({ task, orgId, employee }: TaskSidebarProps) => {
  const { myMembershipId, myUserId, canSeeNames, memberName, userName } = useTaskPeople()
  const isExecutor = task.assignee_membership_id === myMembershipId

  const people = (
    <div className="flex flex-col gap-4">
      <PersonLine name={memberName(task.assignee_membership_id)} caption={isExecutor ? 'исполнитель · вы' : 'исполнитель'} />
      {!task.requires_review ? (
        <span className="text-body-sm text-slate">Без проверки: задача закроется, как только исполнитель её отметит.</span>
      ) : task.reviewer_membership_id !== null ? (
        <PersonLine name={memberName(task.reviewer_membership_id)} caption={task.reviewer_membership_id === myMembershipId ? 'проверяющий · вы' : 'проверяющий'} />
      ) : (
        // Отдельный проверяющий не назначен — отчёт принимает автор
        <PersonLine name={userName(task.author_id)} caption={task.author_id === myUserId ? 'проверяет автор · вы' : 'проверяет автор'} />
      )}
      {task.needs_reassignment && <span className="text-body-sm text-destructive">Исполнитель потерял доступ к объекту — задачу нужно переназначить.</span>}
    </div>
  )

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <SectionCard title="Где">
        {task.property_context ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-body-sm font-medium">{task.property_context.name}</span>
              {task.property_context.address && <span className="text-body-sm text-slate">{task.property_context.address}</span>}
              {task.property_archived && <span className="text-caption text-smoke">Объект в архиве</span>}
            </div>
            {task.booking_id !== null && (
              <div className="flex flex-col gap-0.5 rounded-2xl bg-mist p-3">
                <span className="mono-label text-smoke">Бронь #{task.booking_id}</span>
                {/* Гостя, даты и суммы бэк в задачу не подмешивает — они в карточке брони, а сотруднику она закрыта */}
                {employee ? (
                  <span className="text-body-sm text-slate">Связь справочная: изменение брони не меняет срок задачи.</span>
                ) : (
                  <Link to={to.booking(task.booking_id, orgId)} className="text-body-sm hover:underline">
                    Открыть бронь
                  </Link>
                )}
              </div>
            )}
          </div>
        ) : (
          <p className="text-body-sm text-slate">Задача не привязана к объекту.</p>
        )}
      </SectionCard>

      <SectionCard title="Люди">
        {canSeeNames ? people : <DeviationNote reason="Имена коллег скрыты: бэк отдаёт список участников только руководящим ролям.">{people}</DeviationNote>}
      </SectionCard>

      {/* Напоминаний по задаче на бэке нет: блок остаётся макетом */}
      <SectionCard title="Напоминания" className={MOCK_BORDER}>
        <ul className="flex flex-col gap-2">
          {['За час до срока', 'При просрочке — проверяющему'].map((reminder) => (
            <li key={reminder} className="flex items-start gap-2 text-body-sm">
              <BellIcon className="mt-0.5 size-3.5 shrink-0 text-smoke" aria-hidden />
              {reminder}
            </li>
          ))}
        </ul>
      </SectionCard>

      {task.series_id !== null && (
        <SectionCard title="Серия">
          <div className="flex flex-col gap-3">
            <span className="flex items-start gap-2 text-body-sm">
              <RepeatIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span className="flex flex-col gap-0.5">
                <span className="font-medium">Задача</span>
                <span className="text-slate">
                  {task.series_exception ? 'Исключение: изменения правила серии её не затронут.' : 'Следует правилу серии, пока по ней не начата работа.'}
                </span>
              </span>
            </span>
            {/* Карточку серии назначенному сотруднику бэк не отдаёт: он получает только задачи */}
            {!employee && (
              <Button variant="outline" size="sm" className="self-start bg-canvas" asChild>
                <Link to={to.taskSeriesItem(task.series_id, orgId)}>Открыть серию</Link>
              </Button>
            )}
          </div>
        </SectionCard>
      )}

    </div>
  )
}
