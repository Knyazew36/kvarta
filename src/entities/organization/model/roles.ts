// Роли членства из бэка (OrganizationMembership.role)
const ROLE_LABEL: Record<string, string> = {
  owner: 'Владелец',
  manager: 'Управляющий',
  administrator: 'Администратор',
  employee: 'Сотрудник',
}

// Незнакомую роль показываем как есть: бэк может добавить новую раньше фронта
export const getRoleLabel = (role: string): string => ROLE_LABEL[role] ?? role
