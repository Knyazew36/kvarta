import { useState } from 'react'
import { ArrowLeftIcon, ArrowRightIcon, BellIcon, CameraIcon, ClipboardPlusIcon, EyeIcon, RepeatIcon, UserIcon } from 'lucide-react'
import { DEMO_TZ, DEMO_TZ_FULL } from '@/shared/lib/format'
import { useIsMobile } from '@/shared/lib/hooks/use-mobile'
import { cn } from '@/shared/lib/utils'
import { PersonAvatar } from '@/shared/ui/rb/PersonAvatar'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Checkbox } from '@/shared/ui/shadcn/animate-ui/components/radix/checkbox'
import { RadioGroup, RadioGroupItem } from '@/shared/ui/shadcn/animate-ui/components/radix/radio-group'
import { Switch } from '@/shared/ui/shadcn/animate-ui/components/radix/switch'
import { DateInput } from '@/shared/ui/shadcn/date-input'
import { Input } from '@/shared/ui/shadcn/input'
import { Label } from '@/shared/ui/shadcn/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/shadcn/select'
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@/shared/ui/shadcn/sheet'
import { Textarea } from '@/shared/ui/shadcn/textarea'

// ── Макетные данные формы ───────────────────────────────────────────────────

const PROPERTIES = [
  { value: 'none', label: 'Без объекта' },
  { value: 'ligovsky', label: 'Студия на Лиговском' },
  { value: 'neva', label: 'Лофт у Невы' },
  { value: 'moika', label: 'Апартаменты на Мойке' },
  { value: 'repino', label: 'Дом в Репино' },
]

const PEOPLE = [
  { value: 'Марина Соколова', caption: 'Уборка · MAX' },
  { value: 'Олег Ким', caption: 'Мастер · MAX' },
  { value: 'Игорь Петров', caption: 'Управляющий · MAX и почта' },
]

const RULES = [
  { value: 'daily', label: 'Каждый день' },
  { value: 'weekly', label: 'По дням недели' },
  { value: 'checkout', label: 'После каждого выезда' },
  { value: 'monthly', label: 'Раз в месяц' },
]

const REMINDERS = [
  { id: 'r-60', label: 'За час до срока', defaultChecked: true },
  { id: 'r-15', label: 'За 15 минут до срока', defaultChecked: false },
  { id: 'r-late', label: 'При просрочке — сообщить проверяющему', defaultChecked: true },
]

const STEPS = [
  { key: 'what', title: 'Что сделать' },
  { key: 'who', title: 'Кому' },
  { key: 'when', title: 'Срок' },
  { key: 'repeat', title: 'Разовая или повтор' },
  { key: 'accept', title: 'Фото и приёмка' },
  { key: 'remind', title: 'Напоминания' },
  { key: 'preview', title: 'Проверьте перед созданием' },
] as const

// ── Поля ────────────────────────────────────────────────────────────────────

const FormField = ({ id, label, hint, children }: { id?: string; label: string; hint?: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-2">
    <Label htmlFor={id} className="text-body-sm font-medium">
      {label}
    </Label>
    {children}
    {hint && <span className="text-caption text-smoke">{hint}</span>}
  </div>
)

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
  // Сотрудник создаёт только личную задачу себе — выбора исполнителя у него нет
  personal?: boolean
  me: string
  propertyId?: string
}

