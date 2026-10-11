import { cn } from '@/shared/lib/utils'
import { MOCK_BORDER } from '@/shared/mock/mock-border'
import { PersonAvatar } from '@/shared/ui/rb/PersonAvatar'
import { type Source, SOURCE_LABEL } from '@/shared/ui/rb/SourceTag'
import { TASK_STATUS, type TaskStatus } from '@/shared/ui/rb/status-presets'
import { SyncFreshness, type SyncInfo } from '@/shared/ui/rb/SyncFreshness'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/shadcn/select'
import { ConflictBanner } from '@/widgets/booking-actions/ConflictBanner'
import { DAY_FROM, DAY_SPAN, HOURS, hh, hourLen, hourPos } from '../model/entries'

// Всё в этом файле — макет: на бэке нет обмена с площадками, площадок у броней, конфликтов и задач на шкале дня.
// Каждый блок в красной рамке и уходит отсюда вместе с появлением ручки

// ── Обмен с площадками ──────────────────────────────────────────────────────

const SYNCS: SyncInfo[] = [
  { source: 'avito', lastSuccess: '09:32' },
  { source: 'sutochno', lastSuccess: '07:58', failed: true, error: 'Площадка не отвечает' },
]

// Время обмена с площадками. Сама кнопка «Обновить» уже настоящая — CalendarRefresh
export const SyncStatusMock = () => (
  <div className={cn('flex flex-wrap items-center gap-2 rounded-2xl p-1', MOCK_BORDER)}>
    {SYNCS.map((item) => (
      <SyncFreshness key={item.source} sync={item} compact />
    ))}
  </div>
)

// ── Фильтр площадки ─────────────────────────────────────────────────────────

const SOURCE_ITEMS = [
  { value: 'all', label: 'Все' },
  ...(['avito', 'sutochno', 'direct'] as Source[]).map((source) => ({ value: source, label: SOURCE_LABEL[source] })),
]

// Ничего не фильтрует: у брони на бэке один источник — «вручную»
export const SourceFilterMock = () => (
  <Select items={SOURCE_ITEMS} defaultValue="all">
    <SelectTrigger aria-label="Площадка" className={cn('w-48 shrink-0 rounded-full bg-card', MOCK_BORDER)}>
      <span className="mono-label text-smoke">Площадка</span>
      <SelectValue className="truncate font-medium" />
    </SelectTrigger>
    <SelectContent alignItemWithTrigger={false} align="start">
      {SOURCE_ITEMS.map((item) => (
        <SelectItem key={item.value} value={item.value}>
          {item.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
)

// ── Конфликт дат ────────────────────────────────────────────────────────────

export const ConflictBannerMock = () => (
  <ConflictBanner
    className={MOCK_BORDER}
    title="Пересечение дат 12–14 окт · Студия на Лиговском"
    description="Брони #1042 (Авито) и #1045 (Суточно) заняли одни даты"
  />
)

// ── Задачи на шкале дня ─────────────────────────────────────────────────────

type DayTask = { id: string; property: string; from: number; till: number; title: string; who: string; status: TaskStatus }

const DAY_TASKS: DayTask[] = [
  { id: 't-308', property: 'Студия на Лиговском', from: 10, till: 12.5, title: 'Уборка перед заездом', who: 'Марина Соколова', status: 'in_progress' },
  { id: 't-301', property: 'Лофт у Невы', from: 12, till: 14.5, title: 'Уборка после выезда', who: 'Марина Соколова', status: 'todo' },
  { id: 't-303', property: 'Апартаменты на Мойке', from: 16, till: 18, title: 'Заменить смеситель', who: 'Олег Ким', status: 'overdue' },
]

// У задачи на бэке есть только срок без длительности, а выбрать задачи за произвольный день ручка не умеет
export const DayTasksMock = () => (
  <div className={cn('overflow-x-auto rounded-card bg-card shadow-card', MOCK_BORDER)}>
    <div style={{ minWidth: DAY_SPAN * 56 + 220 }}>
      {DAY_TASKS.map((task) => {
        const meta = TASK_STATUS[task.status]
        const Icon = meta.icon
        return (
          <div key={task.id} className="flex border-b border-mist last:border-0">
            <div className="sticky left-0 z-10 flex w-[220px] shrink-0 flex-col justify-center gap-0.5 bg-card px-5 py-3">
              <span className="truncate text-body-sm font-medium">{task.property}</span>
              <span className="truncate text-caption text-smoke">задачи со временем · макет</span>
            </div>
            <div className="relative h-14 min-w-0 flex-1">
              <div className="absolute inset-0" aria-hidden>
                {HOURS.filter((hour) => hour > DAY_FROM).map((hour) => (
                  <span key={hour} className={cn('absolute inset-y-0 w-px', hour % 3 === 0 ? 'bg-ash/60' : 'bg-mist')} style={{ left: hourPos(hour) }} />
                ))}
              </div>
              <span
                aria-label={`${task.title} · ${task.who} · ${hh(task.from)}–${hh(task.till)} · ${meta.label}`}
                className={cn(
                  'absolute top-3 flex h-8 items-center gap-1.5 overflow-hidden rounded-full border bg-canvas px-2.5 text-caption whitespace-nowrap',
                  task.status === 'overdue' ? 'border-destructive/60 text-destructive' : 'border-ash text-foreground',
                  task.status === 'in_progress' && 'border-foreground',
                )}
                style={{ left: hourPos(task.from), width: hourLen(task.from, task.till) }}
              >
                <PersonAvatar name={task.who} size="xs" className="-ml-1.5 size-6 shrink-0" />
                <Icon className="size-3.5 shrink-0" aria-hidden />
                <span className="truncate font-medium">{task.title}</span>
              </span>
            </div>
          </div>
        )
      })}
    </div>
  </div>
)
