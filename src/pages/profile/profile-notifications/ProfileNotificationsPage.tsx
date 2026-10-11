import { useNotificationSettings } from '@/entities/notification'
import { StateView } from '@/shared/ui/rb/StateView'
import { NotificationSettingsForm } from './components/NotificationSettingsForm'

const ProfileNotificationsPage = () => {
  const { data: settings, isError } = useNotificationSettings()

  if (isError) return <StateView state="error" />
  if (!settings) return <StateView state="loading" skeleton="cards" />

  return <NotificationSettingsForm settings={settings} />
}

export default ProfileNotificationsPage
