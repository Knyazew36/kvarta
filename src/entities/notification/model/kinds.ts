import {
  AlarmClockIcon,
  BanIcon,
  CircleCheckIcon,
  ClipboardCheckIcon,
  ClipboardListIcon,
  HourglassIcon,
  type LucideIcon,
  RotateCcwIcon,
  SunriseIcon,
  ThumbsUpIcon,
  TriangleAlertIcon,
} from 'lucide-react'

import type { TaskNotification, TaskNotificationKind } from '@/shared/api/generated/models'
import { to } from '@/shared/config/paths'
import { formatDate } from '@/shared/lib/format'

// Бэк отдаёт только вид события и название задачи — заголовок собираем здесь
export const NOTIFICATION_KIND_META: Record<TaskNotificationKind, { title: string; icon: LucideIcon }> = {
  assigned: { title: 'Вам назначена задача', icon: ClipboardListIcon },
  review_requested: { title: 'Отчёт ждёт проверки', icon: ClipboardCheckIcon },
  completed: { title: 'Задача выполнена', icon: CircleCheckIcon },
  returned: { title: 'Задача возвращена на доработку', icon: RotateCcwIcon },
  approved: { title: 'Задача принята', icon: ThumbsUpIcon },
  cancelled: { title: 'Задача отменена', icon: BanIcon },
  before_due: { title: 'Скоро срок задачи', icon: HourglassIcon },
  overdue: { title: 'Задача просрочена', icon: AlarmClockIcon },
  escalation: { title: 'Исполнитель не уложился в срок', icon: TriangleAlertIcon },
  daily_summary: { title: 'Сводка на день', icon: SunriseIcon },
}

// Вторая строка: название задачи, у сводки — её день
export const getNotificationText = (notification: TaskNotification): string => {
  if (notification.task_title) return notification.task_title
  return notification.local_date ? `План на ${formatDate(notification.local_date, 'd MMMM')}` : ''
}

// url из бэка — адрес API, а не страницы: ссылку в кабинете строим сами. У сводки задачи нет — ведём на «Сегодня»
export const getNotificationHref = (notification: TaskNotification, orgId: string): string =>
  notification.task_id === null ? to.today(orgId) : to.task(String(notification.task_id), orgId)
