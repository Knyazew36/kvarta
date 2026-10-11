import { isEmployee, useCurrentOrganization } from '@/entities/organization'
import { SeriesList } from './components/SeriesList'
import { SeriesListHeader } from './components/SeriesListHeader'

const TaskSeriesPage = () => {
  const { organization, role } = useCurrentOrganization()
  const employee = isEmployee(role)

  return (
    <div className="flex flex-col gap-8 pb-8">
      <SeriesListHeader organizationId={organization.id} employee={employee} />
      <SeriesList organizationId={organization.id} employee={employee} />
    </div>
  )
}

export default TaskSeriesPage
