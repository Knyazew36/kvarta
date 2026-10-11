import { zodResolver } from '@hookform/resolvers/zod'
import { ArchiveIcon, CalendarClockIcon, ImageIcon, ImagePlusIcon, LockIcon } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useCurrentOrganization } from '@/entities/organization'
import {
  type PropertyInfoInput,
  type PropertyInfoValues,
  propertyInfoSchema,
  useCurrentProperty,
  useUpdateProperty,
} from '@/entities/property'
import type { Property, PropertyUpdate, PropertyWork } from '@/shared/api/generated/models'
import { getFieldErrors } from '@/shared/api/model/getFieldErrors'
import { cn } from '@/shared/lib/utils'
import { MOCK_BORDER } from '@/shared/mock/mock-border'
import { ErrorText } from '@/shared/ui/rb/ErrorText'
import { SectionCard } from '@/shared/ui/rb/Section'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Switch } from '@/shared/ui/shadcn/animate-ui/components/radix/switch'
import { Input } from '@/shared/ui/shadcn/input'
import { Label } from '@/shared/ui/shadcn/label'
import { Spinner } from '@/shared/ui/shadcn/spinner'
import { Textarea } from '@/shared/ui/shadcn/textarea'

// ── Макетные данные: фото на бэке нет ───────────────────────────────────────

const MOCK_PHOTOS = ['Комната', 'Кухня', 'Ванная', 'Вид из окна', 'Подъезд']

// ── Поля ────────────────────────────────────────────────────────────────────

type FieldName = keyof PropertyInfoInput

const FIELD_NAMES: FieldName[] = ['name', 'public_title', 'address', 'timezone', 'check_in_time', 'check_out_time', 'capacity', 'description', 'internal_notes']

type FieldProps = {
  id: string
  label: string
  hint?: string
  error?: { message?: string }
  children: React.ReactNode
  className?: string
}

const Field = ({ id, label, hint, error, children, className }: FieldProps) => (
  <div className={cn('flex flex-col gap-2', className)}>
    <Label htmlFor={id} className="text-body-sm font-medium">
      {label}
    </Label>
    {children}
    <ErrorText id={`${id}-error`} errors={error} />
    {hint && !error && <span className="text-caption text-smoke">{hint}</span>}
  </div>
)

// Значения формы из ответа бэка. Управляющим и владельцу приходит полный объект; в кратком (PropertyWork) текстов нет
const toFormValues = (property: Property | PropertyWork): PropertyInfoInput => ({
  name: property.name,
  public_title: ('public_title' in property && property.public_title) || '',
  address: property.address ?? '',
  timezone: property.timezone ?? '',
  check_in_time: property.check_in_time ?? '',
  check_out_time: property.check_out_time ?? '',
  capacity: property.capacity ? String(property.capacity) : '',
  description: ('description' in property && property.description) || '',
  internal_notes: ('internal_notes' in property && property.internal_notes) || '',
})

// ── Страница ────────────────────────────────────────────────────────────────

