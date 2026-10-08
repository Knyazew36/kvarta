import type { DemoRole } from '@/shared/mock/state'
import type { Org, Person } from './types'

export const ORGS: Org[] = [
  { id: 'org-volna', name: 'Волна', role: 'owner', propertiesCount: 4, city: 'Санкт-Петербург' },
  { id: 'org-sever', name: 'Север Апартаменты', role: 'manager', propertiesCount: 12, city: 'Мурманск' },
  { id: 'org-kim', name: 'Квартиры Кима', role: 'employee', propertiesCount: 2, city: 'Санкт-Петербург' },
]

export const PEOPLE: Person[] = [
  { id: 'u-anna', name: 'Анна Волкова', role: 'owner', position: 'Владелец' },
  { id: 'u-igor', name: 'Игорь Петров', role: 'manager', position: 'Управляющий' },
  { id: 'u-marina', name: 'Марина Соколова', role: 'employee', position: 'Уборка' },
  { id: 'u-oleg', name: 'Олег Ким', role: 'employee', position: 'Техник' },
]

export const personById = (id: string) => PEOPLE.find((person) => person.id === id) ?? PEOPLE[0]

// Текущий пользователь макета определяется демо-ролью
export const CURRENT_USER: Record<DemoRole, Person> = {
  owner: PEOPLE[0],
  manager: PEOPLE[1],
  employee: PEOPLE[2],
}

export const ROLE_LABEL: Record<DemoRole, string> = {
  owner: 'Владелец',
  manager: 'Управляющий',
  employee: 'Сотрудник',
}
