import { useCurrentUser } from '@/entities/auth'
import { useCurrentOrganization } from '@/entities/organization'
import { useAllProperties } from '@/entities/property'
import { useTeamMembers, useTeamRoles } from '@/entities/team'
import { StateView } from '@/shared/ui/rb/StateView'
import { RoleMatrix } from './components/RoleMatrix'
import { TeamMembers } from './components/TeamMembers'

const SettingsTeamPage = () => {
  const { organization } = useCurrentOrganization()
  const { data: user } = useCurrentUser()
  const teamRoles = useTeamRoles(organization.id)
  // Участников и приглашения бэк отдаёт только тем, у кого есть team.view (owner, manager), — до проверки не запрашиваем
  const canView = !!teamRoles.data && (teamRoles.data.permissions as string[]).includes('team.view')
  const members = useTeamMembers(organization.id, { enabled: canView })
  // Активные объекты в доступе текущего пользователя: названия в строках и выбор в диалогах
  const { data: properties } = useAllProperties(organization.id)

  if (teamRoles.isPending) return <StateView state="loading" />
  if (teamRoles.isError) return <StateView state="error" />
  if (!canView) {
    return (
      <StateView
        state="denied"
        denied={{ title: 'Раздел недоступен', description: 'Команду и доступ настраивают владелец и управляющий организации.' }}
      />
    )
  }
  if (members.isPending) return <StateView state="loading" />
  if (members.isError) return <StateView state="error" />

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[1fr_340px]">
      <TeamMembers organizationId={organization.id} currentUserId={user?.id} teamRoles={teamRoles.data} members={members.data} properties={properties} />
      <RoleMatrix roles={teamRoles.data.roles} />
    </div>
  )
}

export default SettingsTeamPage