const PropertyInfoPage = () => {
  const property = useCurrentProperty()
  const { role } = useCurrentOrganization()
  // Правят владелец и управляющий; администратор только смотрит
  const canEdit = role === 'owner' || role === 'manager'
  const updateProperty = useUpdateProperty(property.organization_id, property.id)
  const archived = property.status === 'archived'
  // Архивный объект бэк править не даёт (409) — поля закрыты до восстановления
  const readOnly = !canEdit || archived
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isDirty, dirtyFields },
    // values: форма подхватывает ответ бэка после сохранения и данные другого объекта при переходе — и снова считается неизменённой
  } = useForm<PropertyInfoInput, unknown, PropertyInfoValues>({ resolver: zodResolver(propertyInfoSchema), values: toFormValues(property) })

  const submit = handleSubmit((values) => {
    // Отправляем только изменённое: остальные поля бэк сохраняет как были
    const body: PropertyUpdate = Object.fromEntries(FIELD_NAMES.filter((name) => dirtyFields[name]).map((name) => [name, values[name]]))

    updateProperty.mutate(body, {
      onError: (error) => {
        // Ошибки бэка по полям — под инпутами; остальное показывает общий тост
        const fieldErrors = getFieldErrors(error)
        FIELD_NAMES.forEach((name) => fieldErrors[name]?.length && setError(name, { message: fieldErrors[name].join(', ') }))
      },
    })
  })

  const fieldProps = (id: string, name: FieldName) => ({
    id,
    disabled: readOnly,
    'aria-invalid': !!errors[name] || undefined,
    'aria-describedby': errors[name] ? `${id}-error` : undefined,
    ...register(name),
  })

  return (
    <form className="flex flex-col gap-4" onSubmit={submit} noValidate>
      {readOnly && (
        <div className="flex items-start gap-3 rounded-3xl bg-card p-4 shadow-card">
          {archived ? <ArchiveIcon className="mt-0.5 size-4 shrink-0 text-smoke" aria-hidden /> : <LockIcon className="mt-0.5 size-4 shrink-0 text-smoke" aria-hidden />}
          <span className="text-body-sm text-slate">
            {archived
              ? 'Объект в архиве: сведения доступны только для просмотра. Чтобы редактировать, владелец должен восстановить объект.'
              : 'Сведения объекта меняют владелец и управляющий. Вам они доступны для просмотра.'}
          </span>
        </div>
      )}

      <div className="grid items-start gap-4 lg:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-4">
          <SectionCard title="Название и описание" className="shadow-card">
            <div className="grid gap-5 md:grid-cols-2">
              <Field id="info-name" label="Внутреннее название" hint="Видят только вы и команда" error={errors.name}>
                <Input {...fieldProps('info-name', 'name')} />
              </Field>
              <Field id="info-title" label="Публичный заголовок" hint="Понадобится для страницы бронирования" error={errors.public_title}>
                <Input placeholder="Например, Студия у Невского" {...fieldProps('info-title', 'public_title')} />
              </Field>
              <Field id="info-capacity" label="Вместимость, гостей" error={errors.capacity}>
                <Input type="number" min={1} inputMode="numeric" {...fieldProps('info-capacity', 'capacity')} />
              </Field>
              <Field id="info-description" label="Описание для гостей" error={errors.description} className="md:col-span-2">
                <Textarea rows={4} placeholder="Что важно знать гостю до брони" {...fieldProps('info-description', 'description')} />
              </Field>
              <Field id="info-notes" label="Внутренние заметки" hint="Видят владелец, управляющие и администраторы" error={errors.internal_notes} className="md:col-span-2">
                <Textarea rows={3} placeholder="Где запасной ключ, с кем договариваться о парковке" {...fieldProps('info-notes', 'internal_notes')} />
              </Field>
            </div>
          </SectionCard>

          <SectionCard title="Адрес" className="shadow-card">
            <div className="flex flex-col gap-5">
              <Field id="info-address" label="Полный адрес" error={errors.address}>
                <Input {...fieldProps('info-address', 'address')} />
              </Field>
              {/* Настройки показа адреса гостю на бэке нет */}
              <label htmlFor="info-address-public" className={cn('flex cursor-pointer items-start justify-between gap-4 rounded-3xl bg-mist p-4', MOCK_BORDER)}>
                <span className="flex flex-col gap-1">
                  <span className="text-body-sm font-medium">Показывать точный адрес до брони</span>
                  <span className="text-caption text-smoke">До брони гость видит только район: «Лиговский проспект, у метро»</span>
                </span>
                <Switch id="info-address-public" />
              </label>
            </div>
          </SectionCard>

          <SectionCard title="Фото" count={`${MOCK_PHOTOS.length} из 20`} className={cn('shadow-card', MOCK_BORDER)}>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {MOCK_PHOTOS.map((photo, index) => (
                <li key={photo} className={cn('relative flex aspect-[4/3] items-end overflow-hidden rounded-3xl bg-mist p-3', index === 0 && 'ring-2 ring-foreground')}>
                  <ImageIcon className="absolute top-1/2 left-1/2 size-6 -translate-1/2 text-smoke" aria-hidden />
                  <span className="relative text-caption text-slate">{photo}</span>
                  {index === 0 && <span className="mono-label absolute top-3 left-3 rounded-full bg-foreground px-2 py-0.5 text-background">обложка</span>}
                </li>
              ))}
              <li>
                <button
                  type="button"
                  className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-foreground/20 text-body-sm text-slate outline-none transition-colors hover:bg-mist focus-visible:ring-3 focus-visible:ring-ring/30"
                >
                  <ImagePlusIcon className="size-5" aria-hidden />
                  Добавить
                </button>
              </li>
            </ul>
          </SectionCard>
        </div>

        <div className="flex flex-col gap-4 lg:sticky lg:top-24">
          <SectionCard title="Время объекта" className="shadow-card">
            <div className="flex flex-col gap-5">
              <Field id="info-tz" label="Часовой пояс" hint="Идентификатор IANA. В нём считаются даты объекта: брони, задачи, инструкции" error={errors.timezone}>
                <Input placeholder="Europe/Moscow" autoCapitalize="off" spellCheck={false} {...fieldProps('info-tz', 'timezone')} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field id="info-checkin" label="Заезд с" error={errors.check_in_time}>
                  <Input type="time" {...fieldProps('info-checkin', 'check_in_time')} />
                </Field>
                <Field id="info-checkout" label="Выезд до" error={errors.check_out_time}>
                  <Input type="time" {...fieldProps('info-checkout', 'check_out_time')} />
                </Field>
              </div>
              {/* Сколько броней и задач заденет смена времени — бэк пока не считает */}
              <div className={cn('flex items-start gap-3 rounded-3xl bg-mist p-4', MOCK_BORDER)}>
                <CalendarClockIcon className="mt-0.5 size-4 shrink-0 text-smoke" aria-hidden />
                <span className="text-body-sm text-slate">
                  Новое время применится к 3 будущим броням и сдвинет 4 задачи подготовки. Гости с подтверждёнными бронями получат уведомление.
                </span>
              </div>
            </div>
          </SectionCard>
          {!readOnly && (
            <Button type="submit" className="self-start shadow-control lg:self-stretch" disabled={!isDirty || updateProperty.isPending}>
              {updateProperty.isPending && <Spinner />} Сохранить изменения
            </Button>
          )}
        </div>
      </div>
    </form>
  )
}

export default PropertyInfoPage
