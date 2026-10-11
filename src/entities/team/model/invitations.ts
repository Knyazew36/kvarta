import { BanIcon, CircleCheckIcon, ClockIcon, XCircleIcon } from 'lucide-react'

import type { TeamInvitationStatus } from '@/shared/api/generated/models'
import { ROUTES } from '@/shared/config/paths'
import type { StatusMeta } from '@/shared/ui/rb/StatusBadge'

export const INVITATION_STATUS_META: Record<TeamInvitationStatus, StatusMeta> = {
  pending: { tone: 'neutral', icon: ClockIcon, label: 'Ждёт ответа' },
  accepted: { tone: 'success', icon: CircleCheckIcon, label: 'Принято' },
  revoked: { tone: 'neutral', icon: BanIcon, label: 'Отозвано' },
  expired: { tone: 'neutral', icon: XCircleIcon, label: 'Истекло' },
}

// Доставки на бэке нет: ссылку собираем сами и передаём человеку вручную. Токен приходит только в ответе создания
export const getInvitationLink = (token: string): string => `${window.location.origin}${ROUTES.INVITE.replace(':token', token)}`
