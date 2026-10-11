// Права приходят с бэка строками (team-roles, предпросмотр приглашения). Тип — string, а не enum из свагера:
// бэк уже отдаёт права, которых в контракте нет (instructions.*, guest_access.manage), и может добавить новые раньше фронта
const PERMISSION_GROUPS: { title: string; permissions: Record<string, string> }[] = [
  {
    title: 'Организация и команда',
    permissions: {
      'organization.rename': 'Переименовывать организацию',
      'team.view': 'Видеть команду и приглашения',
      'team.manage_managers': 'Приглашать и менять управляющих',
      'team.manage_administrators_and_employees': 'Приглашать и менять администраторов и сотрудников',
      'team.assign_properties': 'Назначать объекты участникам',
    },
  },
  {
    title: 'Объекты',
    permissions: {
      'properties.view': 'Видеть назначенные объекты',
      'properties.edit': 'Править сведения объектов',
      'properties.create': 'Создавать объекты',
      'properties.archive': 'Архивировать объекты',
    },
  },
  {
    title: 'Брони и календарь',
    permissions: {
      'bookings.view': 'Видеть брони',
      'bookings.manage': 'Создавать и менять брони',
      'calendar.view': 'Видеть календарь',
      'calendar_blocks.manage': 'Закрывать даты в календаре',
    },
  },
  {
    title: 'Инструкции и гости',
    permissions: {
      'instructions.view_metadata': 'Видеть список инструкций',
      'instructions.view_content': 'Читать инструкции',
      'instructions.manage': 'Править инструкции',
      'guest_access.manage': 'Выдавать доступ гостям',
    },
  },
  {
    title: 'Задачи',
    permissions: {
      'tasks.personal': 'Вести личные задачи',
      'tasks.execute_assigned': 'Выполнять назначенные задачи',
      'tasks.team': 'Видеть задачи команды и принимать работу',
    },
  },
]

// Есть у любого участника: ролей не различают, в матрице и предпросмотре только шум
const COMMON_PERMISSIONS = new Set(['organization.view', 'organization.select'])

const PERMISSION_LABEL: Record<string, string> = Object.assign({}, ...PERMISSION_GROUPS.map((group) => group.permissions))

// Незнакомое право показываем как есть: бэк может добавить новое раньше фронта
export const getPermissionLabel = (permission: string): string => PERMISSION_LABEL[permission] ?? permission

export type PermissionGroup = { title: string; permissions: string[] }

// Права по разделам в порядке словаря; незнакомые — отдельной группой в конце
export const groupPermissions = (permissions: string[]): PermissionGroup[] => {
  const visible = [...new Set(permissions)].filter((permission) => !COMMON_PERMISSIONS.has(permission))
  const groups = PERMISSION_GROUPS.map((group) => ({
    title: group.title,
    permissions: Object.keys(group.permissions).filter((permission) => visible.includes(permission)),
  }))
  const unknown = visible.filter((permission) => !(permission in PERMISSION_LABEL))

  return [...groups, { title: 'Другое', permissions: unknown }].filter((group) => group.permissions.length > 0)
}

// Известные права, которых в списке нет, — для блока «Не увидите» в приглашении
export const getMissingPermissions = (permissions: string[]): string[] =>
  Object.keys(PERMISSION_LABEL).filter((permission) => !permissions.includes(permission))
