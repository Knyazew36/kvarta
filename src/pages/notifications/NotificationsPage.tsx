import { useState } from 'react'
import { useCurrentOrganization } from '@/entities/organization'
import type { ListTaskNotificationsRead } from '@/shared/api/generated/models'
import { NotificationsFilter } from './components/NotificationsFilter'
import { NotificationsHeader } from './components/NotificationsHeader'
import { NotificationsList } from './components/NotificationsList'

const NotificationsPage = () => {
  const { organization } = useCurrentOrganization()
  const [filter, setFilter] = useState<ListTaskNotificationsRead>('all')

  return (
    <div className="flex flex-col gap-8 pb-8">
      <NotificationsHeader />
      <NotificationsFilter organizationId={organization.id} value={filter} onChange={setFilter} />
      <NotificationsList organizationId={organization.id} read={filter} />
    </div>
  )
}

export default NotificationsPage
