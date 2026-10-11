import { PlusIcon } from 'lucide-react'
import { useAllProperties } from '@/entities/property'
import type { ListPropertiesStatus } from '@/shared/api/generated/models'
import { DEMO_TZ, pluralize } from '@/shared/lib/format'
import { MOCK_BORDER } from '@/shared/mock/mock-border'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { CreatePropertyDialog } from '@/widgets/property-actions/CreatePropertyDialog'

const COUNT_SUFFIX: Record<ListPropertiesStatus, string> = {
  active: '',
  archived: ' в архиве',
  all: ' вместе с архивом',
}

type PropertiesHeaderProps = {
  organizationId: number
  status: ListPropertiesStatus
  canCreate?: boolean
  // Счётчик берётся из того же запроса, что и список: второй раз на бэк не ходим
  showCount?: boolean
}

export const PropertiesHeader = ({ organizationId, status, canCreate, showCount }: PropertiesHeaderProps) => (
  <header className="flex flex-col gap-6 pt-4 md:pt-10">
    <p className="text-caption text-smoke">
      Объекты организации · {/* Обмена с площадками на бэке пока нет */}
      <span className={MOCK_BORDER}>обмен с площадками 09:32 {DEMO_TZ}</span>
    </p>
    <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
      <div className="flex flex-col gap-4">
        <h1 className="text-heading font-semibold tracking-[-0.03em] md:text-heading-lg">Объекты</h1>
        {showCount && <PropertiesCount organizationId={organizationId} status={status} />}
      </div>
      {canCreate && (
        <CreatePropertyDialog
          trigger={
            <Button className="self-start shadow-control md:self-auto">
              <PlusIcon /> Добавить объект
            </Button>
          }
        />
      )}
    </div>
  </header>
)

const PropertiesCount = ({ organizationId, status }: { organizationId: number; status: ListPropertiesStatus }) => {
  const { data: properties } = useAllProperties(organizationId, status)

  if (!properties || properties.length === 0) return null

  return (
    <p className="max-w-2xl text-subheading-lg text-slate">
      {pluralize(properties.length, ['объект', 'объекта', 'объектов'])}
      {COUNT_SUFFIX[status]}.
    </p>
  )
}
