import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeftIcon, ArrowRightIcon, BellIcon, CameraIcon, ClipboardPlusIcon, EyeIcon, ListChecksIcon, PlusIcon, Trash2Icon, UserIcon } from 'lucide-react'
import { useState } from 'react'
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { getBrowserTimezone } from '@/entities/notification'
import { getRoleLabel, isEmployee, useCurrentOrganization } from '@/entities/organization'
import { useAllProperties } from '@/entities/property'
import {
  type TaskInput,
  type TaskValues,
  formatTimezone,
  getTaskErrorText,
  taskSchema,
  toTaskCreate,
  useCreateTask,
  useTaskParticipants,
  useTaskPeople,
} from '@/entities/task'
import { hasFieldErrors } from '@/shared/api/model/getFieldErrors'
import { to } from '@/shared/config/paths'
import { useIsMobile } from '@/shared/lib/hooks/use-mobile'
import { cn } from '@/shared/lib/utils'
import { DeviationNote } from '@/shared/mock/DeviationNote'
import { ErrorText } from '@/shared/ui/rb/ErrorText'
import { PersonAvatar } from '@/shared/ui/rb/PersonAvatar'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { RadioGroup, RadioGroupItem } from '@/shared/ui/shadcn/animate-ui/components/radix/radio-group'
import { Switch } from '@/shared/ui/shadcn/animate-ui/components/radix/switch'
import { DateInput } from '@/shared/ui/shadcn/date-input'
import { Input } from '@/shared/ui/shadcn/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/shadcn/select'
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@/shared/ui/shadcn/sheet'
import { Spinner } from '@/shared/ui/shadcn/spinner'
import { Textarea } from '@/shared/ui/shadcn/textarea'
import { splitFieldErrors } from './task-field-errors'
import { TaskField } from './TaskField'

// ── Шаги ────────────────────────────────────────────────────────────────────

type StepKey = 'what' | 'who' | 'when' | 'accept' | 'preview'

// Поля шага: «Далее» проверяет только их, а ошибка с бэка возвращает на шаг с этим полем
const STEPS: { key: StepKey; title: string; fields: (keyof TaskInput)[] }[] = [
  { key: 'what', title: 'Что сделать', fields: ['title', 'description', 'property_id', 'checklist'] },
  { key: 'who', title: 'Кому', fields: ['visibility', 'assignee_membership_id'] },
  { key: 'when', title: 'Срок', fields: ['due_date', 'due_time'] },
  { key: 'accept', title: 'Фото и приёмка', fields: ['requires_photo', 'requires_review', 'reviewer_membership_id'] },
  { key: 'preview', title: 'Проверьте перед созданием', fields: [] },
]

// Поле бэка → поле формы
const FORM_FIELD: Record<string, keyof TaskInput> = {
  title: 'title',
  description: 'description',
  property_id: 'property_id',
  booking_id: 'property_id',
  checklist: 'checklist',
  visibility: 'visibility',
  assignee_membership_id: 'assignee_membership_id',
  due_at: 'due_date',
  timezone: 'due_date',
  requires_photo: 'requires_photo',
  requires_review: 'requires_review',
  reviewer_membership_id: 'reviewer_membership_id',
}

const NONE = 'none'

// Переключатель с подписью: вся строка кликабельна, а не только сам свитч
const SwitchRow = ({ id, title, text, checked, onChange }: { id: string; title: string; text: string; checked: boolean; onChange: (next: boolean) => void }) => (
  <label htmlFor={id} className="flex cursor-pointer items-start justify-between gap-4 rounded-3xl bg-mist p-4">
    <span className="flex flex-col gap-0.5">
      <span className="text-body-sm font-medium">{title}</span>
      <span className="text-caption text-smoke">{text}</span>
    </span>
    <Switch id={id} checked={checked} onCheckedChange={onChange} />
  </label>
)

