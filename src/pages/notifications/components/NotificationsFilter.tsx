import { useUnreadNotificationsCount } from '@/entities/notification'
import type { ListTaskNotificationsRead } from '@/shared/api/generated/models'
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/shadcn/animate-ui/components/animate/tabs'

type NotificationsFilterProps = {
  organizationId: number
  value: ListTaskNotificationsRead
  onChange: (value: ListTaskNotificationsRead) => void
}

// Подборки — это параметр read ленты. Только Animate UI: переезжающая подложка одинакова во всём кабинете
export const NotificationsFilter = ({ organizationId, value, onChange }: NotificationsFilterProps) => {
  const { data: unread = 0 } = useUnreadNotificationsCount(organizationId)

  return (
    <Tabs value={value} onValueChange={(next) => onChange(next as ListTaskNotificationsRead)}>
      <TabsList aria-label="Подборка уведомлений" className="h-12 bg-card shadow-control">
        <TabsTrigger value="all" className="h-10">
          Все
        </TabsTrigger>
        <TabsTrigger value="unread" className="h-10">
          Непрочитанные
          {unread > 0 && <span className="rounded-full bg-lime px-1.5 text-caption text-[#0a1217] tabular-nums">{unread}</span>}
        </TabsTrigger>
        <TabsTrigger value="read" className="h-10">
          Прочитанные
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
