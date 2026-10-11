import type { TaskListFilters } from '@/entities/task'

export type TabKey = 'today' | 'my' | 'upcoming' | 'overdue' | 'review' | 'team' | 'completed'

export const TAB_LABEL: Record<TabKey, string> = {
  my: 'Мои',
  today: 'Сегодня',
  upcoming: 'Предстоящие',
  overdue: 'Просроченные',
  review: 'На проверке',
  team: 'Сотрудников',
  completed: 'Выполненные',
}

// Подборка — это готовое представление бэка (view) или статус, а не фильтр на фронте.
// today/upcoming/overdue бэк сам ограничивает задачами open и in_progress
export const TAB_FILTERS: Record<TabKey, TaskListFilters> = {
  today: { view: 'today' },
  my: { view: 'mine' },
  upcoming: { view: 'upcoming' },
  overdue: { view: 'overdue' },
  review: { status: 'in_review' },
  team: { view: 'staff' },
  completed: { status: 'completed' },
}

// Сотрудник видит только свои задачи: «На проверке» ему не нужна, а view=staff бэк ему не отдаёт (403)
export const getTabKeys = (employee: boolean): TabKey[] => employee ? ['my', 'today', 'upcoming', 'overdue', 'completed'] : ['today', 'my', 'upcoming', 'overdue', 'review', 'team', 'completed']

const parseId = (value: string | null) => (value && /^\d+$/.test(value) ? Number(value) : undefined)

// Фильтры хранятся в ссылке: объект — ?object (его пишет PropertyFilter), исполнитель — ?assignee
export const parseBaseFilters = (params: URLSearchParams): TaskListFilters => ({
  propertyId: parseId(params.get('object')),
  assigneeMembershipId: parseId(params.get('assignee')),
})
