import {
  ArchiveIcon,
  ArrowUpRightIcon,
  BookOpenIcon,
  CalendarRangeIcon,
  ClipboardListIcon,
  GlobeIcon,
  HourglassIcon,
  InfoIcon,
  type LucideIcon,
  NotebookTabsIcon,
  PlugIcon,
  RefreshCwIcon,
  SparklesIcon,
  TriangleAlertIcon,
} from 'lucide-react'
import { Link, useParams } from 'react-router'
import { DEMO_ORG_ID, to } from '@/shared/config/paths'
import { DEMO_TZ, pluralize } from '@/shared/lib/format'
import { useDemoState } from '@/shared/mock/state'
import { type HistoryEntry, HistoryFeed } from '@/shared/ui/rb/HistoryFeed'
import { PersonName } from '@/shared/ui/rb/PersonAvatar'
import { RecordHeader } from '@/shared/ui/rb/RecordHeader'
import { ResponsiveTabs, type TabDef } from '@/shared/ui/rb/ResponsiveTabs'
import { SectionCard } from '@/shared/ui/rb/Section'
import { StateView } from '@/shared/ui/rb/StateView'
import { OPERATION_STATUS, type OperationStatus, PUBLIC_STATUS, type PublicStatus } from '@/shared/ui/rb/status-presets'
import { StatusFromMeta } from '@/shared/ui/rb/StatusBadge'
import { type SyncInfo, SyncFreshness } from '@/shared/ui/rb/SyncFreshness'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { ArchivePropertyDialog } from '@/widgets/property-actions/ArchivePropertyDialog'
import { BookingsTab } from './ui/BookingsTab'
import { CalendarTab } from './ui/CalendarTab'
import { DirectTab } from './ui/DirectTab'
import { InfoTab } from './ui/InfoTab'
import { InstructionsTab } from './ui/InstructionsTab'
import { ListingsTab } from './ui/ListingsTab'
import { PrepTab } from './ui/PrepTab'
import { TasksTab } from './ui/TasksTab'

// ── Макетные данные: сценарии карточки объекта ──────────────────────────────

export type PropertyBrief = {
  id: string
  number: string
  name: string
  publicTitle: string
  address: string
  capacity: number
  operation: OperationStatus
  publicity: PublicStatus
  responsible: string
  checkIn: string
  checkOut: string
  syncs: SyncInfo[]
  next: string | null
  // Что сейчас мешает объекту больше всего — от этого зависит главное действие шапки
  blocker?: { tab: string; label: string; text: string }
}

// ligovsky — сбой доступа к Суточно; neva — объект в работе, не готов к заезду; moika — объявление привязано, публикация не готова
const PROPERTIES: Record<string, PropertyBrief> = {
  ligovsky: {
    id: 'ligovsky',
    number: '01',
    name: 'Студия на Лиговском',
    publicTitle: 'Студия у Московского вокзала',
    address: 'Санкт-Петербург, Лиговский пр., 50, кв. 14',
    capacity: 2,
    operation: 'active',
    publicity: 'published',
    responsible: 'Игорь Петров',
    checkIn: '14:00',
    checkOut: '12:00',
    syncs: [
      { source: 'avito', lastSuccess: '09:32' },
      { source: 'sutochno', lastSuccess: '07:58', failed: true, error: 'Площадка отклонила ключ доступа' },
    ],
    next: '8 окт, 14:00',
    blocker: { tab: 'listings', label: 'Восстановить доступ', text: 'Суточно не принимает ключ доступа с 07:58 — новые брони оттуда не придут' },
  },
  neva: {
    id: 'neva',
    number: '02',
    name: 'Лофт у Невы',
    publicTitle: 'Лофт с видом на Неву',
    address: 'Санкт-Петербург, Синопская наб., 22, кв. 81',
    capacity: 4,
    operation: 'active',
    publicity: 'published',
    responsible: 'Игорь Петров',
    checkIn: '15:00',
    checkOut: '12:00',
    syncs: [
      { source: 'avito', lastSuccess: '09:32' },
      { source: 'sutochno', lastSuccess: '09:30' },
    ],
    next: '8 окт, 15:00',
    blocker: { tab: 'prep', label: 'К подготовке', text: 'Заезд сегодня в 15:00, уборка ещё не начата' },
  },
  moika: {
    id: 'moika',
    number: '03',
    name: 'Апартаменты на Мойке',
    publicTitle: '',
    address: 'Санкт-Петербург, наб. Мойки, 12, кв. 5',
    capacity: 3,
    operation: 'active',
    publicity: 'draft',
    responsible: 'Анна Волкова',
    checkIn: '15:00',
    checkOut: '12:00',
    syncs: [{ source: 'avito', lastSuccess: '09:10' }],
    next: '15 окт, 15:00',
    blocker: { tab: 'direct', label: 'Подготовить публикацию', text: 'Для прямого бронирования не хватает 3 обязательных пунктов' },
  },
  repino: {
    id: 'repino',
    number: '04',
    name: 'Дом в Репино',
    publicTitle: 'Дом у залива в Репино',
    address: 'Ленинградская обл., Репино, Приморское ш., 412',
    capacity: 8,
    operation: 'paused',
    publicity: 'hidden',
    responsible: 'Анна Волкова',
    checkIn: '16:00',
    checkOut: '12:00',
    syncs: [],
    next: '10 окт, 16:00',
  },
}

