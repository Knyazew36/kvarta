import { DoorOpenIcon, KeyRoundIcon, type LucideIcon, MapPinIcon, ScrollTextIcon, WifiIcon } from 'lucide-react'

import type { InstructionMetadataType } from '@/shared/api/generated/models'

export type InstructionTypeMeta = {
  type: InstructionMetadataType
  // Подпись слота и название по умолчанию для новой инструкции
  label: string
  icon: LucideIcon
  hint: string
  // Wi-Fi и доступ бэк всегда держит чувствительными: sensitive=false для них — 422
  forcedSensitive: boolean
}

// Один тип — одна инструкция на объект, всего пять. Порядок — путь гостя: добраться, войти, жить, уехать
export const INSTRUCTION_TYPES: InstructionTypeMeta[] = [
  { type: 'route', label: 'Как добраться', icon: MapPinIcon, hint: 'Дорога от метро, вход, подъезд, этаж', forcedSensitive: false },
  { type: 'access', label: 'Доступ в квартиру', icon: KeyRoundIcon, hint: 'Ключница, домофон, коды', forcedSensitive: true },
  { type: 'wifi', label: 'Wi-Fi', icon: WifiIcon, hint: 'Сеть и пароль', forcedSensitive: true },
  { type: 'rules', label: 'Правила дома', icon: ScrollTextIcon, hint: 'Тишина, курение, животные', forcedSensitive: false },
  { type: 'checkout', label: 'Выезд', icon: DoorOpenIcon, hint: 'Что сделать перед отъездом', forcedSensitive: false },
]

const TYPE_META = Object.fromEntries(INSTRUCTION_TYPES.map((meta) => [meta.type, meta])) as Record<InstructionMetadataType, InstructionTypeMeta>

export const getInstructionTypeMeta = (type: InstructionMetadataType): InstructionTypeMeta => TYPE_META[type]

// Порядок показа: бэк отдаёт по id, то есть в порядке создания
export const sortByInstructionType = <T extends { type: InstructionMetadataType }>(items: T[]): T[] => {
  const order = INSTRUCTION_TYPES.map((meta) => meta.type)
  return [...items].sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type))
}
