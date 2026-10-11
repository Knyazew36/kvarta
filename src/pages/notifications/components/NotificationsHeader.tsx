import { CheckCheckIcon, Settings2Icon } from 'lucide-react'
import { Link } from 'react-router'
import { useUnreadNotificationsCount } from '@/entities/notification'
import { isEmployee, useCurrentOrganization } from '@/entities/organization'
import { to } from '@/shared/config/paths'
import { pluralize } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { MOCK_BORDER } from '@/shared/mock/mock-border'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

export const NotificationsHeader = () => {
  const { organization, role } = useCurrentOrganization()
  const { data: unread } = useUnreadNotificationsCount(organization.id)

  return (
    <header className="flex flex-col gap-6 pt-4 md:pt-10">
      <p className="text-caption text-smoke">Лента событий</p>
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-4">
          <h1 className="text-heading font-semibold tracking-[-0.03em] md:text-heading-lg">Уведомления</h1>
          {unread !== undefined && (
            <p className="max-w-2xl text-subheading-lg text-slate">
              {unread > 0 ? (
                <>
                  <span className="text-foreground">{pluralize(unread, ['непрочитанное', 'непрочитанных', 'непрочитанных'])}</span>.
                </>
              ) : (
                'Всё прочитано.'
              )}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Мок: массового чтения на бэке ещё нет — кнопка ждёт ручку */}
          <Button variant="outline" className={cn('bg-canvas shadow-control', MOCK_BORDER)}>
            <CheckCheckIcon /> Прочитать всё
          </Button>
          {!isEmployee(role) && (
            <Button variant="ghost" asChild>
              <Link to={to.settings('notifications', String(organization.id))}>
                <Settings2Icon /> Правила
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
