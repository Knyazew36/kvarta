import { UserPlusIcon } from 'lucide-react'
import type { Membership, Property, PropertyWork, TeamRolesResponseData } from '@/shared/api/generated/models'
import { SectionCard } from '@/shared/ui/rb/Section'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { InviteDialog } from './InviteDialog'
import { MemberRow } from './MemberRow'

type TeamMembersProps = {
  organizationId: number
  currentUserId: number | undefined
  teamRoles: TeamRolesResponseData
  members: Membership[]
  properties: (Property | PropertyWork)[] | undefined
}

export const TeamMembers = ({ organizationId, currentUserId, teamRoles, members, properties }: TeamMembersProps) => {
  const canInvite = teamRoles.assignable_roles.length > 0

  return (
    <SectionCard
      title="Участники"
      count={members.length}
      className="shadow-card"
      action={
        canInvite && (
          <InviteDialog
            organizationId={organizationId}
            teamRoles={teamRoles}
            members={members}
            properties={properties}
            trigger={
              <Button size="sm" className="shadow-control">
                <UserPlusIcon /> Пригласить
              </Button>
            }
          />
        )
      }
    >
      <ul className="flex flex-col">
        {members.map((member) => (
          <MemberRow
            key={member.id}
            member={member}
            isSelf={member.user.id === currentUserId}
            organizationId={organizationId}
            teamRoles={teamRoles}
            properties={properties}
          />
        ))}
      </ul>
      {members.length === 1 && (
        <p className="mt-2 rounded-3xl bg-background p-4 text-body-sm text-slate">
          Вы работаете один. Пригласите управляющего или сотрудника — задачи можно будет назначать им, а вы увидите отчёты.
        </p>
      )}
    </SectionCard>
  )
}
