import { useCurrentOrganization } from '@/entities/organization'
import { useTasks } from '@/entities/task'

// Мои задачи дня — две подборки бэка с фильтром по исполнителю: «сегодня» и «просроченные».
// Обе бэк сам ограничивает задачами open и in_progress. Блоки и сводка зовут хук порознь — запросы общие по ключу
export const useMyTasks = () => {
  const { organization } = useCurrentOrganization()
  const mine = { assigneeMembershipId: organization.membership.id }
  const todayQuery = useTasks(organization.id, { view: 'today', ...mine })
  const overdueQuery = useTasks(organization.id, { view: 'overdue', ...mine })

  return {
    organizationId: organization.id,
    todayQuery,
    overdueQuery,
    // Срок сегодня, но уже прошёл — задача есть в обеих подборках: остаётся в «Моих задачах» и дублируется в «Требует решения»
    today: todayQuery.data?.pages.flatMap((page) => page.data),
    overdue: overdueQuery.data?.pages.flatMap((page) => page.data),
    overdueTotal: overdueQuery.data?.pages[0]?.meta.total ?? 0,
  }
}
