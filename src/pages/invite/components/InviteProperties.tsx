import { HouseIcon } from 'lucide-react'
import { pluralize } from '@/shared/lib/format'
import { RevealItem } from '@/shared/ui/rb/motion'

// Бэк отдаёт только property_ids: названий нет, приглашённый ещё не участник и объектов не видит — показываем количество
export const InviteProperties = ({ propertyIds }: { propertyIds: number[] }) => (
  <RevealItem className="rounded-card bg-card shadow-card flex flex-col gap-4 p-4 md:p-6 md:col-span-2">
    <h2 className="section-heading text-subheading-lg">
      Объекты <span className="text-smoke ml-1">{propertyIds.length}</span>
    </h2>
    <p className="text-body-sm text-slate flex items-start gap-3">
      <HouseIcon className="text-smoke mt-0.5 size-4 shrink-0" aria-hidden />
      {propertyIds.length === 0
        ? 'Объекты пока не назначены — будут доступны только личные задачи. Доступ к объектам выдаст владелец или управляющий.'
        : `Вам назначен доступ к ${pluralize(propertyIds.length, ['объекту', 'объектам', 'объектам'])}. Названия и адреса появятся в кабинете после принятия.`}
    </p>
  </RevealItem>
)
