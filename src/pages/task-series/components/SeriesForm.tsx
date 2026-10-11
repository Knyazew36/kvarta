import { zodResolver } from '@hookform/resolvers/zod'
import { PlusIcon, SaveIcon, Trash2Icon } from 'lucide-react'
import { Controller, FormProvider, useFieldArray, useForm, useWatch } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { getBrowserTimezone } from '@/entities/notification'
import { isEmployee, useCurrentOrganization } from '@/entities/organization'
import { useAllProperties } from '@/entities/property'
import { todayIn, useTaskParticipants, useTaskPeople } from '@/entities/task'
import { type SeriesInput, type SeriesValues, getSeriesErrorText, seriesSchema, toSeriesCreate, useCreateTaskSeries } from '@/entities/task-series'
import { hasFieldErrors } from '@/shared/api/model/getFieldErrors'
import { to } from '@/shared/config/paths'
import { cn } from '@/shared/lib/utils'
import { ErrorText } from '@/shared/ui/rb/ErrorText'
import { PersonAvatar } from '@/shared/ui/rb/PersonAvatar'
import { RecordHeader } from '@/shared/ui/rb/RecordHeader'
import { SectionCard } from '@/shared/ui/rb/Section'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { RadioGroup, RadioGroupItem } from '@/shared/ui/shadcn/animate-ui/components/radix/radio-group'
import { Switch } from '@/shared/ui/shadcn/animate-ui/components/radix/switch'
import { Input } from '@/shared/ui/shadcn/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/shadcn/select'
import { Spinner } from '@/shared/ui/shadcn/spinner'
import { Textarea } from '@/shared/ui/shadcn/textarea'
import { TaskField } from '@/widgets/task-actions/TaskField'
import { splitSeriesFieldErrors } from './series-field-errors'
import { SeriesPreviewAside } from './SeriesPreviewAside'
import { SeriesRuleFields } from './SeriesRuleFields'

const NONE = 'none'

const FIELDS = [
  'title',
  'description',
  'property_id',
  'checklist',
  'visibility',
  'assignee_membership_id',
  'requires_photo',
  'requires_review',
  'reviewer_membership_id',
  'frequency',
  'weekdays',
  'month_day',
  'missing_day',
  'local_time',
  'timezone',
  'start_date',
  'end_date',
] as const satisfies readonly (keyof SeriesInput)[]

