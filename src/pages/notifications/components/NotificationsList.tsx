import { isToday, isYesterday, parseISO } from 'date-fns'
import { AnimatePresence } from 'motion/react'
import { useNotifications, useReadNotification } from '@/entities/notification'
import type { ListTaskNotificationsRead, TaskNotification } from '@/shared/api/generated/models'
import { formatDate } from '@/shared/lib/format'
import { StateView } from '@/shared/ui/rb/StateView'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Spinner } from '@/shared/ui/shadcn/spinner'
import { NotificationRow } from './NotificationRow'

const EMPTY_TEXT: Record<ListTaskNotificationsRead, string> = {
  all: 'Назначения, отчёты на проверку и напоминания о сроках появятся здесь.',
  unread: 'Непрочитанных уведомлений нет.',
  read: 'Прочитанных уведомлений пока нет.',
}

const dayLabel = (date: string) => {
  const day = parseISO(date)
  const label = formatDate(day, 'd MMM')
  if (isToday(day)) return `Сегодня, ${label}`
  if (isYesterday(day)) return `Вчера, ${label}`
  return formatDate(day, 'd MMMM')
}

// Лента приходит уже отсортированной (свежие сверху) — дни идут подряд, достаточно резать по смене даты
const groupByDay = (notifications: TaskNotification[]) => {
  const days: { key: string; items: TaskNotification[] }[] = []
  for (const notification of notifications) {
    const key = formatDate(notification.published_at ?? notification.scheduled_at, 'yyyy-MM-dd')
    const last = days.at(-1)
    if (last?.key === key) last.items.push(notification)
    else days.push({ key, items: [notification] })
  }
  return days
}

export const NotificationsList = ({ organizationId, read }: { organizationId: number; read: ListTaskNotificationsRead }) => {
  const { data, isPending, isError, hasNextPage, isFetchingNextPage, fetchNextPage } = useNotifications(organizationId, read)
  const readNotification = useReadNotification(organizationId)

  if (isPending) return <StateView state="loading" />
  if (isError) return <StateView state="error" />

  const notifications = data.pages.flatMap((page) => page.data)
  if (notifications.length === 0) return <StateView state="empty" empty={{ title: 'Событий пока нет', description: EMPTY_TEXT[read] }} />

  const open = (notification: TaskNotification) => {
    if (notification.read_at === null) readNotification.mutate({ id: notification.id, version: notification.version })
  }

  return (
    <>
      {groupByDay(notifications).map((day) => (
        <section key={day.key} className="flex flex-col gap-3 rounded-card bg-card p-4 shadow-card md:p-8">
          <h2 className="section-heading text-subheading-lg">{dayLabel(day.key)}</h2>
          <ul className="flex flex-col">
            <AnimatePresence initial={false}>
              {day.items.map((notification) => (
                <NotificationRow key={notification.id} notification={notification} orgId={String(organizationId)} onOpen={open} />
              ))}
            </AnimatePresence>
          </ul>
        </section>
      ))}
      {hasNextPage && (
        <Button variant="outline" className="self-center bg-canvas shadow-control" disabled={isFetchingNextPage} onClick={() => fetchNextPage()}>
          {isFetchingNextPage && <Spinner />} Показать ещё
        </Button>
      )}
    </>
  )
}
