import { useState } from 'react'
import { SirenIcon } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { MOCK_BORDER } from '@/shared/mock/mock-border'
import type { DemoRole } from '@/shared/mock/state'
import { SectionCard } from '@/shared/ui/rb/Section'
import { StatusBadge } from '@/shared/ui/rb/StatusBadge'
import { useMockProfile } from '../../model/profile'
import { SwitchRow } from './SwitchRow'

// ── Макетные данные: типы уведомлений (NTF-02) ──────────────────────────────

type NotificationType = { id: string; label: string; hint: string; on: boolean; urgent?: boolean; roles?: DemoRole[] }
type NotificationGroup = { id: string; title: string; roles: DemoRole[]; items: NotificationType[] }

const ALL: DemoRole[] = ['owner', 'manager', 'employee']
const TEAM: DemoRole[] = ['owner', 'manager']

// Сотруднику не показываем деньги и площадки: его план не содержит финансов и чужих задач (NTF)
const GROUPS: NotificationGroup[] = [
  {
    id: 'bookings',
    title: 'Брони',
    roles: TEAM,
    items: [
      { id: 'booking-new', label: 'Новая бронь или заявка', hint: 'С площадок и со страницы прямого бронирования', on: true },
      { id: 'booking-conflict', label: 'Пересечение дат', hint: 'Две записи на один объект', on: true, urgent: true },
      { id: 'booking-cancel', label: 'Отмена или изменение дат', hint: 'Гость или площадка изменили бронь', on: true },
    ],
  },
  {
    id: 'money',
    title: 'Деньги',
    roles: TEAM,
    items: [
      { id: 'money-claimed', label: 'Гость сообщил о переводе', hint: 'Нужно проверить поступление и подтвердить', on: true, urgent: true },
      { id: 'money-hold', label: 'Удержание скоро истечёт', hint: 'За 2 часа до крайнего срока оплаты', on: true },
    ],
  },
  {
    id: 'tasks',
    title: 'Задачи',
    roles: ALL,
    items: [
      { id: 'task-assigned', label: 'Мне назначена задача', hint: 'С объектом, сроком и чек-листом', on: true },
      { id: 'task-due', label: 'Напоминание о сроке', hint: 'По правилам повторов ниже', on: true },
      { id: 'task-returned', label: 'Задачу вернули на доработку', hint: 'С комментарием и новым сроком', on: true, roles: ['employee'] },
      { id: 'task-review', label: 'Задача ждёт приёмки', hint: 'Исполнитель отметил выполнение', on: true, roles: TEAM },
      { id: 'task-help', label: 'Сотрудник просит помощи', hint: 'Из карточки задачи', on: true, urgent: true, roles: TEAM },
    ],
  },
  {
    id: 'prep',
    title: 'Подготовка',
    roles: TEAM,
    items: [{ id: 'prep-late', label: 'Объект не готов к заезду', hint: 'За 3 часа до заезда уборка не принята', on: true, urgent: true }],
  },
  {
    id: 'channels',
    title: 'Площадки',
    roles: TEAM,
    items: [{ id: 'channel-error', label: 'Сбой обмена с площадкой', hint: 'Авито или Суточно перестали отдавать брони', on: true, urgent: true }],
  },
]

export const UrgentMark = () => (
  <StatusBadge tone="neutral" size="sm" icon={SirenIcon}>
    Срочное
  </StatusBadge>
)

// Мок: бэк включает и выключает только группы целиком, отдельных типов в API нет
export const NotificationTypes = () => {
  const { profile, role } = useMockProfile()
  const groups = GROUPS.filter((group) => group.roles.includes(role)).map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.roles || item.roles.includes(role)),
  }))
  const [enabled, setEnabled] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(groups.flatMap((group) => group.items.map((item) => [item.id, item.on]))),
  )

  return (
    <SectionCard title="Что присылать" className={cn('shadow-card', MOCK_BORDER)}>
      {profile.max !== 'linked' && (
        <p className="mb-3 rounded-3xl bg-mist p-4 text-body-sm text-slate">
          Пока MAX {profile.max === 'none' ? 'не подключён' : 'не доставляет'}, выбранные уведомления копятся в кабинете — в колокольчике в шапке.
        </p>
      )}
      <div className="flex flex-col gap-5">
        {groups.map((group) => (
          <fieldset key={group.id} className="flex flex-col gap-1">
            <legend className="mono-label mb-1 px-3 text-smoke">{group.title}</legend>
            {group.items.map((item) => (
              <SwitchRow
                key={item.id}
                id={`ntf-${item.id}`}
                title={item.label}
                hint={item.hint}
                badge={item.urgent ? <UrgentMark /> : undefined}
                checked={enabled[item.id] ?? false}
                onCheckedChange={(value) => setEnabled({ ...enabled, [item.id]: value })}
                className="-mx-3"
              />
            ))}
          </fieldset>
        ))}
      </div>
    </SectionCard>
  )
}
