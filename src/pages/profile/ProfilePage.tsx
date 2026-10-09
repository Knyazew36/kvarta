import { ArrowUpRightIcon, LogInIcon, LogOutIcon, RefreshCwIcon, ShieldCheckIcon, TriangleAlertIcon } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { DEMO_ORG_ID, ROUTES, to } from '@/shared/config/paths'
import { DEMO_TZ, DEMO_TZ_FULL } from '@/shared/lib/format'
import { DEMO_USERS, type DemoRole, useDemoState } from '@/shared/mock/state'
import { PersonAvatar } from '@/shared/ui/rb/PersonAvatar'
import { RecordHeader } from '@/shared/ui/rb/RecordHeader'
import { ResponsiveTabs, type TabDef } from '@/shared/ui/rb/ResponsiveTabs'
import { StateView } from '@/shared/ui/rb/StateView'
import { MAX_STATUS, type MaxStatus } from '@/shared/ui/rb/status-presets'
import { StatusBadge, StatusFromMeta } from '@/shared/ui/rb/StatusBadge'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { AboutTab } from './ui/AboutTab'
import { NotificationsTab } from './ui/NotificationsTab'
import { SecurityTab } from './ui/SecurityTab'
import { WorkspacesTab } from './ui/WorkspacesTab'

// ── Макетные данные: профиль текущего пользователя ──────────────────────────

export type ProfileBrief = {
  id: string
  firstName: string
  lastName: string
  // Как подписан человек в задачах и в переписке с гостем
  displayName: string
  roleLabel: string
  phone: string
  email: string | null
  maxAccount: string | null
  max: MaxStatus
  maxLastDelivery: string | null
  lastLogin: string
  since: string
  isNew: boolean
}

// Имя и роль — из того же мока, что и меню профиля в шапке: иначе они разойдутся
const nameOf = (role: DemoRole) => {
  const [firstName = '', lastName = ''] = DEMO_USERS[role].name.split(' ')
  return { firstName, lastName }
}

const PROFILES: Record<DemoRole, ProfileBrief> = {
  owner: {
    id: 'u-1042',
    ...nameOf('owner'),
    displayName: 'Анна',
    roleLabel: DEMO_USERS.owner.role,
    phone: '+7 921 ••• •• 47',
    email: 'a•••@yandex.ru',
    maxAccount: '@anna_volkova',
    max: 'linked',
    maxLastDelivery: `8 окт, 09:31 ${DEMO_TZ}`,
    lastLogin: `8 окт, 09:12 ${DEMO_TZ}`,
    since: 'сентябрь 2026',
    isNew: false,
  },
  manager: {
    id: 'u-1077',
    ...nameOf('manager'),
    displayName: 'Игорь П.',
    roleLabel: DEMO_USERS.manager.role,
    phone: '+7 911 ••• •• 03',
    email: null,
    maxAccount: null,
    max: 'none',
    maxLastDelivery: null,
    lastLogin: `8 окт, 08:50 ${DEMO_TZ}`,
    since: 'сентябрь 2026',
    isNew: false,
  },
  // У сотрудника MAX — основной канал задач, поэтому на нём показан сбой доставки
  employee: {
    id: 'u-1103',
    ...nameOf('employee'),
    displayName: 'Марина С.',
    roleLabel: DEMO_USERS.employee.role,
    phone: '+7 952 ••• •• 18',
    email: null,
    maxAccount: '@marina_s',
    max: 'failed',
    maxLastDelivery: `7 окт, 18:02 ${DEMO_TZ}`,
    lastLogin: `8 окт, 07:40 ${DEMO_TZ}`,
    since: 'октябрь 2026',
    isNew: false,
  },
}

// ?state=empty — человек только что вошёл по приглашению: имени нет, MAX не подключён
const NEWCOMER: ProfileBrief = {
  id: 'u-1180',
  firstName: '',
  lastName: '',
  displayName: '',
  roleLabel: DEMO_USERS.employee.role,
  phone: '+7 999 ••• •• 61',
  email: null,
  maxAccount: null,
  max: 'none',
  maxLastDelivery: null,
  lastLogin: `8 окт, 09:38 ${DEMO_TZ}`,
  since: 'сегодня',
  isNew: true,
}

type Blocker = { tab: string; label: string; text: string }

// Одно главное действие: что сильнее всего мешает человеку получать работу вовремя
const blockerFor = (profile: ProfileBrief): Blocker | null => {
  if (profile.isNew) {
    return { tab: 'about', label: 'Указать имя', text: 'Пока имени нет, в задачах и сообщениях гостям вместо него стоит номер телефона' }
  }
  if (profile.max === 'failed') {
    return {
      tab: 'notifications',
      label: 'Проверить MAX',
      text: `Сообщения в MAX не доходят с ${profile.maxLastDelivery}: напоминания о задачах видны только в кабинете`,
    }
  }
  if (profile.max === 'none') {
    return { tab: 'notifications', label: 'Подключить MAX', text: 'Без MAX уведомления о бронях и задачах видны только здесь, в кабинете' }
  }
  return null
}

// ── Вкладки ─────────────────────────────────────────────────────────────────

