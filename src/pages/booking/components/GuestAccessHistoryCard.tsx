import { useGuestAccessHistory } from '@/entities/guest-access'
import { toInstructionHistory } from '@/entities/instruction'
import { useCurrentOrganization } from '@/entities/organization'
import { useTeamMembers } from '@/entities/team'
import type { InstructionMetadata } from '@/shared/api/generated/models'
import { ErrorText } from '@/shared/ui/rb/ErrorText'
import { HistoryFeed } from '@/shared/ui/rb/HistoryFeed'
import { SectionCard } from '@/shared/ui/rb/Section'
import { StateView } from '@/shared/ui/rb/StateView'

type GuestAccessHistoryCardProps = {
  organizationId: number
  bookingId: number
  instructions: InstructionMetadata[] | undefined
}

// Приглашения, подтверждения, оплата, открытия и получения. Открытие и получение не означают, что гость заехал
export const GuestAccessHistoryCard = ({ organizationId, bookingId, instructions }: GuestAccessHistoryCardProps) => {
  const { role } = useCurrentOrganization()
  const { data: events, isPending, isError } = useGuestAccessHistory(organizationId, bookingId)
  // actor_id — id пользователя. Имена есть в списке участников, а он открыт только владельцу и управляющему (остальным 403)
  const canSeeTeam = role === 'owner' || role === 'manager'
  const { data: members } = useTeamMembers(organizationId, { enabled: canSeeTeam })

  const names = new Map(members?.map((member) => [member.user.id, member.user.name]))
  const titles = new Map(instructions?.map((instruction) => [instruction.id, instruction.title]))

  return (
    <SectionCard title="История доступа" count={events?.length || undefined} className="shadow-card">
      {isPending ? (
        <StateView state="loading" />
      ) : isError ? (
        <ErrorText>История не загрузилась. Обновите страницу.</ErrorText>
      ) : events.length === 0 ? (
        <span className="text-body-sm text-slate">Событий пока нет: гостя на эту бронь ещё не приглашали.</span>
      ) : (
        <HistoryFeed entries={toInstructionHistory(events, { names, titles })} />
      )}
    </SectionCard>
  )
}