// Создание по шагам: у задачи много последствий (кто получит, кто увидит, когда напомнят) — каждое решается отдельно
export const TaskFormSheet = ({ trigger, personal, me, propertyId }: TaskFormSheetProps) => {
  const isMobile = useIsMobile()
  const [step, setStep] = useState(0)
  const [title, setTitle] = useState('')
  const [property, setProperty] = useState(propertyId ?? 'neva')
  const [assignee, setAssignee] = useState(personal ? me : PEOPLE[0].value)
  const [date, setDate] = useState('2026-10-08')
  const [time, setTime] = useState('14:30')
  const [repeat, setRepeat] = useState<'once' | 'series'>('once')
  const [rule, setRule] = useState('checkout')
  const [photo, setPhoto] = useState(true)
  const [review, setReview] = useState(!personal)

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1
  const propertyLabel = PROPERTIES.find((item) => item.value === property)?.label
  const ruleLabel = RULES.find((item) => item.value === rule)?.label

  return (
    <Sheet onOpenChange={(open) => open && setStep(0)}>
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
          <form id="task-form" className="flex flex-col gap-5" onSubmit={(event) => event.preventDefault()}>
            {current.key === 'what' && (
              <>
                <FormField id="task-title" label="Название" hint="Глаголом: «Заменить смеситель», а не «Смеситель»">
                  <Input id="task-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Например, уборка после выезда" autoFocus />
                </FormField>
                <FormField id="task-desc" label="Подробности">
                  <Textarea id="task-desc" rows={3} placeholder="Что важно не забыть" />
                </FormField>
                <FormField id="task-property" label="Объект" hint="Задача с объектом попадёт в подготовку и календарь объекта">
                  <Select items={PROPERTIES} value={property} onValueChange={(value) => setProperty(value as string)}>
                    <SelectTrigger id="task-property" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROPERTIES.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
              </>
            )}

            {current.key === 'who' &&
              (personal ? (
                <div className="flex items-center gap-3 rounded-3xl bg-mist p-4">
                  <PersonAvatar name={me} tone="accent" />
                  <span className="flex flex-col">
                    <span className="text-body-sm font-medium">{me}</span>
                    <span className="text-caption text-smoke">Личная задача: видна вам и управляющему</span>
                  </span>
                </div>
              ) : (
                <RadioGroup value={assignee} onValueChange={setAssignee} aria-label="Исполнитель" className="gap-2">
                  {PEOPLE.map((person) => (
                    <label
                      key={person.value}
                      className={cn(
                        'flex cursor-pointer items-center gap-3 rounded-3xl p-3 transition-colors hover:bg-mist',
                        assignee === person.value && 'bg-mist',
                      )}
                    >
                      <RadioGroupItem value={person.value} />
                      <PersonAvatar name={person.value} size="sm" />
                      <span className="flex flex-col">
                        <span className="text-body-sm font-medium">{person.value}</span>
                        <span className="text-caption text-smoke">{person.caption}</span>
                      </span>
                    </label>
                  ))}
                </RadioGroup>
              ))}

            {current.key === 'when' && (
              <>
                <div className="grid grid-cols-[1fr_120px] gap-3">
                  <FormField id="task-date" label="Дата">
                    <DateInput id="task-date" value={date} onValueChange={setDate} min="2026-10-08" />
                  </FormField>
                  <FormField id="task-time" label="Время">
                    <Input id="task-time" type="time" value={time} onChange={(event) => setTime(event.target.value)} />
                  </FormField>
                </div>
                {/* Часовой пояс — объекта, а не устройства: исполнитель может быть в другом городе */}
                <p className="mono-label rounded-2xl bg-mist px-4 py-3 text-slate">Время объекта · {DEMO_TZ_FULL}</p>
              </>
            )}

            {current.key === 'repeat' && (
              <>
                <RadioGroup value={repeat} onValueChange={(value) => setRepeat(value as 'once' | 'series')} aria-label="Повтор" className="gap-2">
                  {[
                    { value: 'once', title: 'Разовая', text: 'Одна задача на выбранную дату' },
                    { value: 'series', title: 'Повторяется', text: 'Создастся серия: задачи будут появляться по правилу' },
                  ].map((item) => (
                    <label key={item.value} className={cn('flex cursor-pointer items-start gap-3 rounded-3xl p-4 transition-colors hover:bg-mist', repeat === item.value && 'bg-mist')}>
                      <RadioGroupItem value={item.value} className="mt-0.5" />
                      <span className="flex flex-col gap-0.5">
                        <span className="text-body-sm font-medium">{item.title}</span>
                        <span className="text-caption text-smoke">{item.text}</span>
                      </span>
                    </label>
                  ))}
                </RadioGroup>
                {repeat === 'series' && (
                  <FormField id="task-rule" label="Правило" hint="Точные дни и окончание настраиваются в карточке серии">
                    <Select items={RULES} value={rule} onValueChange={(value) => setRule(value as string)}>
                      <SelectTrigger id="task-rule" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {RULES.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                )}
              </>
            )}

            {current.key === 'accept' && (
              <>
                <SwitchRow id="task-photo" title="Фото обязательно" text="Без фото исполнитель не сможет отправить задачу" checked={photo} onChange={setPhoto} />
                <SwitchRow
                  id="task-review"
                  title="Нужна проверка"
                  text={review ? 'Задача закроется только после приёмки' : 'Задача закроется, как только исполнитель отметит выполнение'}
                  checked={review}
                  onChange={setReview}
                />
                {review && (
                  <p className="flex items-center gap-2 text-body-sm text-slate">
                    <EyeIcon className="size-4" aria-hidden /> Проверяет: Игорь Петров, управляющий
                  </p>
                )}
              </>
            )}

            {current.key === 'remind' && (
              <ul className="flex flex-col gap-1">
                {REMINDERS.map((item) => (
                  <li key={item.id}>
                    <label className="flex cursor-pointer items-center gap-3 rounded-2xl px-3 py-3 transition-colors hover:bg-mist">
                      <Checkbox defaultChecked={item.defaultChecked} />
                      <span className="text-body-sm">{item.label}</span>
                    </label>
                  </li>
                ))}
                <li className="mono-label px-3 pt-2 text-smoke">Канал: MAX, если не прочитано за 10 минут — SMS</li>
              </ul>
            )}

            {current.key === 'preview' && (
              <ul className="flex flex-col gap-4 rounded-3xl bg-mist p-4">
                <PreviewRow icon={ClipboardPlusIcon} label="Задача">
                  {title || 'Без названия'} · {propertyLabel}
                </PreviewRow>
                <PreviewRow icon={UserIcon} label="Получатель">
                  <span className="font-medium">{assignee}</span> получит уведомление в MAX сразу после создания
                </PreviewRow>
                <PreviewRow icon={BellIcon} label="Срок">
                  {date.split('-').reverse().slice(0, 2).join('.')} в {time} {DEMO_TZ}, напоминание за час
                </PreviewRow>
                <PreviewRow icon={RepeatIcon} label="Повтор">
                  {repeat === 'once' ? 'Разовая' : `Серия: ${ruleLabel?.toLowerCase()}`}
                </PreviewRow>
                <PreviewRow icon={CameraIcon} label="Приёмка">
                  {[photo ? 'фото обязательно' : 'без фото', review ? 'проверяет Игорь Петров' : 'без проверки'].join(', ')}
                </PreviewRow>
                <PreviewRow icon={EyeIcon} label="Кто видит">
                  {personal ? 'Вы и управляющий' : 'Исполнитель, проверяющий, владелец и управляющие'}. Гость задачу не видит.
                </PreviewRow>
              </ul>
            )}
          </form>
        </SheetBody>

        <SheetFooter className="flex-row-reverse justify-start border-t border-mist">
          {isLast ? (
            <Button type="submit" form="task-form" className="shadow-control">
              <ClipboardPlusIcon /> Создать задачу
            </Button>
          ) : (
            <Button type="button" className="shadow-control" onClick={() => setStep((prev) => prev + 1)} disabled={current.key === 'what' && !title.trim()}>
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
