import { LogOutIcon, ShieldCheckIcon } from 'lucide-react'
import { Outlet, useMatch } from 'react-router'
import { useCurrentUser } from '@/entities/auth'
import { getRoleLabel, isEmployee, useCurrentOrganization } from '@/entities/organization'
import { useLogout } from '@/features/logout'
import { ROUTES, to } from '@/shared/config/paths'
import { PersonAvatar } from '@/shared/ui/rb/PersonAvatar'
import { RecordHeader } from '@/shared/ui/rb/RecordHeader'
import { ResponsiveTabs, type TabDef } from '@/shared/ui/rb/ResponsiveTabs'
import { StatusBadge } from '@/shared/ui/rb/StatusBadge'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

// ── Вкладки ─────────────────────────────────────────────────────────────────

const tabLabels = (employee: boolean) => [
  { value: 'about', label: 'Личные данные' },
  { value: 'security', label: 'Вход и устройства' },
  { value: 'notifications', label: 'Уведомления' },
  // У сотрудника нет раздела «Помощь» в меню: он живёт здесь (§2 «Профиль / помощь»)
  { value: 'workspaces', label: employee ? 'Организации и помощь' : 'Организации и кабинеты' },
]

// ── Лейаут ──────────────────────────────────────────────────────────────────

// Общая оболочка профиля: шапка и вкладки остаются на месте, меняется только страница вкладки.
// Вкладки не размонтируются при переходе — поэтому подложка активной вкладки переезжает, а не появляется заново
const LayoutProfile = () => {
  // Индекс /profile показывает «Личные данные» без редиректа: сегмента вкладки в адресе тогда нет
  const tab = useMatch(`${ROUTES.PROFILE}/:tab`)?.params.tab ?? 'about'
  const { data: user } = useCurrentUser()
  const { organization, role } = useCurrentOrganization()
  const { logout, isPending } = useLogout()

  // Гостя сюда не пускает PrivateRoute; null бывает только на мгновение после выхода, до редиректа
  if (!user) return null

  const name = user.name.trim()
  const tabs: TabDef[] = tabLabels(isEmployee(role)).map((item) => ({ ...item, to: to.profile(item.value, String(organization.id)) }))
  const activeTab = tabs.some((item) => item.value === tab) ? tab : 'about'

  return (
    <div className="flex flex-col gap-6 pt-4 pb-8 md:pt-8">
      <RecordHeader
        className="shadow-card"
        eyebrow={`Профиль · ${user.id}`}
        title={
          <span className="flex items-center gap-4">
            <PersonAvatar name={name || '?'} size="xl" tone="accent" className="hidden shrink-0 md:flex" />
            <span className={name ? '' : 'text-smoke'}>{name || 'Имя не указано'}</span>
          </span>
        }
        status={
          <StatusBadge tone="inverse" icon={ShieldCheckIcon}>
            {getRoleLabel(role)}
          </StatusBadge>
        }
        facts={[
          { label: 'Почта для входа', value: user.email },
          { label: 'Организация', value: organization.name },
        ]}
        secondaryActions={
          <Button variant="ghost" onClick={logout} disabled={isPending}>
            <LogOutIcon /> Выйти
          </Button>
        }
      />

      <ResponsiveTabs tabs={tabs} value={activeTab} label="Раздел профиля" />

      <Outlet />
    </div>
  )
}

export default LayoutProfile
