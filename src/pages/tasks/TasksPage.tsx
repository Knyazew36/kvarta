import { useSearchParams } from 'react-router'
import { isEmployee, useCurrentOrganization } from '@/entities/organization'
import { TasksFilter } from './components/TasksFilter'
import { TasksHeader } from './components/TasksHeader'
import { TasksList } from './components/TasksList'
import { TasksTabs } from './components/TasksTabs'
import { getTabKeys, parseBaseFilters, TAB_FILTERS, type TabKey } from './tabs'

const TasksPage = () => {
  const { organization, role } = useCurrentOrganization()
  const [params] = useSearchParams()
  const employee = isEmployee(role)

  // Подборка хранится в ссылке; без параметра или с чужой подборкой — первая доступная роли
  const tabKeys = getTabKeys(employee)
  const requested = params.get('tab') as TabKey | null
  const tab: TabKey = requested && tabKeys.includes(requested) ? requested : tabKeys[0]

  const baseFilters = parseBaseFilters(params)
  const filtered = baseFilters.propertyId !== undefined || baseFilters.assigneeMembershipId !== undefined

  return (
    <div className="flex flex-col gap-8 pb-8">
      <TasksHeader organizationId={organization.id} employee={employee} baseFilters={baseFilters} />
      <div className="flex flex-col gap-4">
        <TasksTabs organizationId={organization.id} tabKeys={tabKeys} tab={tab} baseFilters={baseFilters} />
        <TasksFilter organizationId={organization.id} employee={employee} />
        <TasksList organizationId={organization.id} filters={{ ...TAB_FILTERS[tab], ...baseFilters }} tab={tab} filtered={filtered} />
      </div>
    </div>
  )
}

export default TasksPage
