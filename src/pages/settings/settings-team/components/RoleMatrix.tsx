import { CheckIcon, MinusIcon } from 'lucide-react'
import { Fragment } from 'react'
import { getRoleLabel } from '@/entities/organization'
import { getPermissionLabel, groupPermissions } from '@/entities/team'
import type { TeamRolesResponseDataRolesItem } from '@/shared/api/generated/models'
import { SectionCard } from '@/shared/ui/rb/Section'

// В узкой колонке полное название роли не помещается; оно остаётся в title
const ROLE_SHORT: Record<string, string> = { manager: 'Упр.', administrator: 'Адм.', employee: 'Сотр.' }

// Справка строится из ответа team-roles, а не из констант: что бэк разрешает роли, то и показываем
export const RoleMatrix = ({ roles }: { roles: TeamRolesResponseDataRolesItem[] }) => {
  const groups = groupPermissions(roles.flatMap((item) => item.permissions))

  return (
    <SectionCard title="Что даёт роль" className="shadow-card lg:sticky lg:top-24">
      <table className="w-full text-left">
        <thead>
          <tr className="text-caption text-smoke">
            <th className="pb-2 font-normal">Право</th>
            {roles.map((item) => (
              <th key={item.role} className="pb-2 pl-2 text-center font-normal" title={getRoleLabel(item.role)}>
                {ROLE_SHORT[item.role] ?? getRoleLabel(item.role)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {groups.map((group) => (
            <Fragment key={group.title}>
              <tr>
                <th colSpan={roles.length + 1} className="mono-label pt-4 pb-1 font-normal text-smoke">
                  {group.title}
                </th>
              </tr>
              {group.permissions.map((permission) => (
                <tr key={permission} className="border-t border-foreground/8">
                  <td className="py-2.5 pr-2 text-caption">{getPermissionLabel(permission)}</td>
                  {roles.map((item) => (
                    <td key={item.role} className="py-2.5 pl-2 text-center">
                      {(item.permissions as string[]).includes(permission) ? (
                        <CheckIcon className="mx-auto size-4" aria-label="есть" />
                      ) : (
                        <MinusIcon className="mx-auto size-4 text-smoke" aria-label="нет" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>
      <span className="mt-3 text-caption text-smoke">Владелец может всё. Доступ к объектам назначается каждому участнику отдельно.</span>
    </SectionCard>
  )
}
