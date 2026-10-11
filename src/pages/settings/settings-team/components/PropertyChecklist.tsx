import type { Property, PropertyWork } from '@/shared/api/generated/models'
import { ErrorText } from '@/shared/ui/rb/ErrorText'
import { Checkbox } from '@/shared/ui/shadcn/animate-ui/components/radix/checkbox'
import { Skeleton } from '@/shared/ui/shadcn/skeleton'

type PropertyChecklistProps = {
  value: number[]
  onChange: (propertyIds: number[]) => void
  // Активные объекты в доступе назначающего: только их бэк принимает в property_ids. undefined — ещё грузятся
  properties: (Property | PropertyWork)[] | undefined
  error?: { message?: string }
}

// Поле объектов для диалогов приглашения и доступа; в форму подключается через Controller
export const PropertyChecklist = ({ value, onChange, properties, error }: PropertyChecklistProps) => {
  const toggle = (propertyId: number) => onChange(value.includes(propertyId) ? value.filter((id) => id !== propertyId) : [...value, propertyId])

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-body-sm font-medium">Объекты</legend>
      {!properties && (
        <div className="flex flex-col gap-2" aria-busy="true" aria-label="Загрузка объектов">
          <Skeleton className="h-6 w-2/3 rounded-full" />
          <Skeleton className="h-6 w-1/2 rounded-full" />
        </div>
      )}
      {properties?.length === 0 && <span className="text-body-sm text-smoke">Активных объектов нет — доступ к объектам можно выдать позже.</span>}
      {properties?.map((property) => (
        <label key={property.id} className="flex cursor-pointer items-center gap-3 rounded-xl px-1 py-1.5 text-body-sm">
          <Checkbox checked={value.includes(property.id)} onCheckedChange={() => toggle(property.id)} />
          {property.name}
        </label>
      ))}
      <ErrorText errors={error} />
    </fieldset>
  )
}
