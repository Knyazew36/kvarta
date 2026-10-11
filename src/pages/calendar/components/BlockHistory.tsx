import { useCalendarBlockHistory } from '@/entities/calendar'
import { useCurrentOrganization } from '@/entities/organization'
import { useTeamMembers } from '@/entities/team'
import type { CalendarBlock, CalendarRevision } from '@/shared/api/generated/models'
import { formatDate, formatRange } from '@/shared/lib/format'
import { type HistoryEntry, HistoryFeed } from '@/shared/ui/rb/HistoryFeed'
import { Skeleton } from '@/shared/ui/shadcn/skeleton'

const describeRevision = (revision: CalendarRevision, prev: CalendarRevision | undefined): React.ReactNode => {
  if (revision.action === 'created') return 'Даты закрыты'
  if (revision.action === 'released' || revision.action === 'cancelled') return 'Блокировка снята'
  if (!prev) return 'Блокировка изменена'

  // У ручки блокировок снимки всегда блокировки; брони в общий тип попали из календаря
  const before = prev.snapshot as CalendarBlock
  const after = revision.snapshot as CalendarBlock
  const changes: string[] = []
  const beforeDates = formatRange(before.start_date, before.end_date)
  const afterDates = formatRange(after.start_date, after.end_date)
  if (beforeDates !== afterDates) changes.push(`Даты: ${beforeDates} → ${afterDates}`)
  if (before.reason !== after.reason) changes.push(`Причина: ${before.reason} → ${after.reason}`)
  if (changes.length === 0) return 'Блокировка изменена'

  return (
    <span className="flex flex-col gap-0.5">
      {changes.map((change) => (
        <span key={change}>{change}</span>
      ))}
    </span>
  )
}

export const BlockHistory = ({ block }: { block: CalendarBlock }) => {
  const { role } = useCurrentOrganization()
  const { data: revisions, isPending, isError } = useCalendarBlockHistory(block.organization_id, block.id)
  // actor_id — id пользователя. Имена есть в списке участников, а он открыт только владельцу и управляющему (остальным 403)
  const canSeeTeam = role === 'owner' || role === 'manager'
  const { data: members } = useTeamMembers(block.organization_id, { enabled: canSeeTeam })

  const names = new Map(members?.map((member) => [member.user.id, member.user.name]))
  const entries: HistoryEntry[] = (revisions ?? [])
    .map((revision, index) => {
      const name = revision.actor_id === null ? undefined : names.get(revision.actor_id)
      return {
        id: String(revision.version),
        // created_at приходит в UTC — показываем во времени браузера
        at: formatDate(revision.created_at, 'd MMM yyyy, HH:mm'),
        author: name ?? (revision.actor_id === null ? 'Rentybot' : `Участник #${revision.actor_id}`),
        staff: !!name,
        system: revision.actor_id === null,
        text: describeRevision(revision, revisions?.[index - 1]),
        reason: revision.reason ?? undefined,
      }
    })
    // Бэк отдаёт version ASC; в ленте свежее сверху
    .reverse()

  return (
    <section className="flex flex-col gap-4">
      <h3 className="text-body font-medium">История</h3>
      {isPending && <Skeleton className="h-16 w-full" />}
      {isError && <p className="text-body-sm text-slate">История не загрузилась. Закройте карточку и откройте её снова.</p>}
      {revisions && <HistoryFeed entries={entries} />}
    </section>
  )
}