const tabLabels = (isEmployee: boolean) => [
  { value: 'about', label: 'Личные данные' },
  { value: 'security', label: 'Вход и устройства' },
  { value: 'notifications', label: 'Уведомления' },
  // У сотрудника нет раздела «Помощь» в меню: он живёт здесь (§2 «Профиль / помощь»)
  { value: 'workspaces', label: isEmployee ? 'Организации и помощь' : 'Организации и кабинеты' },
]

// ── Страница ────────────────────────────────────────────────────────────────

const ProfilePage = () => {
  const { orgId = DEMO_ORG_ID, tab = 'about' } = useParams()
  const { state, role, isEmployee } = useDemoState()

  if (state === 'loading') return <StateView state="loading" skeleton="record" className="pt-4 md:pt-10" />

  // Профиль свой у каждого, «нет прав» здесь означает только одно — сеанс завершён (ACL-05)
  if (state === 'denied') {
    return (
      <div className="pt-4 md:pt-10">
        <StateView
          state="denied"
          denied={{
            title: 'Сеанс завершён',
            description: 'Вход на этом устройстве закрыт из другого сеанса. Данные профиля скрыты — войдите снова, чтобы продолжить.',
            action: (
              <Button size="sm" asChild>
                <Link to={ROUTES.LOGIN}>
                  <LogInIcon /> Войти снова
                </Link>
              </Button>
            ),
          }}
        />
      </div>
    )
  }

  const profile = state === 'empty' ? NEWCOMER : PROFILES[role]
  const fullName = `${profile.firstName} ${profile.lastName}`.trim()
  const blocker = blockerFor(profile)
  const tabs: TabDef[] = tabLabels(isEmployee).map((item) => ({
    ...item,
    to: to.profile(item.value, orgId),
    attention: item.value === blocker?.tab,
    count: item.value === blocker?.tab ? 1 : undefined,
  }))
  const activeTab = tabs.some((item) => item.value === tab) ? tab : 'about'

  return (
    <div className="flex flex-col gap-6 pt-4 pb-8 md:pt-8">
      <RecordHeader
        className="shadow-card"
        eyebrow={`Профиль · ${profile.id}`}
        title={
          <span className="flex items-center gap-4">
            <PersonAvatar name={fullName || '?'} size="xl" tone="accent" className="hidden shrink-0 md:flex" />
            <span className={fullName ? '' : 'text-smoke'}>{fullName || 'Имя не указано'}</span>
          </span>
        }
        status={
          <>
            <StatusBadge tone="inverse" icon={ShieldCheckIcon}>
              {profile.roleLabel}
            </StatusBadge>
            <StatusFromMeta meta={MAX_STATUS[profile.max]} />
          </>
        }
        facts={[
          { label: 'Телефон для входа', value: profile.phone },
          { label: 'Почта', value: profile.email ?? 'Не указана' },
          { label: 'Организация', value: 'Волна' },
          { label: 'Часовой пояс', value: <span title={DEMO_TZ_FULL}>{DEMO_TZ}, UTC+3</span> },
          { label: 'Последний вход', value: profile.lastLogin },
          { label: 'В Rentybot с', value: profile.since },
        ]}
        primaryAction={
          blocker && blocker.tab !== activeTab ? (
            <Button className="shadow-control" asChild>
              <Link to={to.profile(blocker.tab, orgId)}>{blocker.label}</Link>
            </Button>
          ) : null
        }
        secondaryActions={
          <Button variant="ghost" asChild>
            <Link to={ROUTES.LOGIN}>
              <LogOutIcon /> Выйти
            </Link>
          </Button>
        }
      />

      {blocker && activeTab !== blocker.tab && (
        <Link
          to={to.profile(blocker.tab, orgId)}
          className="flex items-center gap-3 rounded-3xl bg-foreground px-5 py-4 text-background shadow-card outline-none transition-opacity hover:opacity-90 focus-visible:ring-3 focus-visible:ring-ring/30 dark:bg-mist dark:text-foreground"
        >
          <TriangleAlertIcon className="size-4 shrink-0 text-lime" aria-hidden />
          <span className="flex-1 text-body-sm">{blocker.text}</span>
          <ArrowUpRightIcon className="size-4 shrink-0 text-smoke" aria-hidden />
        </Link>
      )}

      {state === 'error' && (
        <StateView
          state="error"
          error={{
            title: 'Изменения могли не сохраниться',
            description: 'Сервер не подтвердил последнее сохранение. Ниже — настройки на момент последнего успешного ответа.',
            lastSuccess: `8 окт, 09:12 ${DEMO_TZ}`,
            action: (
              <Button variant="outline" size="sm">
                <RefreshCwIcon /> Повторить
              </Button>
            ),
          }}
        />
      )}

      <ResponsiveTabs tabs={tabs} value={activeTab} label="Раздел профиля" />

      {activeTab === 'about' && <AboutTab key={profile.id} profile={profile} />}
      {activeTab === 'security' && <SecurityTab profile={profile} />}
      {activeTab === 'notifications' && <NotificationsTab key={role} profile={profile} role={role} />}
      {activeTab === 'workspaces' && <WorkspacesTab profile={profile} role={role} />}
    </div>
  )
}

export default ProfilePage
