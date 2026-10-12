import { ArchiveIcon, ArchiveRestoreIcon, ArrowUpRightIcon } from 'lucide-react'
import { Link } from 'react-router'
import { useRestoreProperty } from '@/entities/property'
import type { Property, PropertyWork } from '@/shared/api/generated/models'
import { to } from '@/shared/config/paths'
import { NO_DATA, pluralize } from '@/shared/lib/format'
import { MOCK_BORDER } from '@/shared/mock/mock-border'
import { PersonName } from '@/shared/ui/rb/PersonAvatar'
import { RecordHeader } from '@/shared/ui/rb/RecordHeader'
import { PROPERTY_STATUS, PUBLIC_STATUS } from '@/shared/ui/rb/status-presets'
import { StatusFromMeta } from '@/shared/ui/rb/StatusBadge'
import { SyncFreshness } from '@/shared/ui/rb/SyncFreshness'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Spinner } from '@/shared/ui/shadcn/spinner'
import { ArchivePropertyDialog } from '@/widgets/property-actions/ArchivePropertyDialog'
import { MOCK_PROPERTY } from '../model/mock'

// Значение, которого на бэке ещё нет: обводим само значение, подпись факта остаётся обычной
const Mock = ({ children }: { children: React.ReactNode }) => <span className={MOCK_BORDER}>{children}</span>

type PropertyHeaderProps = {
  property: Property | PropertyWork
  orgId: string
  // Архив и восстановление — только владельцу, остальным бэк ответит 403
  isOwner: boolean
}

export const PropertyHeader = ({ property, orgId, isOwner }: PropertyHeaderProps) => {
  const restoreProperty = useRestoreProperty(property.organization_id, property.id)
  const archived = property.status === 'archived'

  return (
    <RecordHeader
      className="shadow-card"
      back={{ to: to.properties(orgId), label: 'Объекты' }}
      eyebrow={`Объект #${property.id}`}
      title={property.name}
      status={
        <>
          <StatusFromMeta meta={PROPERTY_STATUS[property.status]} />
          <StatusFromMeta meta={PUBLIC_STATUS[MOCK_PROPERTY.publicity]} className={MOCK_BORDER} />
          {MOCK_PROPERTY.syncs.map((sync) => (
            <SyncFreshness key={sync.source} sync={sync} compact className={MOCK_BORDER} />
          ))}
        </>
      }
      facts={[
        { label: 'Адрес', value: property.address ? <span title={property.address}>{property.address}</span> : NO_DATA },
        { label: 'Вместимость', value: property.capacity ? pluralize(property.capacity, ['гость', 'гостя', 'гостей']) : NO_DATA },
        {
          label: 'Заезд / выезд',
          value: property.check_in_time || property.check_out_time ? `${property.check_in_time ?? '—'} / ${property.check_out_time ?? '—'}` : NO_DATA,
        },
        { label: 'Часовой пояс', value: property.timezone ?? NO_DATA },
        { label: 'Ближайший заезд', value: <Mock>{MOCK_PROPERTY.next}</Mock> },
        {
          label: 'Ответственный',
          value: (
            <Mock>
              <PersonName name={MOCK_PROPERTY.responsible} />
            </Mock>
          ),
        },
        { label: 'Площадок', value: <Mock>{MOCK_PROPERTY.syncs.length}</Mock> },
      ]}
      secondaryActions={
        <>
          {/* Публичной страницы объекта на бэке нет */}
          <Button variant="secondary" className={MOCK_BORDER} asChild>
            <Link to={to.hostProperty(MOCK_PROPERTY.id)}>
              Как видит гость <ArrowUpRightIcon />
            </Link>
          </Button>
          {isOwner &&
            (archived ? (
              <Button variant="outline" disabled={restoreProperty.isPending} onClick={() => restoreProperty.mutate()}>
                {restoreProperty.isPending ? <Spinner /> : <ArchiveRestoreIcon />} Восстановить
              </Button>
            ) : (
              <ArchivePropertyDialog
                organizationId={property.organization_id}
                property={property}
                trigger={
                  <Button variant="secondary">
                    <ArchiveIcon /> В архив
                  </Button>
                }
              />
            ))}
        </>
      }
    />
  )
}
