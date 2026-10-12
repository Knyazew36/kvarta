import { PlusIcon, RefreshCwIcon } from 'lucide-react'
import { Link } from 'react-router'
import { useAllProperties } from '@/entities/property'
import type { ListPropertiesStatus } from '@/shared/api/generated/models'
import { to } from '@/shared/config/paths'
import { StateView } from '@/shared/ui/rb/StateView'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { CreatePropertyDialog } from '@/widgets/property-actions/CreatePropertyDialog'
import { PropertyCard } from './PropertyCard'

type PropertiesListProps = {
  organizationId: number
  status: ListPropertiesStatus
  search: string
  canCreate: boolean
}

export const PropertiesList = ({ organizationId, status, search, canCreate }: PropertiesListProps) => {
  const { data: properties, isPending, isError, refetch, isRefetching } = useAllProperties(organizationId, status)
  const orgId = String(organizationId)

  if (isPending) return <StateView state="loading" skeleton="cards" />

  if (isError) {
    return (
      <StateView
        state="error"
        error={{
          title: 'Список объектов не загрузился',
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

  // Пусто без фильтров — объектов в организации ещё нет (или ни один не назначен управляющему)
  if (properties.length === 0 && status === 'active') {
    return (
      <StateView
        state="empty"
        empty={
          canCreate
            ? {
                title: 'Объектов пока нет',
                description: 'Начните с одного: достаточно названия. Площадки, фото и прямое бронирование подключаются потом, по одному.',
                action: (
                  <>
                    <CreatePropertyDialog
                      trigger={
                        <Button variant="outline" size="sm">
                          <PlusIcon /> Добавить объект
                        </Button>
                      }
                    />
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={to.onboarding(orgId)}>Первые шаги</Link>
                    </Button>
                  </>
                ),
              }
            : {
                title: 'Вам пока не назначены объекты',
                description: 'Объекты добавляет владелец организации и назначает их участникам команды.',
              }
        }
      />
    )
  }

  const query = search.trim().toLowerCase()
  const list = query ? properties.filter((property) => `${property.name} ${property.address ?? ''}`.toLowerCase().includes(query)) : properties

  if (list.length === 0) {
    return (
      <div className="flex flex-col items-start gap-2 rounded-card bg-card p-4 shadow-card md:p-8">
        <span className="text-body font-medium">Под фильтр ничего не попало</span>
        <span className="text-body-sm text-slate">Измените условия или сбросьте фильтры.</span>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {list.map((property) => (
        <PropertyCard key={property.id} property={property} orgId={orgId} />
      ))}
    </div>
  )
}
