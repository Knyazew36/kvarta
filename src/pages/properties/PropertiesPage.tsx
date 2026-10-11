import { Link, useSearchParams } from 'react-router'
import { isEmployee, useCurrentOrganization } from '@/entities/organization'
import { ListPropertiesStatus } from '@/shared/api/generated/models'
import { to } from '@/shared/config/paths'
import { StateView } from '@/shared/ui/rb/StateView'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { PropertiesFilter } from './components/PropertiesFilter'
import { PropertiesHeader } from './components/PropertiesHeader'
import { PropertiesList } from './components/PropertiesList'

// Статус хранится в ссылке, как и остальные фильтры; без параметра или с мусором — активные, как на бэке
const parseStatus = (value: string | null): ListPropertiesStatus =>
  value === ListPropertiesStatus.archived || value === ListPropertiesStatus.all ? value : ListPropertiesStatus.active

const PropertiesPage = () => {
  const { organization, role } = useCurrentOrganization()
  const [params] = useSearchParams()
  const status = parseStatus(params.get('status'))
  const orgId = String(organization.id)

  // Раздел — для владельца и управляющих: сотруднику адрес и инструкции приходят в задаче
  if (isEmployee(role)) {
    return (
      <div className="flex flex-col gap-10 pb-8">
        <PropertiesHeader organizationId={organization.id} status={status} />
        <StateView
          state="denied"
          denied={{
            title: 'Объекты недоступны',
            description: 'Настройки объектов видят владелец и управляющие. Адрес и инструкции по вашей работе — в карточке задачи.',
            action: (
              <Button variant="secondary" size="sm" asChild>
                <Link to={to.tasks(orgId)}>Мои задачи</Link>
              </Button>
            ),
          }}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 pb-8">
      <PropertiesHeader organizationId={organization.id} status={status} canCreate={role === 'owner'} showCount />
      <div className="flex flex-col gap-4">
        <PropertiesFilter status={status} />
        <PropertiesList organizationId={organization.id} status={status} search={params.get('q') ?? ''} canCreate={role === 'owner'} />
      </div>
    </div>
  )
}

export default PropertiesPage