const HISTORY: HistoryEntry[] = [
  { id: 'h6', at: `8 окт, 07:58 ${DEMO_TZ}`, author: 'Rentybot', text: 'Суточно отклонила ключ доступа, обмен остановлен', reason: 'ответ площадки 401', system: true },
  { id: 'h5', at: `6 окт, 18:20 ${DEMO_TZ}`, author: 'Анна Волкова', staff: true, text: 'Время заезда изменено с 15:00 на 14:00', reason: 'применено к броням с 10 окт' },
  { id: 'h4', at: `2 окт, 12:00 ${DEMO_TZ}`, author: 'Анна Волкова', staff: true, text: 'Опубликовано прямое бронирование' },
  { id: 'h3', at: `1 окт, 10:40 ${DEMO_TZ}`, author: 'Игорь Петров', staff: true, text: 'Обновлены инструкции: новый код ключницы' },
  { id: 'h2', at: `28 сен, 15:05 ${DEMO_TZ}`, author: 'Rentybot', text: 'Первый импорт с Авито: получено 6 броней', system: true },
  { id: 'h1', at: `28 сен, 14:50 ${DEMO_TZ}`, author: 'Анна Волкова', staff: true, text: 'Объект создан' },
]

// ── Вкладки (OBJ-03) ────────────────────────────────────────────────────────

const TAB_LABELS: { value: string; label: string; icon: LucideIcon }[] = [
  { value: 'info', label: 'Сведения', icon: InfoIcon },
  { value: 'calendar', label: 'Календарь', icon: CalendarRangeIcon },
  { value: 'bookings', label: 'Брони', icon: NotebookTabsIcon },
  { value: 'listings', label: 'Объявления', icon: PlugIcon },
  { value: 'tasks', label: 'Задачи', icon: ClipboardListIcon },
  { value: 'prep', label: 'Подготовка', icon: SparklesIcon },
  { value: 'instructions', label: 'Инструкции', icon: BookOpenIcon },
  { value: 'direct', label: 'Прямое бронирование', icon: GlobeIcon },
  { value: 'history', label: 'История', icon: HourglassIcon },
]

// ── Страница ────────────────────────────────────────────────────────────────

