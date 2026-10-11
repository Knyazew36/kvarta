import { RefreshCwIcon } from 'lucide-react'
import { useBookingHistory } from '@/entities/booking'
import { useCurrentOrganization } from '@/entities/organization'
import { useTeamMembers } from '@/entities/team'
import type { Booking, CalendarRevision } from '@/shared/api/generated/models'
import { formatDate, formatMoney, formatRange } from '@/shared/lib/format'
import { type HistoryEntry, HistoryFeed } from '@/shared/ui/rb/HistoryFeed'
import { SectionCard } from '@/shared/ui/rb/Section'
import { StateView } from '@/shared/ui/rb/StateView'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

const EMPTY = 'не указано'

// Что изменилось между двумя соседними снимками брони
const describeChanges = (prev: Booking, next: Booking): string[] => {
  const changes: string[] = []
  const add = (label: string, from: string, to: string) => from !== to && changes.push(`${label}: ${from} → ${to}`)

  add('Даты', formatRange(prev.start_date, prev.end_date), formatRange(next.start_date, next.end_date))
  add('Гость', prev.guest_name, next.guest_name)
  add('Гостей', String(prev.guests_count), String(next.guests_count))
  add('Телефон', prev.guest_phone ?? EMPTY, next.guest_phone ?? EMPTY)
  add('Почта', prev.guest_email ?? EMPTY, next.guest_email ?? EMPTY)
  add('Сумма', formatMoney(prev.total_amount_minor / 100), formatMoney(next.total_amount_minor / 100))
  // Заметки бывают длинными — сам текст виден на вкладке «Гость и условия»
  if ((prev.notes ?? '') !== (next.notes ?? '')) changes.push('Заметки изменены')

  return changes
}

const describeRevision = (revision: CalendarRevision, prev: CalendarRevision | undefined): React.ReactNode => {
  if (revision.action === 'created') return 'Бронь создана'
  if (revision.action === 'cancelled' || revision.action === 'released') return 'Бронь отменена'

  // У ручки броней снимки всегда брони; блокировки в общий тип попали из календаря
  const changes = prev ? describeChanges(prev.snapshot as Booking, revision.snapshot as Booking) : []
  if (changes.length === 0) return 'Бронь изменена'

  return (
    <span className="flex flex-col gap-0.5">
      {changes.map((change) => (
        <span key={change}>{change}</span>
      ))}
    </span>
  )
}

export const BookingHistoryTab = ({ booking }: { booking: Booking }) => {
  const { role } = useCurrentOrganization()
  const { data: revisions, isPending, isError, refetch, isRefetching } = useBookingHistory(booking.organization_id, booking.id)
  // actor_id — id пользователя. Имена есть в списке участников, а он открыт только владельцу и управляющему (остальным 403)
  const canSeeTeam = role === 'owner' || role === 'manager'
  const { data: members } = useTeamMembers(booking.organization_id, { enabled: canSeeTeam })

  if (isPending) return <StateView state="loading" />

  if (isError) {
    return (
      <StateView
        state="error"
        error={{
          title: 'История не загрузилась',
          description: 'Проверьте соединение и повторите попытку.',
          action: (
            <Button variant="outline" size="sm" disabled={isRefetching} onClick={() => refetch()}>
              <RefreshCwIcon /> Повторить
            </Button>
          ),
        }}
      />
    )
  }

  const names = new Map(members?.map((member) => [member.user.id, member.user.name]))

  const entries: HistoryEntry[] = revisions
    .map((revision, index) => {
      const name = revision.actor_id === null ? undefined : names.get(revision.actor_id)
      return {
        id: String(revision.version),
        // created_at приходит в UTC — показываем во времени браузера
        at: formatDate(revision.created_at, 'd MMM yyyy, HH:mm'),
        author: name ?? (revision.actor_id === null ? 'Rentybot' : `Участник #${revision.actor_id}`),
        staff: !!name,
        system: revision.actor_id === null,
        text: describeRevision(revision, revisions[index - 1]),
        reason: revision.reason ?? undefined,
      }
    })
    // Бэк отдаёт version ASC; в ленте свежее сверху
    .reverse()

  return (
    <SectionCard title="История" count={entries.length}>
      <HistoryFeed entries={entries} />
    </SectionCard>
  )
}
