import { SlidersHorizontalIcon, UserMinusIcon } from 'lucide-react'
import { getRoleLabel } from '@/entities/organization'
import type { Membership, Property, PropertyWork, TeamRolesResponseData } from '@/shared/api/generated/models'
import { PersonAvatar } from '@/shared/ui/rb/PersonAvatar'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { MemberAccessDialog } from './MemberAccessDialog'
import { RevokeAccessDialog } from './RevokeAccessDialog'

const Chip = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex h-6 items-center rounded-full bg-background px-2 text-caption">{children}</span>
)

type MemberRowProps = {
  member: Membership
  isSelf: boolean
  organizationId: number
  teamRoles: TeamRolesResponseData
  properties: (Property | PropertyWork)[] | undefined
}

export const MemberRow = ({ member, isSelf, organizationId, teamRoles, properties }: MemberRowProps) => {
  const name = member.user.name.trim() || member.user.email
  // Управлять можно только теми, чью роль текущий пользователь вправе назначать: владельца и равных бэк менять не даёт
  const canManage = !isSelf && (teamRoles.assignable_roles as string[]).includes(member.role)
  const known = properties?.filter((property) => member.property_ids.includes(property.id)) ?? []
  // Архивные объекты и объекты вне доступа текущего пользователя: названий нет, показываем числом
  const hiddenCount = properties ? member.property_ids.length - known.length : 0

  return (
    <li className="grid gap-4 border-t border-foreground/8 py-4 first:border-t-0 md:grid-cols-[1.3fr_1fr_auto] md:items-center">
      <span className="flex min-w-0 items-center gap-3">
        <PersonAvatar name={name} tone={isSelf ? 'accent' : 'default'} />
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-body-sm font-medium">{name}</span>
          <span className="truncate text-caption text-smoke">
            {getRoleLabel(member.role)} · {member.user.email}
          </span>
        </span>
      </span>
      <span className="flex flex-wrap gap-1">
        {member.role === 'owner' ? (
          // Владелец видит все объекты независимо от списка назначений
          <Chip>Все объекты</Chip>
        ) : member.property_ids.length === 0 ? (
          <span className="text-caption text-smoke">Без объектов</span>
        ) : (
          <>
            {known.map((property) => (
              <Chip key={property.id}>{property.name}</Chip>
            ))}
            {!properties && <Chip>Объектов: {member.property_ids.length}</Chip>}
            {hiddenCount > 0 && <Chip>+{hiddenCount} вне вашего доступа</Chip>}
          </>
        )}
      </span>
      {isSelf ? (
        <span className="text-caption text-smoke md:text-right">это вы</span>
      ) : canManage ? (
        <span className="flex gap-1 md:justify-end">
          <MemberAccessDialog
            organizationId={organizationId}
            member={member}
            teamRoles={teamRoles}
            properties={properties}
            trigger={
              <Button variant="outline" size="sm" className="bg-canvas">
                <SlidersHorizontalIcon /> Доступ
              </Button>
            }
          />
          <RevokeAccessDialog
            organizationId={organizationId}
            member={member}
            trigger={
              <Button variant="ghost" size="icon-sm" aria-label={`Отозвать доступ: ${name}`}>
                <UserMinusIcon />
              </Button>
            }
          />
        </span>
      ) : (
        <span />
      )}
    </li>
  )
}
