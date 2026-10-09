import { useState } from 'react'
import { addDays, format, getDate, getISODay, isAfter, parseISO, startOfDay } from 'date-fns'
import { ru } from 'date-fns/locale'
import { CalendarClockIcon, PauseIcon, PlayIcon, SaveIcon } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { DEMO_ORG_ID, to } from '@/shared/config/paths'
import { DEMO_TODAY, DEMO_TZ, DEMO_TZ_FULL } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { useDemoState } from '@/shared/mock/state'
import { PersonName } from '@/shared/ui/rb/PersonAvatar'
import { RecordHeader } from '@/shared/ui/rb/RecordHeader'
import { SectionCard } from '@/shared/ui/rb/Section'
import { StateView } from '@/shared/ui/rb/StateView'
import { SERIES_STATUS, type SeriesStatus, TASK_STATUS } from '@/shared/ui/rb/status-presets'
import { StatusFromMeta } from '@/shared/ui/rb/StatusBadge'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { RadioGroup, RadioGroupItem } from '@/shared/ui/shadcn/animate-ui/components/radix/radio-group'
import { Switch } from '@/shared/ui/shadcn/animate-ui/components/radix/switch'
import { DateInput } from '@/shared/ui/shadcn/date-input'
import { Input } from '@/shared/ui/shadcn/input'
import { Label } from '@/shared/ui/shadcn/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/shadcn/select'
import { Textarea } from '@/shared/ui/shadcn/textarea'
import { ToggleGroup, ToggleGroupItem } from '@/shared/ui/shadcn/toggle-group'
import { type AffectedTask, SeriesScopeDialog } from '@/widgets/task-actions/SeriesScopeDialog'

// ── Макетные данные серий ───────────────────────────────────────────────────

type RuleKind = 'daily' | 'weekly' | 'monthly' | 'checkout'
type EndKind = 'never' | 'date' | 'count'

type Rule = {
  kind: RuleKind
  weekdays: string[]
  monthDay: number
  time: string
  start: string
  end: EndKind
  endDate: string
  count: number
}

type Series = {
  id: string
  title: string
  description: string
  status: SeriesStatus
  property: string
  assignee: string
  photo: boolean
  review: boolean
  created: number
  last: string
  rule: Rule
}

const BASE_RULE: Rule = { kind: 'weekly', weekdays: ['5'], monthDay: 12, time: '10:00', start: '2026-10-01', end: 'never', endDate: '2026-12-31', count: 10 }

const SERIES: Record<string, Series> = {
  's-1': { id: 's-1', title: 'Генеральная уборка', description: 'Окна, духовка, холодильник, под мебелью. Чек-лист из 9 пунктов.', status: 'active', property: 'neva', assignee: 'Марина Соколова', photo: true, review: true, created: 4, last: `12 сен, принята`, rule: { ...BASE_RULE, kind: 'monthly', monthDay: 12, time: '11:00', start: '2026-06-01' } },
  's-2': { id: 's-2', title: 'Проверить запас расходников', description: 'Кофе, чай, вода, туалетная бумага, капсулы для посудомойки. Недостающее — в список закупки.', status: 'active', property: 'ligovsky', assignee: 'Игорь Петров', photo: false, review: false, created: 12, last: `3 окт, выполнена`, rule: BASE_RULE },
  's-3': { id: 's-3', title: 'Уборка после выезда', description: 'Стандартная уборка между гостями. Фото каждой комнаты.', status: 'active', property: 'all', assignee: 'Марина Соколова', photo: true, review: true, created: 86, last: `8 окт, на проверке`, rule: { ...BASE_RULE, kind: 'checkout', time: '00:30', start: '2026-03-01' } },
  's-4': { id: 's-4', title: 'Показания счётчиков', description: 'Вода и электричество, фото без бликов.', status: 'paused', property: 'repino', assignee: 'Марина Соколова', photo: true, review: true, created: 7, last: `7 окт, возвращена`, rule: { ...BASE_RULE, kind: 'monthly', monthDay: 7, time: '18:00', start: '2026-03-07' } },
  's-5': { id: 's-5', title: 'Проверка котла перед сезоном', description: 'Давление, утечки, тяга. Акт мастера сфотографировать.', status: 'ended', property: 'repino', assignee: 'Олег Ким', photo: true, review: true, created: 3, last: `1 окт, принята`, rule: { ...BASE_RULE, kind: 'monthly', monthDay: 1, time: '10:00', end: 'count', count: 3 } },
}

