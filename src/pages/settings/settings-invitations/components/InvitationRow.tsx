import { RotateCwIcon } from 'lucide-react'
import { getRoleLabel } from '@/entities/organization'
import { INVITATION_STATUS_META, useRevokeInvitation } from '@/entities/team'
import type { Membership, Property, PropertyWork, TeamInvitation, TeamRolesResponseData } from '@/shared/api/generated/models'
import { formatDate, pluralize } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { InviteDialog } from '@/pages/settings/settings-team/components/InviteDialog'
import { PersonAvatar } from '@/shared/ui/rb/PersonAvatar'
import { StatusFromMeta } from '@/shared/ui/rb/StatusBadge'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Spinner } from '@/shared/ui/shadcn/spinner'

const DATE_PATTERN = 'd MMM, HH:mm'

// Даты отправки бэк не отдаёт — показываем срок или момент, когда приглашение перестало действовать
const getNote = (invitation: TeamInvitation): string => {
  if (invitation.accepted_at) return `принято ${formatDate(invitation.accepted_at, DATE_PATTERN)}`
  if (invitation.revoked_at) return `отозвано ${formatDate(invitation.revoked_at, DATE_PATTERN)}`
  return `${invitation.status === 'expired' ? 'истекло' : 'действует до'} ${formatDate(invitation.expires_at, DATE_PATTERN)}`
}

type InvitationRowProps = {
  invitation: TeamInvitation
  organizationId: number
  teamRoles: TeamRolesResponseData
  members: Membership[]
  properties: (Property | PropertyWork)[] | undefined
  // Повтор предлагаем только у последней записи email, если он не в команде и действующего приглашения нет
  canResend: boolean
}

export const InvitationRow = ({ invitation, organizationId, teamRoles, members, properties, canResend }: InvitationRowProps) => {
  const revokeInvitation = useRevokeInvitation(organizationId)
  const canManage = (teamRoles.assignable_roles as string[]).includes(invitation.role)
  const closed = invitation.status !== 'pending'
  const objects =
    invitation.property_ids.length === 0 ? 'без объектов' : pluralize(invitation.property_ids.length, ['объект', 'объекта', 'объектов'])

  return (
    <li className={cn('flex flex-col gap-3 border-t border-foreground/8 py-4 first:border-t-0 sm:flex-row sm:items-center sm:justify-between', closed && 'text-slate')}>
      <span className="flex min-w-0 items-center gap-3">
        <PersonAvatar name={invitation.email} />
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-body-sm font-medium">{invitation.email}</span>
          <span className="text-caption text-smoke">
            {getRoleLabel(invitation.role)} · {objects} · {getNote(invitation)}
          </span>
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-2 self-end sm:self-auto">
        <StatusFromMeta meta={INVITATION_STATUS_META[invitation.status]} size="sm" />
        {canManage && invitation.status === 'pending' && (
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            disabled={revokeInvitation.isPending}
            onClick={() => revokeInvitation.mutate(invitation.id)}
          >
            {revokeInvitation.isPending && <Spinner />} Отозвать
          </Button>
        )}
        {canManage && canResend && (
          <InviteDialog
            organizationId={organizationId}
            teamRoles={teamRoles}
            members={members}
            properties={properties}
            preset={{ email: invitation.email, role: invitation.role, property_ids: invitation.property_ids }}
            trigger={
              <Button variant="ghost" size="sm">
                <RotateCwIcon /> Отправить заново
              </Button>
            }
          />
        )}
      </span>
    </li>
  )
}
