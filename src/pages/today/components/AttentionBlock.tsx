import { ArrowRightIcon } from 'lucide-react'
import { Link } from 'react-router'
import { getDueLabel } from '@/entities/task'
import type { Task } from '@/shared/api/generated/models'
import { to } from '@/shared/config/paths'
import { cn } from '@/shared/lib/utils'
import { MOCK_BORDER } from '@/shared/mock/mock-border'
import { PersonName } from '@/shared/ui/rb/PersonAvatar'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { useMyTasks } from '../model/use-my-tasks'

export type Attention = {
  id: string
  title: string
  subtitle: string
  href: string
  label: string
  person?: string
  danger?: boolean
  money?: boolean
  // Строка из макетных данных — обводится красным
  mock?: boolean
}

const toAttention = (task: Task): Attention => {
  const due = task.due_at ? getDueLabel(task.due_at, task.timezone) : null
  const place = task.property_context?.name ?? (task.visibility === 'personal' ? 'Личная задача' : 'Без объекта')

  return {
    id: `task-${task.id}`,
    title: task.title,
    subtitle: due ? `${place} · срок был ${due.isToday ? `сегодня в ${due.time}` : `${due.date}, ${due.time}`}` : place,
    href: to.task(task.id, String(task.organization_id)),
    // Начатую задачу видно и здесь: срок сгорел, но работа уже идёт
    label: task.status === 'in_progress' ? 'Просрочено · в работе' : 'Просрочено',
    danger: true,
  }
}

// Единственная ink-зона экрана: сюда смотрят первым, поэтому только она контрастная.
// Мои просроченные задачи приходят с бэка и идут первыми — срок уже сгорел; остальные поводы пока макетные
export const AttentionBlock = ({ mockItems = [] }: { mockItems?: Attention[] }) => {
  const { organizationId, overdue = [], overdueTotal, overdueQuery } = useMyTasks()
  const items = [...overdue.map(toAttention), ...mockItems.map((item) => ({ ...item, mock: true }))]
  // Бэк отдаёт просроченные по 20: в счётчике — все, а не только загруженные
  const count = overdueTotal - overdue.length + items.length

  if (items.length === 0) return null

  return (
    <section className="flex flex-col gap-6 rounded-card bg-foreground p-4 text-background shadow-card md:p-8 dark:bg-mist dark:text-foreground">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="section-heading text-subheading-lg">
          Требует внимания
          <span className="ml-2 text-smoke">{count}</span>
        </h2>
        <Button variant="accent" size="sm" asChild className="self-start shadow-control sm:self-auto">
          <Link to={items[0].href}>
            Начать с первого <ArrowRightIcon />
          </Link>
        </Button>
      </div>
      <ol className="-mx-3 flex flex-col">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              to={item.href}
              className={cn(
                'group/row grid grid-cols-[1fr_auto] items-baseline gap-x-6 gap-y-1 rounded-2xl p-3 outline-none transition-colors hover:bg-background/8 focus-visible:bg-background/8 dark:hover:bg-foreground/5 dark:focus-visible:bg-foreground/5',
                item.mock && MOCK_BORDER,
              )}
            >
              <span className="text-body font-medium">{item.title}</span>
              <span className={cn('inline-flex items-center gap-1.5 text-caption', item.danger ? 'text-[#ff8a7a]' : 'text-smoke')}>
                {item.danger && <span className="size-1.5 rounded-full bg-current" aria-hidden />}
                {item.label}
              </span>
              <span className="col-span-2 flex flex-wrap items-center gap-x-1.5 text-body-sm text-smoke">
                {item.subtitle}
                {item.person && (
                  <>
                    <span aria-hidden>·</span>
                    <PersonName name={item.person} tone="inverse" />
                  </>
                )}
              </span>
            </Link>
          </li>
        ))}
      </ol>
      {overdueQuery.hasNextPage && (
        <Link to={`${to.tasks(String(organizationId))}?tab=overdue`} className="text-body-sm text-smoke underline-offset-4 hover:underline">
          Все просроченные задачи
        </Link>
      )}
    </section>
  )
}
