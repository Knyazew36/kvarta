import { motion } from 'motion/react'
import { Link } from 'react-router'
import { getNotificationHref, getNotificationText, NOTIFICATION_KIND_META } from '@/entities/notification'
import type { TaskNotification } from '@/shared/api/generated/models'
import { formatTime } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { EASE } from '@/shared/ui/rb/motion-presets'

type NotificationRowProps = {
  notification: TaskNotification
  orgId: string
  onOpen: (notification: TaskNotification) => void
}

export const NotificationRow = ({ notification, orgId, onOpen }: NotificationRowProps) => {
  const { title, icon: Icon } = NOTIFICATION_KIND_META[notification.kind]
  const read = notification.read_at !== null
  const text = getNotificationText(notification)

  return (
    <motion.li layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.35, ease: EASE }}>
      <Link
        to={getNotificationHref(notification, orgId)}
        onClick={() => onOpen(notification)}
        className="-mx-3 flex gap-4 rounded-2xl p-3 outline-none transition-colors hover:bg-background/70 focus-visible:bg-background/70"
      >
        <span className="relative flex size-10 shrink-0 items-center justify-center rounded-full bg-background">
          <Icon className="size-4" aria-hidden />
          {!read && <span className="absolute -top-0.5 -right-0.5 size-3 rounded-full bg-lime ring-2 ring-card" aria-label="не прочитано" />}
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="flex items-baseline justify-between gap-3">
            <span className={cn('text-body-sm', read ? 'text-slate' : 'font-medium')}>{title}</span>
            {notification.published_at && <span className="shrink-0 text-caption text-smoke tabular-nums">{formatTime(notification.published_at)}</span>}
          </span>
          {text && <span className="text-body-sm text-slate">{text}</span>}
        </span>
      </Link>
    </motion.li>
  )
}