const NEW_SERIES: Series = { id: 'new', title: '', description: '', status: 'active', property: 'neva', assignee: 'Марина Соколова', photo: true, review: true, created: 0, last: '—', rule: BASE_RULE }

// Выезды из броней: для правила «после выезда» даты берутся отсюда, а не из календаря
const CHECKOUTS = [
  { at: '2026-10-08T12:00', booking: '#1039', property: 'Лофт у Невы' },
  { at: '2026-10-09T12:00', booking: '#1036', property: 'Апартаменты на Мойке' },
  { at: '2026-10-11T12:00', booking: '#1044', property: 'Лофт у Невы' },
  { at: '2026-10-14T12:00', booking: '#1042', property: 'Студия на Лиговском' },
  { at: '2026-10-19T12:00', booking: '#1048', property: 'Апартаменты на Мойке' },
  { at: '2026-10-28T12:00', booking: '#1050', property: 'Дом в Репино' },
]

const PROPERTIES = [
  { value: 'all', label: 'Все объекты' },
  { value: 'ligovsky', label: 'Студия на Лиговском' },
  { value: 'neva', label: 'Лофт у Невы' },
  { value: 'moika', label: 'Апартаменты на Мойке' },
  { value: 'repino', label: 'Дом в Репино' },
]

const PEOPLE = ['Марина Соколова', 'Олег Ким', 'Игорь Петров'].map((name) => ({ value: name, label: name }))

const KINDS: { value: RuleKind; title: string; text: string }[] = [
  { value: 'daily', title: 'Каждый день', text: 'В одно и то же время' },
  { value: 'weekly', title: 'По дням недели', text: 'Например, по пятницам' },
  { value: 'monthly', title: 'Раз в месяц', text: 'В выбранное число' },
  { value: 'checkout', title: 'После выезда', text: 'Следует за бронями объекта' },
]

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

// ── Предпросмотр дат ────────────────────────────────────────────────────────

type Occurrence = { key: string; date: string; time: string; note?: string }

const fmt = (date: Date) => format(date, 'EEEEEE, dd MMM', { locale: ru })

// Ближайшие выполнения считаем прямо из правила: владелец видит, что именно получится, до сохранения
const nextOccurrences = (rule: Rule, limit = 6): Occurrence[] => {
  const today = startOfDay(DEMO_TODAY)
  const start = startOfDay(parseISO(rule.start))
  const until = rule.end === 'date' ? startOfDay(parseISO(rule.endDate)) : null
  const max = rule.end === 'count' ? Math.min(limit, rule.count) : limit

  if (rule.kind === 'checkout') {
    const [h, m] = rule.time.split(':').map(Number)
    return CHECKOUTS.filter((item) => !until || !isAfter(parseISO(item.at), until))
      .slice(0, max)
      .map((item) => {
        const at = new Date(parseISO(item.at).getTime() + (h * 60 + m) * 60_000)
        return { key: item.at, date: fmt(at), time: format(at, 'HH:mm'), note: `выезд ${item.booking}` }
      })
  }

  const result: Occurrence[] = []
  let day = isAfter(start, today) ? start : today
  for (let i = 0; i < 400 && result.length < max; i++, day = addDays(day, 1)) {
    if (until && isAfter(day, until)) break
    const match =
      rule.kind === 'daily' ||
      (rule.kind === 'weekly' && rule.weekdays.includes(String(getISODay(day)))) ||
      (rule.kind === 'monthly' && getDate(day) === rule.monthDay)
    if (match) result.push({ key: day.toISOString(), date: fmt(day), time: rule.time })
  }
  return result
}

