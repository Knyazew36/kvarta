import { Link, useParams } from 'react-router'
import { DEMO_ORG_ID, to } from '@/shared/config/paths'
import { DEMO_TZ_FULL } from '@/shared/lib/format'
import { useDemoState } from '@/shared/mock/state'
import { ResponsiveTabs, type TabDef } from '@/shared/ui/rb/ResponsiveTabs'
import { StateView } from '@/shared/ui/rb/StateView'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { navFor } from '@/widgets/app-shell/nav'
import { ChannelsSection } from './ui/ChannelsSection'
import { ExportSection } from './ui/ExportSection'
import { NotificationsSection } from './ui/NotificationsSection'
import { PageSection } from './ui/PageSection'
import { RequisitesSection } from './ui/RequisitesSection'
import { TeamSection } from './ui/TeamSection'

// Подзаголовок раздела — что именно здесь настраивается, одной фразой
const SECTIONS: Record<string, { title: string; lead: string; Component: React.ComponentType }> = {
  team: { title: 'Команда и доступ', lead: 'Кто работает в организации, с какими объектами и что может делать.', Component: TeamSection },
  channels: { title: 'Площадки', lead: 'Аккаунты Авито и Суточно, доступ к броням и журнал обмена.', Component: ChannelsSection },
  page: { title: 'Моя страница', lead: 'Страница, по которой гости бронируют напрямую, без комиссии площадок.', Component: PageSection },
  requisites: { title: 'Реквизиты', lead: 'Куда гости переводят предоплату и остаток.', Component: RequisitesSection },
  notifications: { title: 'Уведомления и MAX', lead: 'О чём, кому и когда приходят сообщения.', Component: NotificationsSection },
  export: { title: 'Выгрузки', lead: 'Брони, деньги и задачи — файлом для бухгалтерии или своего учёта.', Component: ExportSection },
}

const SettingsPage = () => {
  const { orgId = DEMO_ORG_ID, section = 'team' } = useParams()
  const { role, state } = useDemoState()
  // Разделы — те же, что в меню: доступность по фактическому праву, а не по названию раздела (§2)
  const allowed = navFor(role).settings.map((item) => item.key)
  const current = SECTIONS[section] ? section : 'team'
  const { title, lead, Component } = SECTIONS[current]

  const tabs: TabDef[] = allowed.map((key) => ({ value: key, label: SECTIONS[key].title, to: to.settings(key, orgId) }))

  const header = (
    <header className="flex flex-col gap-6 pt-4 md:pt-10">
      <p className="text-caption text-smoke">Настройки организации «Волна» · {DEMO_TZ_FULL}</p>
      <div className="flex flex-col gap-4">
        <h1 className="text-heading font-semibold tracking-[-0.03em] md:text-heading-lg">{title}</h1>
        <p className="max-w-2xl text-subheading-lg text-slate">{lead}</p>
      </div>
    </header>
  )

  if (!allowed.includes(current) || state === 'denied' || state === 'loading') {
    return (
      <div className="flex flex-col gap-10 pb-8">
        {header}
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
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 pb-8">
      {header}
      {tabs.length > 1 && <ResponsiveTabs tabs={tabs} value={current} label="Раздел настроек" />}
      <Component />
    </div>
  )
}

export default SettingsPage