const IdSelect = ({
  id,
  items,
  value,
  onValueChange,
  invalid,
}: {
  id: string
  items: { value: string; label: string }[]
  value: string
  onValueChange: (value: string) => void
  invalid?: boolean
}) => (
  <Select items={items} value={value} onValueChange={(next) => next !== null && onValueChange(next as string)}>
    <SelectTrigger id={id} className="w-full" aria-invalid={invalid || undefined}>
      <SelectValue placeholder="Выберите" />
    </SelectTrigger>
    <SelectContent>
      {items.map((item) => (
        <SelectItem key={item.value} value={item.value}>
          {item.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
)

// Новая серия: шаблон задачи и правило повтора. Создаётся целиком — после создания шаблон, кроме названия,
// описания и исполнителя, изменить нельзя
export const SeriesForm = () => {
  const navigate = useNavigate()
  const { organization, role } = useCurrentOrganization()
  const employee = isEmployee(role)
  const orgId = String(organization.id)
  const createSeries = useCreateTaskSeries(organization.id)
  const { myMembershipId, memberName } = useTaskPeople()
  const browserTimezone = getBrowserTimezone()

  const form = useForm<SeriesInput, unknown, SeriesValues>({
    resolver: zodResolver(seriesSchema),
    defaultValues: {
      title: '',
      description: '',
      property_id: '',
      checklist: [],
      // Командную серию бэк разрешает только руководящим ролям; сотрудник создаёт личную себе
      visibility: employee ? 'personal' : 'team',
      assignee_membership_id: '',
      requires_photo: false,
      requires_review: false,
      reviewer_membership_id: '',
      frequency: 'weekly',
      weekdays: [],
      month_day: '1',
      missing_day: 'last_day',
      local_time: '10:00',
      timezone: browserTimezone,
      start_date: todayIn(browserTimezone),
      end_kind: 'never',
      end_date: '',
    },
  })
  const {
    register,
    control,
    handleSubmit,
    setError,
    setValue,
    formState: { errors },
  } = form
  const checklist = useFieldArray({ control, name: 'checklist' })
  const visibility = useWatch({ control, name: 'visibility' })
  const propertyValue = useWatch({ control, name: 'property_id' })
  const requiresReview = useWatch({ control, name: 'requires_review' })

  const { data: properties } = useAllProperties(organization.id)
  const selectedPropertyId = propertyValue ? Number(propertyValue) : undefined
  // С объектом бэк отдаёт только тех, у кого есть к нему доступ: других назначить нельзя (422)
  const { data: participants } = useTaskParticipants(organization.id, selectedPropertyId, { enabled: !employee })

  const personal = visibility === 'personal'
  const propertyItems = [{ value: NONE, label: 'Без объекта' }, ...(properties ?? []).map((item) => ({ value: String(item.id), label: item.name }))]
  const assigneeItems = (participants ?? []).map((person) => ({ value: String(person.membership_id), label: person.name }))
  const reviewerItems = [{ value: NONE, label: 'Автор серии (вы)' }, ...assigneeItems.filter((item) => item.value !== String(myMembershipId))]

  const submit = handleSubmit((values) =>
    createSeries.mutate(toSeriesCreate(values), {
      onSuccess: ({ data }) => navigate(to.taskSeriesItem(data.id, orgId)),
      onError: (error) => splitSeriesFieldErrors(error, FIELDS).known.forEach(({ name, message }) => setError(name, { message })),
    }),
  )

  return (
    <FormProvider {...form}>
      <form className="flex flex-col gap-6 pt-4 pb-8 md:pt-8" onSubmit={submit} noValidate>
        <RecordHeader
          className="shadow-card"
          back={{ to: to.taskSeries(orgId), label: 'Серии' }}
          eyebrow="Новая серия задач"
          title="Новая серия"
          primaryAction={
            <Button type="submit" className="shadow-control" disabled={createSeries.isPending}>
              {createSeries.isPending ? <Spinner /> : <SaveIcon />} Создать серию
            </Button>
          }
        />

        {/* Ошибки полей показаны под инпутами; здесь — всё остальное (409, сеть) */}
        {!!createSeries.error && !hasFieldErrors(createSeries.error) && <ErrorText>{getSeriesErrorText(createSeries.error)}</ErrorText>}

        <div className="grid items-start gap-4 lg:grid-cols-[1fr_360px]">
          <div className="flex min-w-0 flex-col gap-4">
            <SectionCard title="Задача" bodyClassName="gap-5">
              <TaskField id="series-title" label="Название" hint="Глаголом: «Проверить расходники», а не «Расходники»" error={errors.title}>
                <Input id="series-title" placeholder="Например, проверить расходники" aria-invalid={!!errors.title || undefined} {...register('title')} />
              </TaskField>
              <TaskField id="series-desc" label="Подробности" error={errors.description}>
                <Textarea id="series-desc" rows={3} placeholder="Что важно не забыть" aria-invalid={!!errors.description || undefined} {...register('description')} />
              </TaskField>
              <TaskField id="series-property" label="Объект" hint="После создания объект изменить нельзя" error={errors.property_id}>
                <Controller
                  control={control}
                  name="property_id"
                  render={({ field }) => (
                    <IdSelect
                      id="series-property"
                      items={propertyItems}
                      value={field.value || NONE}
                      invalid={!!errors.property_id}
                      onValueChange={(value) => {
                        field.onChange(value === NONE ? '' : value)
                        // У другого объекта другой круг людей с доступом — прежний выбор может стать недопустимым
                        setValue('assignee_membership_id', '')
                        setValue('reviewer_membership_id', '')
                        // Время серии — в поясе объекта; без объекта опереться не на что — пояс браузера
                        const timezone = properties?.find((item) => String(item.id) === value)?.timezone ?? browserTimezone
                        setValue('timezone', timezone)
                      }}
                    />
                  )}
                />
              </TaskField>
              <TaskField
                label="Чек-лист"
                hint="Необязателен. Исполнитель должен отметить все пункты, после создания список изменить нельзя"
                error={errors.checklist as { message?: string } | undefined}
              >
                {checklist.fields.length > 0 && (
                  <ul className="flex flex-col gap-2">
                    {checklist.fields.map((item, index) => (
                      <li key={item.id} className="flex flex-col gap-1">
                        <span className="flex items-center gap-2">
                          <Input
                            aria-label={`Пункт ${index + 1}`}
                            placeholder="Например, проверить запас кофе"
                            aria-invalid={!!errors.checklist?.[index]?.text || undefined}
                            {...register(`checklist.${index}.text`)}
                          />
                          <Button type="button" variant="ghost" size="icon" aria-label={`Удалить пункт ${index + 1}`} onClick={() => checklist.remove(index)}>
                            <Trash2Icon />
                          </Button>
                        </span>
                        <ErrorText errors={errors.checklist?.[index]?.text} />
                      </li>
                    ))}
                  </ul>
                )}
                <Button type="button" variant="outline" size="sm" className="self-start bg-canvas" disabled={checklist.fields.length >= 100} onClick={() => checklist.append({ text: '' })}>
                  <PlusIcon /> Добавить пункт
                </Button>
              </TaskField>
            </SectionCard>

            <SectionCard title="Кому и как принимать" bodyClassName="gap-5">
              {!employee && (
                <Controller
                  control={control}
                  name="visibility"
                  render={({ field }) => (
                    <RadioGroup value={field.value} onValueChange={field.onChange} aria-label="Тип серии" className="grid gap-2 sm:grid-cols-2">
                      {[
                        { value: 'team', title: 'Командная', text: 'Назначается участнику команды; видят руководящие роли' },
                        { value: 'personal', title: 'Личная', text: 'Себе, без приёмки; видите только вы' },
                      ].map((item) => (
                        <label
                          key={item.value}
                          className={cn('flex cursor-pointer items-start gap-3 rounded-3xl p-4 ring-1 ring-mist transition-colors hover:bg-mist', field.value === item.value && 'bg-mist ring-foreground')}
                        >
                          <RadioGroupItem value={item.value} className="mt-0.5" />
                          <span className="flex flex-col gap-0.5">
                            <span className="text-body-sm font-medium">{item.title}</span>
                            <span className="text-caption text-smoke">{item.text}</span>
                          </span>
                        </label>
                      ))}
                    </RadioGroup>
                  )}
                />
              )}

              {personal ? (
                <div className="flex items-center gap-3 rounded-3xl bg-mist p-4">
                  <PersonAvatar name={memberName(myMembershipId)} tone="accent" />
                  <span className="flex flex-col">
                    <span className="text-body-sm font-medium">{memberName(myMembershipId)}</span>
                    <span className="text-caption text-smoke">Личная серия: исполнитель — вы, задачи видны только вам и закрываются без приёмки</span>
                  </span>
                </div>
              ) : (
                <TaskField
                  id="series-assignee"
                  label="Исполнитель"
                  hint={selectedPropertyId ? 'Показаны участники с доступом к выбранному объекту' : undefined}
                  error={errors.assignee_membership_id}
                >
                  <Controller
                    control={control}
                    name="assignee_membership_id"
                    render={({ field }) => (
                      <IdSelect id="series-assignee" items={assigneeItems} value={field.value} onValueChange={field.onChange} invalid={!!errors.assignee_membership_id} />
                    )}
                  />
                </TaskField>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <Controller
                  control={control}
                  name="requires_photo"
                  render={({ field }) => (
                    <label htmlFor="series-photo" className="flex cursor-pointer items-center justify-between gap-4 rounded-3xl bg-mist p-4">
                      <span className="text-body-sm font-medium">Фото обязательно</span>
                      <Switch id="series-photo" checked={field.value} onCheckedChange={field.onChange} />
                    </label>
                  )}
                />
                {!personal && (
                  <Controller
                    control={control}
                    name="requires_review"
                    render={({ field }) => (
                      <label htmlFor="series-review" className="flex cursor-pointer items-center justify-between gap-4 rounded-3xl bg-mist p-4">
                        <span className="text-body-sm font-medium">Нужна проверка</span>
                        <Switch id="series-review" checked={field.value} onCheckedChange={field.onChange} />
                      </label>
                    )}
                  />
                )}
              </div>

              {!personal && requiresReview && (
                <TaskField id="series-reviewer" label="Проверяющий" hint="Принять отчёт всегда может и автор серии" error={errors.reviewer_membership_id}>
                  <Controller
                    control={control}
                    name="reviewer_membership_id"
                    render={({ field }) => (
                      <IdSelect
                        id="series-reviewer"
                        items={reviewerItems}
                        value={field.value || NONE}
                        onValueChange={(value) => field.onChange(value === NONE ? '' : value)}
                        invalid={!!errors.reviewer_membership_id}
                      />
                    )}
                  />
                </TaskField>
              )}
            </SectionCard>

            <SectionCard title="Правило повтора">
              <SeriesRuleFields />
            </SectionCard>
          </div>

          <SeriesPreviewAside />
        </div>
      </form>
    </FormProvider>
  )
}