const PreviewRow = ({ icon: Icon, label, children }: { icon: typeof UserIcon; label: string; children: React.ReactNode }) => (
  <li className="flex items-start gap-3">
    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-card">
      <Icon className="size-4" aria-hidden />
    </span>
    <span className="flex min-w-0 flex-col gap-0.5">
      <span className="mono-label text-smoke">{label}</span>
      <span className="text-body-sm">{children}</span>
    </span>
  </li>
)

// ── Форма ───────────────────────────────────────────────────────────────────

type TaskFormSheetProps = {
  trigger: React.ReactElement
  // Задача создаётся из карточки объекта или брони: объект выбран заранее. Бронь требует своего объекта и руководящей роли
  propertyId?: number
  bookingId?: number
}

// Создание по шагам: у задачи много последствий (кто получит, кто увидит, кто примет) — каждое решается отдельно
export const TaskFormSheet = ({ trigger, propertyId, bookingId }: TaskFormSheetProps) => {
  const isMobile = useIsMobile()
  const navigate = useNavigate()
  const { organization, role } = useCurrentOrganization()
  const employee = isEmployee(role)
  const orgId = String(organization.id)
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)

  const createTask = useCreateTask(organization.id)
  const { myMembershipId, memberName } = useTaskPeople()

  const defaultValues: TaskInput = {
    title: '',
    description: '',
    property_id: propertyId ? String(propertyId) : '',
    checklist: [],
    // Командную задачу бэк разрешает только руководящим ролям; сотрудник создаёт личную себе
    visibility: employee ? 'personal' : 'team',
    assignee_membership_id: '',
    due_date: '',
    due_time: '',
    requires_photo: false,
    requires_review: false,
    reviewer_membership_id: '',
  }

  const {
    register,
    control,
    handleSubmit,
    trigger: validate,
    setError,
    setValue,
    reset,
    formState: { errors },
  } = useForm<TaskInput, unknown, TaskValues>({ resolver: zodResolver(taskSchema), defaultValues })
  const checklist = useFieldArray({ control, name: 'checklist' })
  const values = useWatch({ control })

  const { data: properties } = useAllProperties(organization.id)
  const selectedPropertyId = values.property_id ? Number(values.property_id) : undefined
  const property = properties?.find((item) => item.id === selectedPropertyId)
  // Время срока — в поясе объекта: исполнитель может быть в другом городе. Без объекта опереться не на что — пояс браузера
  const timezone = property?.timezone ?? getBrowserTimezone()
  // С объектом бэк отдаёт только тех, у кого есть к нему доступ: других назначить нельзя (422)
  const { data: participants } = useTaskParticipants(organization.id, selectedPropertyId, { enabled: open && !employee })

  const personal = values.visibility === 'personal'
  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  const propertyItems = [{ value: NONE, label: 'Без объекта' }, ...(properties ?? []).map((item) => ({ value: String(item.id), label: item.name }))]
  const reviewerItems = [
    { value: NONE, label: 'Автор задачи (вы)' },
    ...(participants ?? []).filter((person) => person.membership_id !== myMembershipId).map((person) => ({ value: String(person.membership_id), label: person.name })),
  ]

  const assigneeName = personal ? memberName(myMembershipId) : values.assignee_membership_id ? memberName(Number(values.assignee_membership_id)) : 'не выбран'
  const reviewerName = values.reviewer_membership_id ? memberName(Number(values.reviewer_membership_id)) : 'вы'

  const next = async () => {
    if (await validate(current.fields)) setStep((prev) => prev + 1)
  }

  const submit = handleSubmit(
    (data) =>
      createTask.mutate(toTaskCreate(data, { timezone, bookingId }), {
        onSuccess: ({ data: task }) => {
          setOpen(false)
          navigate(to.task(task.id, orgId))
        },
        onError: (error) => {
          const { known } = splitFieldErrors(error, FORM_FIELD)
          known.forEach(({ name, message }) => setError(name, { message }))
          // Возвращаем на шаг с первой ошибкой: на шаге «Проверьте» полей нет
          const stepIndex = STEPS.findIndex((item) => known.some(({ name }) => item.fields.includes(name)))
          if (stepIndex >= 0) setStep(stepIndex)
        },
      }),
    // Ошибка схемы на уже пройденном шаге (например, сменили тип задачи и исполнитель стал обязательным)
    (invalid) => {
      const stepIndex = STEPS.findIndex((item) => item.fields.some((name) => name in invalid))
      if (stepIndex >= 0) setStep(stepIndex)
    },
  )

  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        // Несохранённый ввод и ошибка прошлой попытки не должны встречать при следующем открытии
        if (!nextOpen) {
          reset(defaultValues)
          createTask.reset()
          setStep(0)
        }
      }}
    >
      <SheetTrigger render={trigger} />
      <SheetContent side={isMobile ? 'bottom' : 'right'} className="data-[side=bottom]:max-h-[92dvh]">
        <SheetHeader className="gap-3 border-b border-mist">
          <span className="mono-label text-smoke">
            Новая задача · шаг {String(step + 1).padStart(2, '0')} / {String(STEPS.length).padStart(2, '0')}
          </span>
          <SheetTitle className="text-heading-sm">{current.title}</SheetTitle>
          <SheetDescription className="sr-only">Создание задачи по шагам</SheetDescription>
          {/* Сегменты, а не процент: видно, сколько решений осталось */}
          <ol className="flex gap-1" aria-label="Шаги">
            {STEPS.map((item, index) => (
              <li key={item.key} className="flex-1">
                <button
                  type="button"
                  aria-label={item.title}
                  aria-current={index === step ? 'step' : undefined}
                  // Вперёд — только кнопкой «Далее», назад — к любому пройденному шагу
                  disabled={index > step}
                  onClick={() => setStep(index)}
                  className={cn('block h-1.5 w-full rounded-full transition-colors', index <= step ? 'bg-foreground' : 'bg-mist')}
                />
              </li>
            ))}
          </ol>
        </SheetHeader>

        <SheetBody className="pt-6">
          <form id="task-form" className="flex flex-col gap-5" onSubmit={submit} noValidate>
            {current.key === 'what' && (
              <>
                <TaskField id="task-title" label="Название" hint="Глаголом: «Заменить смеситель», а не «Смеситель»" error={errors.title}>
                  <Input id="task-title" placeholder="Например, уборка после выезда" autoFocus aria-invalid={!!errors.title || undefined} {...register('title')} />
                </TaskField>
                <TaskField id="task-desc" label="Подробности" error={errors.description}>
                  <Textarea id="task-desc" rows={3} placeholder="Что важно не забыть" aria-invalid={!!errors.description || undefined} {...register('description')} />
                </TaskField>
                <TaskField
                  id="task-property"
                  label="Объект"
                  hint={bookingId ? `Задача привязана к брони #${bookingId}: объект брони изменить нельзя` : 'После создания объект изменить нельзя'}
                  error={errors.property_id}
                >
                  <Controller
                    control={control}
                    name="property_id"
                    render={({ field }) => (
                      <Select
                        items={propertyItems}
                        value={field.value || NONE}
                        disabled={bookingId !== undefined}
                        onValueChange={(value) => {
                          field.onChange(value === NONE ? '' : value)
                          // У другого объекта другой круг людей с доступом — прежний выбор может стать недопустимым
                          setValue('assignee_membership_id', '')
                          setValue('reviewer_membership_id', '')
                        }}
                      >
                        <SelectTrigger id="task-property" className="w-full" aria-invalid={!!errors.property_id || undefined}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {propertyItems.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </TaskField>
                <TaskField label="Чек-лист" hint="Необязателен. Исполнитель должен отметить все пункты, после создания список изменить нельзя" error={errors.checklist as { message?: string } | undefined}>
                  {checklist.fields.length > 0 && (
                    <ul className="flex flex-col gap-2">
                      {checklist.fields.map((item, index) => (
                        <li key={item.id} className="flex flex-col gap-1">
                          <span className="flex items-center gap-2">
                            <Input
                              aria-label={`Пункт ${index + 1}`}
                              placeholder="Например, сменить постельное бельё"
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
              </>
            )}

            {current.key === 'who' && (
              <>
                {!employee && (
                  <Controller
                    control={control}
                    name="visibility"
                    render={({ field }) => (
                      <RadioGroup value={field.value} onValueChange={field.onChange} aria-label="Тип задачи" className="gap-2">
                        {[
                          { value: 'team', title: 'Командная', text: 'Назначается участнику команды; видят руководящие роли' },
                          { value: 'personal', title: 'Личная', text: 'Себе, без приёмки; видите только вы' },
                        ].map((item) => (
                          <label key={item.value} className={cn('flex cursor-pointer items-start gap-3 rounded-3xl p-4 transition-colors hover:bg-mist', field.value === item.value && 'bg-mist')}>
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
                      <span className="text-caption text-smoke">Личная задача: исполнитель — вы, видна только вам</span>
                    </span>
                  </div>
                ) : (
                  <TaskField label="Исполнитель" error={errors.assignee_membership_id}>
                    {!participants ? (
                      <Spinner />
                    ) : (
                      <Controller
                        control={control}
                        name="assignee_membership_id"
                        render={({ field }) => (
                          <RadioGroup value={field.value} onValueChange={field.onChange} aria-label="Исполнитель" className="gap-2">
                            {participants.map((person) => {
                              const value = String(person.membership_id)
                              return (
                                <label key={value} className={cn('flex cursor-pointer items-center gap-3 rounded-3xl p-3 transition-colors hover:bg-mist', field.value === value && 'bg-mist')}>
                                  <RadioGroupItem value={value} />
                                  <PersonAvatar name={person.name} size="sm" />
                                  <span className="flex flex-col">
                                    <span className="text-body-sm font-medium">{person.name}</span>
                                    <span className="text-caption text-smoke">{getRoleLabel(person.role)}</span>
                                  </span>
                                </label>
                              )
                            })}
                          </RadioGroup>
                        )}
                      />
                    )}
                    {property && <span className="text-caption text-smoke">Показаны участники с доступом к объекту «{property.name}»</span>}
                  </TaskField>
                )}
              </>
            )}

            {current.key === 'when' && (
              <DeviationNote reason="Срок необязателен: бэк принимает задачу без срока. Время — в поясе объекта, без объекта — браузера.">
                <div className="grid grid-cols-[1fr_120px] gap-3">
                  <TaskField id="task-date" label="Дата" error={errors.due_date}>
                    <Controller
                      control={control}
                      name="due_date"
                      render={({ field }) => <DateInput id="task-date" value={field.value} onValueChange={field.onChange} aria-invalid={!!errors.due_date || undefined} />}
                    />
                  </TaskField>
                  <TaskField id="task-time" label="Время" error={errors.due_time}>
                    <Input id="task-time" type="time" aria-invalid={!!errors.due_time || undefined} {...register('due_time')} />
                  </TaskField>
                </div>
                {(values.due_date || values.due_time) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="self-start"
                    onClick={() => {
                      setValue('due_date', '', { shouldValidate: true })
                      setValue('due_time', '', { shouldValidate: true })
                    }}
                  >
                    Без срока
                  </Button>
                )}
                <p className="mono-label rounded-2xl bg-mist px-4 py-3 text-slate">
                  {property ? 'Время объекта' : 'Время браузера'} · {timezone}, {formatTimezone(timezone)}
                </p>
              </DeviationNote>
            )}

            {current.key === 'accept' && (
              <>
                <Controller
                  control={control}
                  name="requires_photo"
                  render={({ field }) => (
                    <SwitchRow id="task-photo" title="Фото обязательно" text="Без фото исполнитель не сможет отправить отчёт" checked={field.value} onChange={field.onChange} />
                  )}
                />
                {personal ? (
                  <p className="rounded-3xl bg-mist p-4 text-body-sm text-slate">Личная задача закрывается без приёмки, как только вы отметите выполнение.</p>
                ) : (
                  <>
                    <Controller
                      control={control}
                      name="requires_review"
                      render={({ field }) => (
                        <SwitchRow
                          id="task-review"
                          title="Нужна проверка"
                          text={field.value ? 'Задача закроется только после приёмки' : 'Задача закроется, как только исполнитель отметит выполнение'}
                          checked={field.value}
                          onChange={field.onChange}
                        />
                      )}
                    />
                    {values.requires_review && (
                      <TaskField id="task-reviewer" label="Проверяющий" hint="Принять отчёт всегда может и автор задачи" error={errors.reviewer_membership_id}>
                        <Controller
                          control={control}
                          name="reviewer_membership_id"
                          render={({ field }) => (
                            <Select items={reviewerItems} value={field.value || NONE} onValueChange={(value) => field.onChange(value === NONE ? '' : value)}>
                              <SelectTrigger id="task-reviewer" className="w-full" aria-invalid={!!errors.reviewer_membership_id || undefined}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {reviewerItems.map((item) => (
                                  <SelectItem key={item.value} value={item.value}>
                                    {item.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </TaskField>
                    )}
                  </>
                )}
              </>
            )}

            {current.key === 'preview' && (
              <>
                <ul className="flex flex-col gap-4 rounded-3xl bg-mist p-4">
                  <PreviewRow icon={ClipboardPlusIcon} label="Задача">
                    {values.title?.trim() || 'Без названия'} · {property?.name ?? 'без объекта'}
                    {bookingId !== undefined && ` · бронь #${bookingId}`}
                  </PreviewRow>
                  <PreviewRow icon={UserIcon} label="Исполнитель">
                    <span className="font-medium">{assigneeName}</span>
                  </PreviewRow>
                  <PreviewRow icon={BellIcon} label="Срок">
                    {values.due_date && values.due_time
                      ? `${values.due_date.split('-').reverse().slice(0, 2).join('.')} в ${values.due_time} ${formatTimezone(timezone)}`
                      : 'Без срока'}
                  </PreviewRow>
                  <PreviewRow icon={ListChecksIcon} label="Чек-лист">
                    {(values.checklist ?? []).filter((item) => item.text?.trim()).length || 'нет'}
                  </PreviewRow>
                  <PreviewRow icon={CameraIcon} label="Приёмка">
                    {[values.requires_photo ? 'фото обязательно' : 'без фото', !personal && values.requires_review ? `проверяет ${reviewerName}` : 'без проверки'].join(', ')}
                  </PreviewRow>
                  <PreviewRow icon={EyeIcon} label="Кто видит">
                    {personal ? 'Только вы' : 'Исполнитель, проверяющий, автор и руководящие роли с доступом к объекту'}. Гость задачу не видит.
                  </PreviewRow>
                </ul>
                <DeviationNote reason="Шагов «Повтор» и «Напоминания» нет: повтор создаётся отдельной серией, напоминаний на бэке нет.">
                  <Button variant="outline" size="sm" className="self-start bg-canvas" asChild>
                    <Link to={to.taskSeriesItem('new', orgId)}>Нужен повтор? Создать серию</Link>
                  </Button>
                </DeviationNote>
                {/* Ошибки полей показаны на своих шагах; здесь — всё остальное (409, сеть) */}
                {createTask.error && !hasFieldErrors(createTask.error) && <ErrorText>{getTaskErrorText(createTask.error)}</ErrorText>}
              </>
            )}
          </form>
        </SheetBody>

        <SheetFooter className="flex-row-reverse justify-start border-t border-mist">
          {/* key обязателен: без него React переиспользует кнопку «Далее», меняя ей type на submit прямо во время клика, —
              и тот же клик отправляет форму */}
          {isLast ? (
            <Button key="submit" type="submit" form="task-form" className="shadow-control" disabled={createTask.isPending}>
              {createTask.isPending ? <Spinner /> : <ClipboardPlusIcon />} Создать задачу
            </Button>
          ) : (
            <Button key="next" type="button" className="shadow-control" onClick={next}>
              Далее <ArrowRightIcon />
            </Button>
          )}
          {step > 0 && (
            <Button type="button" variant="ghost" onClick={() => setStep((prev) => prev - 1)}>
              <ArrowLeftIcon /> Назад
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
