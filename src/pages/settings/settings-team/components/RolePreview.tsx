import { CheckIcon } from 'lucide-react'
import { getPermissionLabel, groupPermissions } from '@/entities/team'
import { pluralize } from '@/shared/lib/format'

type RolePreviewProps = {
  // Права выбранной роли из team-roles; undefined — роль не выбрана или бэк её не описал
  permissions: string[] | undefined
  propertyCount: number
}

// Предпросмотр считается из прав роли — то, что человек сможет на самом деле, а не название роли (§4.7)
export const RolePreview = ({ permissions, propertyCount }: RolePreviewProps) => (
  <aside className="flex flex-col gap-3 self-start rounded-3xl bg-mist p-4 md:sticky md:top-0">
    <span className="mono-label text-smoke">Что будет видно</span>
    <ul className="flex flex-col gap-2">
      {groupPermissions(permissions ?? [])
        .flatMap((group) => group.permissions)
        .map((permission) => (
          <li key={permission} className="flex items-start gap-2 text-caption">
            <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
              <CheckIcon className="size-2.5" aria-hidden />
            </span>
            {getPermissionLabel(permission)}
          </li>
        ))}
    </ul>
    <span className="text-caption text-smoke">
      {propertyCount === 0 ? 'Объекты не выбраны — только личные задачи' : `Доступ к ${pluralize(propertyCount, ['объекту', 'объектам', 'объектам'])}`}
    </span>
  </aside>
)
