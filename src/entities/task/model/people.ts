import { useCurrentUser } from '@/entities/auth'
import { isEmployee, useCurrentOrganization } from '@/entities/organization'

import { useTaskParticipants } from '../api/task.queries'

// В задаче люди приходят только идентификаторами: автор — id пользователя, исполнитель и проверяющий — id членства.
// Имена есть в task-participants, а он открыт только руководящим ролям: сотрудник видит по имени лишь себя
export const useTaskPeople = () => {
  const { organization, role } = useCurrentOrganization()
  const { data: me } = useCurrentUser()
  const canSeeNames = !isEmployee(role)
  const { data: participants } = useTaskParticipants(organization.id, undefined, { enabled: canSeeNames })

  const myMembershipId = organization.membership.id
  const myUserId = me?.id

  const memberName = (membershipId: number): string => {
    const participant = participants?.find((item) => item.membership_id === membershipId)
    if (participant) return participant.name
    if (membershipId === myMembershipId) return me?.name ?? 'Вы'
    return `Участник #${membershipId}`
  }

  const userName = (userId: number): string => {
    const participant = participants?.find((item) => item.user_id === userId)
    if (participant) return participant.name
    if (userId === myUserId) return me?.name ?? 'Вы'
    return `Пользователь #${userId}`
  }

  return { myMembershipId, myUserId, canSeeNames, participants, memberName, userName }
}
