import { DEMO_TZ } from '@/shared/lib/format'
import { DEMO_USERS, type DemoRole, useDemoState } from '@/shared/mock/state'
import type { MaxStatus } from '@/shared/ui/rb/status-presets'

// ── Макетные данные страниц-вкладок: шапка профиля (LayoutProfile) уже на API ──────────────────────────

export type ProfileBrief = {
  id: string
  firstName: string
  lastName: string
  // Как подписан человек в задачах и в переписке с гостем
  displayName: string
  roleLabel: string
  phone: string
  email: string | null
  maxAccount: string | null
  max: MaxStatus
  maxLastDelivery: string | null
  lastLogin: string
  since: string
  isNew: boolean
}

// Имя и роль — из того же мока, что и меню профиля в шапке: иначе они разойдутся
const nameOf = (role: DemoRole) => {
  const [firstName = '', lastName = ''] = DEMO_USERS[role].name.split(' ')
  return { firstName, lastName }
}

const PROFILES: Record<DemoRole, ProfileBrief> = {
  owner: {
    id: 'u-1042',
    ...nameOf('owner'),
    displayName: 'Анна',
    roleLabel: DEMO_USERS.owner.role,
    phone: '+7 921 ••• •• 47',
    email: 'a•••@yandex.ru',
    maxAccount: '@anna_volkova',
    max: 'linked',
    maxLastDelivery: `8 окт, 09:31 ${DEMO_TZ}`,
    lastLogin: `8 окт, 09:12 ${DEMO_TZ}`,
    since: 'сентябрь 2026',
    isNew: false,
  },
  manager: {
    id: 'u-1077',
    ...nameOf('manager'),
    displayName: 'Игорь П.',
    roleLabel: DEMO_USERS.manager.role,
    phone: '+7 911 ••• •• 03',
    email: null,
    maxAccount: null,
    max: 'none',
    maxLastDelivery: null,
    lastLogin: `8 окт, 08:50 ${DEMO_TZ}`,
    since: 'сентябрь 2026',
    isNew: false,
  },
  // У сотрудника MAX — основной канал задач, поэтому на нём показан сбой доставки
  employee: {
    id: 'u-1103',
    ...nameOf('employee'),
    displayName: 'Марина С.',
    roleLabel: DEMO_USERS.employee.role,
    phone: '+7 952 ••• •• 18',
    email: null,
    maxAccount: '@marina_s',
    max: 'failed',
    maxLastDelivery: `7 окт, 18:02 ${DEMO_TZ}`,
    lastLogin: `8 окт, 07:40 ${DEMO_TZ}`,
    since: 'октябрь 2026',
    isNew: false,
  },
}

// ?state=empty — человек только что вошёл по приглашению: имени нет, MAX не подключён
const NEWCOMER: ProfileBrief = {
  id: 'u-1180',
  firstName: '',
  lastName: '',
  displayName: '',
  roleLabel: DEMO_USERS.employee.role,
  phone: '+7 999 ••• •• 61',
  email: null,
  maxAccount: null,
  max: 'none',
  maxLastDelivery: null,
  lastLogin: `8 окт, 09:38 ${DEMO_TZ}`,
  since: 'сегодня',
  isNew: true,
}

// Вкладки пока на моках: профиль и роль берут из демо-состояния, а не из шапки
export const useMockProfile = () => {
  const { state, role } = useDemoState()
  return { profile: state === 'empty' ? NEWCOMER : PROFILES[role], role }
}
