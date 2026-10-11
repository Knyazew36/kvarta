import { useQueries } from '@tanstack/react-query'
import { useSearchParams } from 'react-router'
import { type TaskListFilters, tasksCountQueryOptions } from '@/entities/task'
import { DeviationNote } from '@/shared/mock/DeviationNote'
import { ResponsiveTabs, type TabDef } from '@/shared/ui/rb/ResponsiveTabs'
import { TAB_FILTERS, TAB_LABEL, type TabKey } from '../tabs'

type TasksTabsProps = {
  organizationId: number
  tabKeys: TabKey[]
  tab: TabKey
  baseFilters: TaskListFilters
}

export const TasksTabs = ({ organizationId, tabKeys, tab, baseFilters }: TasksTabsProps) => {
  const [, setParams] = useSearchParams()
  // Счётчик на вкладку — meta.total первой страницы этой подборки: отдельной ручки счётчиков на бэке нет
  const counts = useQueries({ queries: tabKeys.map((key) => tasksCountQueryOptions(organizationId, { ...TAB_FILTERS[key], ...baseFilters })) })

  const tabs: TabDef[] = tabKeys.map((key, index) => {
    const count = counts[index].data
    return { value: key, label: TAB_LABEL[key], count, attention: (key === 'overdue' || key === 'review') && !!count }
  })

  const switchTab = (next: string) =>
    setParams(
      (prev) => {
        const nextParams = new URLSearchParams(prev)
        nextParams.set('tab', next)
        return nextParams
      },
      { replace: true },
    )

  return (
    <DeviationNote reason="«Сегодня» и «Предстоящие» считаются по часовому поясу браузера, а не объекта: бэк принимает один пояс на запрос. «Мои» и «Сотрудников» включают завершённые и отменённые: отфильтровать только активные вместе с этими подборками бэк не умеет.">
      <ResponsiveTabs tabs={tabs} value={tab} label="Подборка задач" onValueChange={switchTab} />
    </DeviationNote>
  )
}
