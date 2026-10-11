import { isAxiosError } from 'axios'
import {
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
import { Link, Outlet, useMatch, useParams } from 'react-router'
import { isEmployee, useCurrentOrganization } from '@/entities/organization'
import { useProperty } from '@/entities/property'
import { ROUTES, to } from '@/shared/config/paths'
import { cn } from '@/shared/lib/utils'
import { MOCK_BORDER } from '@/shared/mock/mock-border'
import { ResponsiveTabs, type TabDef } from '@/shared/ui/rb/ResponsiveTabs'
import { StateView } from '@/shared/ui/rb/StateView'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { PropertyHeader } from './components/PropertyHeader'
import { MOCK_PROPERTY } from './model/mock'

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

// ── Лейаут ──────────────────────────────────────────────────────────────────

// Общая оболочка объекта: шапка и вкладки остаются на месте, меняется только страница вкладки.
// Объект загружается здесь — страницы вкладок берут его через useCurrentProperty
const LayoutProperty = () => {
  const { organization, role } = useCurrentOrganization()
  const { propertyId = '' } = useParams()
  // Индекс /properties/:id показывает «Сведения» без редиректа: сегмента вкладки в адресе тогда нет
  const tab = useMatch(`${ROUTES.PROPERTY}/:tab`)?.params.tab ?? 'info'
  const orgId = String(organization.id)
  // Бэк принимает только числовой id; остальное (старые ссылки макетов вида /properties/ligovsky) — «не найден» без запроса
  const isValidId = /^\d+$/.test(propertyId)
  const { data: property, isPending, isError, error, refetch, isRefetching } = useProperty(organization.id, Number(propertyId))

  // Раздел — для владельца и управляющих: сотруднику адрес и инструкции приходят в задаче
  if (isEmployee(role)) {
    return (
      <StateView
        state="denied"
        className="mt-4 md:mt-10"
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
    )
  }

  // 404 — объекта нет или он не назначен текущему участнику
  if (!isValidId || (isError && isAxiosError(error) && error.response?.status === 404)) {
    return (
      <StateView
        state="empty"
        className="mt-4 md:mt-10"
        empty={{
          title: 'Объект не найден',
          description: 'Ссылка устарела или объект вам не назначен. Архивные объекты есть в списке под фильтром «Архив».',
          action: (
            <Button variant="outline" size="sm" asChild>
              <Link to={to.properties(orgId)}>К объектам</Link>
            </Button>
          ),
        }}
      />
    )
  }

  if (isPending) return <StateView state="loading" skeleton="record" className="pt-4 md:pt-10" />

  if (isError) {
    return (
      <StateView
        state="error"
        className="mt-4 md:mt-10"
        error={{
          title: 'Объект не загрузился',
          description: 'Проверьте соединение и повторите попытку.',
          action: (
            <Button variant="outline" size="sm" disabled={isRefetching} onClick={() => refetch()}>
              <RefreshCwIcon /> Повторить
            </Button>
          ),
        }}
      />
    )
  }

  const isOwner = role === 'owner'
  const propertyUrlId = String(property.id)
  // Прямое бронирование — зона владельца: остальным вкладку не показываем
  const tabs: TabDef[] = TAB_LABELS.filter((item) => isOwner || item.value !== 'direct').map((item) => ({
    value: item.value,
    label: item.label,
    to: to.property(propertyUrlId, item.value, orgId),
  }))
  const activeTab = tabs.some((item) => item.value === tab) ? tab : 'info'
  const blocker = MOCK_PROPERTY.blocker

  return (
    <div className="flex flex-col gap-6 pt-4 pb-8 md:pt-8">
      <PropertyHeader property={property} orgId={orgId} isOwner={isOwner} />

      {/* Что мешает объекту — считается по площадкам и подготовке, ручек под это пока нет */}
      {blocker && activeTab !== blocker.tab && (
        <Link
          to={to.property(propertyUrlId, blocker.tab, orgId)}
          className={cn(
            'flex items-center gap-3 rounded-3xl bg-foreground px-5 py-4 text-background shadow-card outline-none transition-opacity hover:opacity-90 focus-visible:ring-3 focus-visible:ring-ring/30 dark:bg-mist dark:text-foreground',
            MOCK_BORDER,
          )}
        >
          <TriangleAlertIcon className="size-4 shrink-0 text-lime" aria-hidden />
          <span className="flex-1 text-body-sm">{blocker.text}</span>
          <ArrowUpRightIcon className="size-4 shrink-0 text-smoke" aria-hidden />
        </Link>
      )}

      <ResponsiveTabs tabs={tabs} value={activeTab} label="Раздел объекта" />

      <Outlet />
    </div>
  )
}

export default LayoutProperty
