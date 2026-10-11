import { BellIcon } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import {
  getNotificationHref,
  getNotificationText,
  NOTIFICATION_KIND_META,
  useNotifications,
  useReadNotification,
  useUnreadNotificationsCount,
} from '@/entities/notification'
import { useCurrentOrganization } from '@/entities/organization'
import { to } from '@/shared/config/paths'
import { formatTime } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/shadcn/popover'

// В колокольчике — только свежие события, остальное на странице уведомлений
const PREVIEW = 4

// Работает только под OrganizationRoute: лента у каждой организации своя
export const NotificationsPopover = () => {
  const { organization } = useCurrentOrganization()
  const orgId = String(organization.id)
  const [open, setOpen] = useState(false)
  const { data: unread = 0 } = useUnreadNotificationsCount(organization.id)
  // Тот же кэш, что у страницы уведомлений: прочитанное в одном месте сразу прочитано в другом
  const { data } = useNotifications(organization.id)
  const readNotification = useReadNotification(organization.id)
  const preview = data?.pages[0]?.data.slice(0, PREVIEW) ?? []
  const close = () => setOpen(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={`Уведомления, непрочитанных: ${unread}`}
        className="relative flex size-11 items-center justify-center rounded-full bg-card outline-none transition-colors hover:bg-mist focus-visible:ring-3 focus-visible:ring-ring/30 data-popup-open:bg-foreground data-popup-open:text-background"
      >
        <BellIcon className="size-5" aria-hidden />
        {unread > 0 && (
          <span className="mono-label absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-attention px-1 text-background">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-[min(380px,calc(100vw-2rem))] gap-2 p-2">
        <div className="flex items-center justify-between px-3 pt-2">
          <span className="section-heading text-subheading-lg">Уведомления</span>
          <Link to={to.notifications(orgId)} onClick={close} className="mono-label text-slate underline-offset-4 hover:underline">
            Все
          </Link>
        </div>
        {preview.length === 0 ? (
          <p className="px-3 pb-3 text-body-sm text-slate">Событий пока нет</p>
        ) : (
          <ul className="flex flex-col">
            {preview.map((notification) => {
              const { title, icon: Icon } = NOTIFICATION_KIND_META[notification.kind]
              const read = notification.read_at !== null
              return (
                <li key={notification.id}>
                  <Link
                    to={getNotificationHref(notification, orgId)}
                    onClick={() => {
                      if (!read) readNotification.mutate({ id: notification.id, version: notification.version })
                      close()
                    }}
                    className="flex gap-3 rounded-3xl p-3 outline-none transition-colors hover:bg-mist focus-visible:bg-mist"
                  >
                    <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-full', read ? 'bg-mist' : 'bg-foreground text-background')}>
                      <Icon className="size-4" aria-hidden />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className={cn('truncate text-body-sm', read ? 'text-slate' : 'font-medium')}>{title}</span>
                        {notification.published_at && <span className="mono-label shrink-0 text-smoke">{formatTime(notification.published_at)}</span>}
                      </span>
                      <span className="truncate text-body-sm text-slate">{getNotificationText(notification)}</span>
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  )
}
