import { Link, Outlet, useMatch } from 'react-router'
import { useCurrentOrganization } from '@/entities/organization'
import { ROUTES, to } from '@/shared/config/paths'
import { useDemoState } from '@/shared/mock/state'
import { ResponsiveTabs, type TabDef } from '@/shared/ui/rb/ResponsiveTabs'
import { StateView } from '@/shared/ui/rb/StateView'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { navFor } from '@/widgets/app-shell/nav'

// ── Разделы ─────────────────────────────────────────────────────────────────

// Подзаголовок раздела — что именно здесь настраивается, одной фразой
const SECTIONS: Record<string, { title: string; lead: string }> = {
  team: { title: 'Команда и доступ', lead: 'Кто работает в организации, с какими объектами и что может делать.' },
  invitations: { title: 'Приглашения', lead: 'Кому выданы ссылки в команду, их статус, отзыв и повторная отправка.' },
  channels: { title: 'Площадки', lead: 'Аккаунты Авито и Суточно, доступ к броням и журнал обмена.' },
  page: { title: 'Моя страница', lead: 'Страница, по которой гости бронируют напрямую, без комиссии площадок.' },
  requisites: { title: 'Реквизиты', lead: 'Куда гости переводят предоплату и остаток.' },
  notifications: { title: 'Уведомления и MAX', lead: 'О чём, кому и когда приходят сообщения.' },
  export: { title: 'Выгрузки', lead: 'Брони, деньги и задачи — файлом для бухгалтерии или своего учёта.' },
}

// Разделы на API: доступ проверяют сами, демо-варианты «нет прав» и «загрузка» на них не действуют
const API_SECTIONS = ['team', 'invitations']

// ── Лейаут ──────────────────────────────────────────────────────────────────

// Общая оболочка настроек: шапка и вкладки остаются на месте, меняется только страница раздела.
// «Команда» и «Приглашения» работают на API и сами решают, кому их показывать; остальные пять разделов — моки с демо-ролью
const LayoutSettings = () => {
  // Индекс /settings показывает «Команду» без редиректа: сегмента раздела в адресе тогда нет
  const section = useMatch(`${ROUTES.SETTINGS}/:section`)?.params.section ?? 'team'
  const { organization, role } = useCurrentOrganization()
  const { role: demoRole, state } = useDemoState()
  const orgId = String(organization.id)

  // Команду и приглашения бэк отдаёт владельцу и управляющему — вкладки по настоящей роли. Остальные разделы — по демо-роли, как в меню
  const mockSections = navFor(demoRole)
    .settings.map((item) => item.key)
    .filter((key) => key !== 'team')
  const allowed = [...(role === 'owner' || role === 'manager' ? API_SECTIONS : []), ...mockSections]
  const current = SECTIONS[section] ? section : 'team'
  const { title, lead } = SECTIONS[current]

  const tabs: TabDef[] = allowed.map((key) => ({ value: key, label: SECTIONS[key].title, to: to.settings(key, orgId) }))
  // Варианты «нет прав» и «загрузка» из демо-панели — только для разделов-моков
  const mockUnavailable = !API_SECTIONS.includes(current) && (!allowed.includes(current) || state === 'denied' || state === 'loading')

  return (
    <div className="flex flex-col gap-8 pb-8">
      <header className="flex flex-col gap-6 pt-4 md:pt-10">
        <p className="text-caption text-smoke">Настройки организации «{organization.name}»</p>
        <div className="flex flex-col gap-4">
          <h1 className="text-heading font-semibold tracking-[-0.03em] md:text-heading-lg">{title}</h1>
          <p className="max-w-2xl text-subheading-lg text-slate">{lead}</p>
        </div>
      </header>
      {tabs.length > 1 && allowed.includes(current) && <ResponsiveTabs tabs={tabs} value={current} label="Раздел настроек" />}
      {mockUnavailable ? (
        <StateView
          state={state === 'loading' ? 'loading' : 'denied'}
          skeleton="list"
          denied={{
            title: 'Раздел недоступен',
            description: `«${title}» настраивает владелец организации. Если вам нужен доступ — попросите его в разделе «Команда и доступ».`,
            action: (
              <Button variant="secondary" size="sm" asChild>
                <Link to={allowed[0] ? to.settings(allowed[0], orgId) : to.today(orgId)}>{allowed[0] ? 'Доступные настройки' : 'На «Сегодня»'}</Link>
              </Button>
            ),
          }}
        />
      ) : (
        <Outlet />
      )}
    </div>
  )
}

export default LayoutSettings