const PropertyPage = () => {
  const { orgId = DEMO_ORG_ID, propertyId = 'ligovsky', tab = 'info' } = useParams()
  const { state, isEmployee, isOwner, canSeeMoney } = useDemoState()
  const property = PROPERTIES[propertyId] ?? PROPERTIES.ligovsky

  if (state === 'loading') return <StateView state="loading" skeleton="record" className="pt-4 md:pt-10" />

  if (isEmployee || state === 'denied' || state === 'empty') {
    return (
      <div className="pt-4 md:pt-10">
        <StateView
          state={state === 'empty' ? 'empty' : 'denied'}
          empty={{
            title: 'Объект не найден',
            description: 'Объект перенесён в архив или ссылка устарела. Архивные объекты доступны владельцу в списке с фильтром.',
            action: (
              <Button variant="outline" size="sm" asChild>
                <Link to={to.properties(orgId)}>К объектам</Link>
              </Button>
            ),
          }}
          denied={{
            title: 'Объект недоступен',
            description: 'Настройки объекта видят владелец и управляющие. Адрес и инструкции для вашей работы — в задаче.',
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

  const tabs: TabDef[] = TAB_LABELS.filter((item) => canSeeMoney || item.value !== 'direct').map((item) => ({
    value: item.value,
    label: item.label,
    to: to.property(property.id, item.value, orgId),
    attention: item.value === property.blocker?.tab,
    count: item.value === property.blocker?.tab ? 1 : undefined,
  }))
  const activeTab = tabs.some((item) => item.value === tab) ? tab : 'info'

  return (
    <div className="flex flex-col gap-6 pt-4 pb-8 md:pt-8">
      <RecordHeader
        className="shadow-card"
        back={{ to: to.properties(orgId), label: 'Объекты' }}
        eyebrow={`Объект ${property.number}`}
        title={property.name}
        status={
          <>
            <StatusFromMeta meta={OPERATION_STATUS[property.operation]} />
            <StatusFromMeta meta={PUBLIC_STATUS[property.publicity]} />
            {property.syncs.map((sync) => (
              <SyncFreshness key={sync.source} sync={sync} compact />
            ))}
          </>
        }
        facts={[
          { label: 'Адрес', value: <span title={property.address}>{property.address.replace(/^Санкт-Петербург, |^Ленинградская обл., /, '')}</span> },
          { label: 'Вместимость', value: pluralize(property.capacity, ['гость', 'гостя', 'гостей']) },
          { label: `Заезд / выезд, ${DEMO_TZ}`, value: `${property.checkIn} / ${property.checkOut}` },
          { label: 'Ближайший заезд', value: property.next ?? 'Нет' },
          { label: 'Ответственный', value: <PersonName name={property.responsible} /> },
          { label: 'Площадок', value: property.syncs.length || 'Нет' },
        ]}
        primaryAction={
          property.blocker ? (
            <Button className="shadow-control" asChild>
              <Link to={to.property(property.id, property.blocker.tab, orgId)}>{property.blocker.label}</Link>
            </Button>
          ) : null
        }
        secondaryActions={
          <>
            {property.publicity === 'published' && (
              <Button variant="ghost" asChild>
                <Link to={to.hostProperty(property.id)}>
                  Как видит гость <ArrowUpRightIcon />
                </Link>
              </Button>
            )}
            {isOwner && (
              <ArchivePropertyDialog
                mode="archive"
                property={property.name}
                trigger={
                  <Button variant="ghost" size="icon" aria-label="Архивировать объект">
                    <ArchiveIcon />
                  </Button>
                }
              />
            )}
          </>
        }
      />

      {property.blocker && activeTab !== property.blocker.tab && (
        <Link
          to={to.property(property.id, property.blocker.tab, orgId)}
          className="flex items-center gap-3 rounded-3xl bg-foreground px-5 py-4 text-background shadow-card outline-none transition-opacity hover:opacity-90 focus-visible:ring-3 focus-visible:ring-ring/30 dark:bg-mist dark:text-foreground"
        >
          <TriangleAlertIcon className="size-4 shrink-0 text-lime" aria-hidden />
          <span className="flex-1 text-body-sm">{property.blocker.text}</span>
          <ArrowUpRightIcon className="size-4 shrink-0 text-smoke" aria-hidden />
        </Link>
      )}

      {state === 'error' && (
        <StateView
          state="error"
          error={{
            title: 'Данные объекта могли устареть',
            description: 'Не удалось получить свежие брони и статусы площадок. Показано состояние на момент последнего обмена.',
            lastSuccess: `8 окт, 07:58 ${DEMO_TZ}`,
            action: (
              <Button variant="outline" size="sm">
                <RefreshCwIcon /> Повторить
              </Button>
            ),
          }}
        />
      )}

      <ResponsiveTabs tabs={tabs} value={activeTab} label="Раздел объекта" />

      {activeTab === 'info' && <InfoTab property={property} />}
      {activeTab === 'calendar' && <CalendarTab property={property} />}
      {activeTab === 'bookings' && <BookingsTab property={property} canSeeMoney={canSeeMoney} />}
      {activeTab === 'listings' && <ListingsTab property={property} />}
      {activeTab === 'tasks' && <TasksTab property={property} />}
      {activeTab === 'prep' && <PrepTab property={property} />}
      {activeTab === 'instructions' && <InstructionsTab property={property} />}
      {activeTab === 'direct' && <DirectTab property={property} canPublish={isOwner} />}
      {activeTab === 'history' && (
        <SectionCard title="История" count={HISTORY.length} className="shadow-card">
          <HistoryFeed entries={HISTORY} />
        </SectionCard>
      )}
    </div>
  )
}

export default PropertyPage
