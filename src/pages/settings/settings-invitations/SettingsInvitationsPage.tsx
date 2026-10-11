import { UserPlusIcon } from 'lucide-react'
import { useCurrentOrganization } from '@/entities/organization'
import { useAllProperties } from '@/entities/property'
import { useTeamInvitations, useTeamMembers, useTeamRoles } from '@/entities/team'
import { InviteDialog } from '@/pages/settings/settings-team/components/InviteDialog'
import { SectionCard } from '@/shared/ui/rb/Section'
import { StateView } from '@/shared/ui/rb/StateView'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { InvitationRow } from './components/InvitationRow'

// Все созданные приглашения организации: статус, отзыв и повторная отправка
const SettingsInvitationsPage = () => {
  const { organization } = useCurrentOrganization()
  const teamRoles = useTeamRoles(organization.id)
  // Приглашения и участников бэк отдаёт только тем, кто может назначать роли (owner, manager), — до проверки не запрашиваем
  const canView = !!teamRoles.data && teamRoles.data.assignable_roles.length > 0
  const invitations = useTeamInvitations(organization.id, { enabled: canView })
  // Участники нужны для проверки дубля почты и чтобы не предлагать повтор тому, кто уже в команде
  const members = useTeamMembers(organization.id, { enabled: canView })
  const { data: properties } = useAllProperties(organization.id)

  if (teamRoles.isPending) return <StateView state="loading" />
  if (teamRoles.isError) return <StateView state="error" />
  if (!canView) {
    return (
      <StateView
        state="denied"
        denied={{ title: 'Раздел недоступен', description: 'Приглашения в команду создают владелец и управляющий организации.' }}
      />
    )
  }
  if (invitations.isPending || members.isPending) return <StateView state="loading" />
  if (invitations.isError || members.isError) return <StateView state="error" />

  // Бэк отдаёт все статусы по id ASC: действующие поднимаем наверх, остальное — от свежих к старым
  const sorted = [...invitations.data].sort((a, b) => Number(b.status === 'pending') - Number(a.status === 'pending') || b.id - a.id)
  const memberEmails = new Set(members.data.map((member) => member.user.email.trim().toLowerCase()))
  const latestByEmail = new Map<string, number>()
  for (const invitation of sorted) latestByEmail.set(invitation.email, Math.max(latestByEmail.get(invitation.email) ?? 0, invitation.id))

  const inviteButton = (
    <InviteDialog
      organizationId={organization.id}
      teamRoles={teamRoles.data}
      members={members.data}
      properties={properties}
      trigger={
        <Button size="sm" className="shadow-control">
          <UserPlusIcon /> Пригласить
        </Button>
      }
    />
  )

  if (sorted.length === 0) {
    return (
      <StateView
        state="empty"
        empty={{
          title: 'Приглашений пока нет',
          description: 'Создайте приглашение — оно появится здесь со статусом и кнопкой отзыва. Ссылку показываем один раз, при создании.',
          action: inviteButton,
        }}
      />
    )
  }

  return (
    <SectionCard
      title="Созданные приглашения"
      count={sorted.filter((invitation) => invitation.status === 'pending').length || undefined}
      className="shadow-card"
      action={inviteButton}
    >
      <ul className="flex flex-col">
        {sorted.map((invitation) => (
          <InvitationRow
            key={invitation.id}
            invitation={invitation}
            organizationId={organization.id}
            teamRoles={teamRoles.data}
            members={members.data}
            properties={properties}
            canResend={
              (invitation.status === 'expired' || invitation.status === 'revoked') &&
              latestByEmail.get(invitation.email) === invitation.id &&
              !memberEmails.has(invitation.email)
            }
          />
        ))}
      </ul>
    </SectionCard>
  )
}

export default SettingsInvitationsPage