// ── Поля ────────────────────────────────────────────────────────────────────

const FormField = ({ id, label, hint, className, children }: { id?: string; label: string; hint?: string; className?: string; children: React.ReactNode }) => (
  <div className={cn('flex flex-col gap-2', className)}>
    <Label htmlFor={id} className="text-body-sm font-medium">
      {label}
    </Label>
    {children}
    {hint && <span className="text-caption text-smoke">{hint}</span>}
  </div>
)

const SimpleSelect = ({ id, items, defaultValue }: { id: string; items: { value: string; label: string }[]; defaultValue: string }) => (
  <Select items={items} defaultValue={defaultValue}>
    <SelectTrigger id={id} className="w-full">
      <SelectValue />
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

// ── Страница ────────────────────────────────────────────────────────────────

const SeriesEditor = () => {
  const { orgId = DEMO_ORG_ID, seriesId = 's-2' } = useParams()
  const { state, isEmployee } = useDemoState()
  const isNew = seriesId === 'new'
  const series = isNew ? NEW_SERIES : (SERIES[seriesId] ?? SERIES['s-2'])

  const [rule, setRule] = useState<Rule>(series.rule)
  const [photo, setPhoto] = useState(series.photo)
  const [review, setReview] = useState(series.review)
  const patch = (next: Partial<Rule>) => setRule((prev) => ({ ...prev, ...next }))

  if (state === 'loading') return <StateView state="loading" skeleton="record" className="pt-4 md:pt-10" />

  if (isEmployee || state === 'denied' || state === 'empty') {
    return (
      <div className="pt-4 md:pt-10">
        <StateView
          state={state === 'empty' ? 'empty' : 'denied'}
          empty={{
            title: 'Серия не найдена',
            description: 'Серия удалена. Уже созданные по ней задачи остались в списке задач.',
            action: (
              <Button variant="outline" size="sm" asChild>
                <Link to={to.taskSeries(orgId)}>Все серии</Link>
              </Button>
            ),
          }}
          denied={{
            title: 'Серия недоступна',
            description: 'Правила повторяющихся задач настраивают владелец и управляющие.',
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

  const occurrences = nextOccurrences(rule)
  // Первые два выполнения уже созданы (за сутки до срока) — их изменения касаются в первую очередь
  const affected: AffectedTask[] = occurrences.map((item, index) => ({
    id: item.key,
    date: `${item.date} · ${item.time} ${DEMO_TZ}`,
    status: index < 2 ? TASK_STATUS.todo : TASK_STATUS.planned,
  }))
  const readOnly = series.status === 'ended'

  const save = isNew ? (
    <Button className="shadow-control">
      <SaveIcon /> Создать серию
    </Button>
  ) : (
    !readOnly && (
      <SeriesScopeDialog
        series={series.title}
        affected={affected}
        trigger={
          <Button className="shadow-control">
            <SaveIcon /> Сохранить
          </Button>
        }
      />
    )
  )

  return (
    <div className="flex flex-col gap-6 pt-4 pb-8 md:pt-8">
      <RecordHeader
        className="shadow-card"
        back={{ to: to.taskSeries(orgId), label: 'Серии' }}
        eyebrow={isNew ? 'Новая серия задач' : `Серия ${series.id}`}
        title={isNew ? 'Новая серия' : series.title}
        status={!isNew && <StatusFromMeta meta={SERIES_STATUS[series.status]} />}
        facts={
          isNew
            ? undefined
            : [
                { label: 'Объект', value: PROPERTIES.find((item) => item.value === series.property)?.label },
                { label: 'Исполнитель', value: <PersonName name={series.assignee} /> },
                { label: 'Создано задач', value: series.created },
                { label: 'Последняя', value: series.last },
                { label: 'Часовой пояс', value: DEMO_TZ },
                { label: 'Задача создаётся', value: 'за сутки' },
              ]
        }
        secondaryActions={
          !isNew &&
          !readOnly && (
            <Button variant="ghost">
              {series.status === 'paused' ? <PlayIcon /> : <PauseIcon />}
              {series.status === 'paused' ? 'Возобновить' : 'Приостановить'}
            </Button>
          )
        }
        primaryAction={save}
      />

      {readOnly && (
        <p className="rounded-card bg-mist p-5 text-body-sm text-slate">
          Серия завершена 1 окт после 3 выполнений. Правило можно посмотреть, но не изменить — для нового сезона создайте новую серию.
        </p>
      )}

      <div className="grid items-start gap-4 lg:grid-cols-[1fr_360px]">
        <fieldset disabled={readOnly} className="flex min-w-0 flex-col gap-4">
          <SectionCard title="Задача">
            <form className="flex flex-col gap-5" onSubmit={(event) => event.preventDefault()}>
              <FormField id="series-title" label="Название">
                <Input id="series-title" defaultValue={series.title} placeholder="Например, проверить расходники" />
              </FormField>
              <FormField id="series-desc" label="Подробности">
                <Textarea id="series-desc" rows={2} defaultValue={series.description} />
              </FormField>
              <div className="grid gap-5 sm:grid-cols-2">
                <FormField id="series-property" label="Объект">
                  <SimpleSelect id="series-property" items={PROPERTIES} defaultValue={series.property} />
                </FormField>
                <FormField id="series-assignee" label="Исполнитель">
                  <SimpleSelect id="series-assignee" items={PEOPLE} defaultValue={series.assignee} />
                </FormField>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label htmlFor="series-photo" className="flex cursor-pointer items-center justify-between gap-4 rounded-3xl bg-mist p-4">
                  <span className="text-body-sm font-medium">Фото обязательно</span>
                  <Switch id="series-photo" checked={photo} onCheckedChange={setPhoto} />
                </label>
                <label htmlFor="series-review" className="flex cursor-pointer items-center justify-between gap-4 rounded-3xl bg-mist p-4">
                  <span className="text-body-sm font-medium">Нужна проверка</span>
                  <Switch id="series-review" checked={review} onCheckedChange={setReview} />
                </label>
              </div>
            </form>
          </SectionCard>

          <SectionCard title="Правило повтора">
            <div className="flex flex-col gap-6">
              <RadioGroup value={rule.kind} onValueChange={(value) => patch({ kind: value as RuleKind })} aria-label="Как повторять" className="grid gap-2 sm:grid-cols-2">
                {KINDS.map((item) => (
                  <label
                    key={item.value}
                    className={cn('flex cursor-pointer items-start gap-3 rounded-3xl p-4 ring-1 ring-mist transition-colors hover:bg-mist', rule.kind === item.value && 'bg-mist ring-foreground')}
                  >
                    <RadioGroupItem value={item.value} className="mt-0.5" />
                    <span className="flex flex-col gap-0.5">
                      <span className="text-body-sm font-medium">{item.title}</span>
                      <span className="text-caption text-smoke">{item.text}</span>
                    </span>
                  </label>
                ))}
              </RadioGroup>

              {rule.kind === 'weekly' && (
                <FormField label="Дни недели" hint={rule.weekdays.length === 0 ? 'Выберите хотя бы один день' : undefined}>
                  <ToggleGroup multiple value={rule.weekdays} onValueChange={(value) => patch({ weekdays: value as string[] })} aria-label="Дни недели" className="flex-wrap">
                    {WEEKDAYS.map((label, index) => (
                      <ToggleGroupItem key={label} value={String(index + 1)} className="size-11 bg-mist text-body-sm">
                        {label}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </FormField>
              )}

              <div className="grid gap-5 sm:grid-cols-2">
                {rule.kind === 'monthly' && (
                  <FormField id="series-day" label="Число месяца" hint={rule.monthDay > 28 ? 'В коротких месяцах задача сдвинется на последний день' : undefined}>
                    <Input id="series-day" type="number" min={1} max={31} value={rule.monthDay} onChange={(event) => patch({ monthDay: Number(event.target.value) || 1 })} />
                  </FormField>
                )}
                <FormField
                  id="series-time"
                  label={rule.kind === 'checkout' ? 'Через сколько после выезда' : `Время, ${DEMO_TZ}`}
                  hint={rule.kind === 'checkout' ? 'Выезд по умолчанию в 12:00, если площадка не передала время' : DEMO_TZ_FULL}
                >
                  <Input id="series-time" type="time" value={rule.time} onChange={(event) => patch({ time: event.target.value })} />
                </FormField>
              </div>

              <div className="grid gap-5 border-t border-mist pt-6 sm:grid-cols-2">
                <FormField id="series-start" label="Начало">
                  <DateInput id="series-start" value={rule.start} onValueChange={(value) => patch({ start: value })} />
                </FormField>
                <FormField label="Окончание">
                  <RadioGroup value={rule.end} onValueChange={(value) => patch({ end: value as EndKind })} aria-label="Окончание" className="gap-2">
                    <label className="flex cursor-pointer items-center gap-3 py-1 text-body-sm">
                      <RadioGroupItem value="never" /> Без окончания
                    </label>
                    <label className="flex cursor-pointer items-center gap-3 py-1 text-body-sm">
                      <RadioGroupItem value="date" /> До даты
                    </label>
                    {rule.end === 'date' && <DateInput aria-label="Дата окончания" value={rule.endDate} onValueChange={(value) => patch({ endDate: value })} min="2026-10-08" />}
                    <label className="flex cursor-pointer items-center gap-3 py-1 text-body-sm">
                      <RadioGroupItem value="count" /> После
                      <Input
                        type="number"
                        min={1}
                        aria-label="Число выполнений"
                        value={rule.count}
                        onChange={(event) => patch({ count: Number(event.target.value) || 1 })}
                        className="h-9 w-20"
                      />
                      выполнений
                    </label>
                  </RadioGroup>
                </FormField>
              </div>
            </div>
          </SectionCard>
        </fieldset>

        {/* Предпросмотр — единственная ink-зона: результат правила важнее самих полей; top-24 — ниже липкого топбара (76px) с зазором */}
        <aside className="flex flex-col gap-5 rounded-card bg-foreground p-6 text-background shadow-card lg:sticky lg:top-24 dark:bg-mist dark:text-foreground">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="section-heading text-subheading-lg">Ближайшие даты</h2>
            <span className="mono-label text-smoke">{DEMO_TZ}</span>
          </div>
          {occurrences.length > 0 ? (
            <ol className="flex flex-col">
              {occurrences.map((item, index) => (
                <li key={item.key} className="flex items-baseline gap-4 border-b border-background/10 py-2.5 last:border-0 dark:border-foreground/10">
                  <span className="mono-label w-5 text-smoke tabular-nums">{String(index + 1).padStart(2, '0')}</span>
                  <span className="flex-1 font-mono text-body-sm tabular-nums">{item.date}</span>
                  <span className="flex flex-col items-end">
                    <span className="font-mono text-body-sm tabular-nums">{item.time}</span>
                    {item.note && <span className="mono-label text-smoke">{item.note}</span>}
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-body-sm text-smoke">По этому правилу задач не будет: проверьте дни и окончание.</p>
          )}
          <p className="flex items-start gap-2 text-caption text-smoke">
            <CalendarClockIcon className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            {rule.kind === 'checkout'
              ? 'Даты следуют за бронями: отмена брони отменит и задачу, новая бронь добавит выполнение.'
              : 'Задача создаётся за сутки до срока и сразу приходит исполнителю.'}
          </p>
        </aside>
      </div>
    </div>
  )
}

// Состояние формы берётся из серии при монтировании: при переходе к другой серии форма пересоздаётся
const TaskSeriesItemPage = () => {
  const { seriesId } = useParams()
  return <SeriesEditor key={seriesId} />
}

export default TaskSeriesItemPage
