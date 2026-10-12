import { useParams } from 'react-router'
import { useTasksCount } from '@/entities/task'

// Настоящие счётчики меню по ключу пункта; у остальных пунктов остаётся `badge` из nav.ts.
// Задачи — подборка бэка «сегодня» (open и in_progress): тот же запрос, что у вкладки и сводки на странице задач
export const useNavBadges = (): Partial<Record<string, number>> => {
  const { orgId } = useParams()
  const organizationId = Number(orgId)
  // Меню рисуется и вне настоящей организации (витрина /ui, демо-id) — туда за счётчиком не ходим
  const { data: tasksToday } = useTasksCount(organizationId, { view: 'today' }, { enabled: Number.isInteger(organizationId) && organizationId > 0 })

  // Ноль не показываем: бейдж — про то, что есть работа
  return { tasks: tasksToday || undefined }
}
