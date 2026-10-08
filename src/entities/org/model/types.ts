import type { DemoRole } from '@/shared/mock/state'

export type Org = {
  id: string
  name: string
  role: DemoRole
  propertiesCount: number
  city: string
}

export type Person = {
  id: string
  name: string
  role: DemoRole
  // Специализация сотрудника: уборка, техник — подпись в списках исполнителей
  position: string
  phone?: string
}
