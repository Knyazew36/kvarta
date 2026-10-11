import { BanIcon, CircleCheckIcon, ClockIcon, HourglassIcon, XCircleIcon } from 'lucide-react'

import type { GuestBooking, GuestGrantStatus, GuestInvitation } from '@/shared/api/generated/models'
import { ROUTES } from '@/shared/config/paths'
import type { StatusMeta } from '@/shared/ui/rb/StatusBadge'

// ── Приглашение ─────────────────────────────────────────────────────────────

export type GuestInvitationStatus = 'pending' | 'accepted' | 'revoked' | 'expired'

// Статуса в ответе нет: бэк отдаёт отметки времени, срок считает клиент по expires_at
export const getGuestInvitationStatus = (invitation: GuestInvitation, now = new Date()): GuestInvitationStatus => {
  if (invitation.accepted_at) return 'accepted'
  if (invitation.revoked_at) return 'revoked'
  return new Date(invitation.expires_at) <= now ? 'expired' : 'pending'
}

export const GUEST_INVITATION_STATUS_META: Record<GuestInvitationStatus, StatusMeta> = {
  pending: { tone: 'neutral', icon: ClockIcon, label: 'Ждёт гостя' },
  accepted: { tone: 'success', icon: CircleCheckIcon, label: 'Принято' },
  revoked: { tone: 'neutral', icon: BanIcon, label: 'Отозвано' },
  expired: { tone: 'neutral', icon: XCircleIcon, label: 'Истекло' },
}

// Доставки на бэке нет: ссылку собираем сами и передаём гостю вручную. Токен приходит только в ответе создания
export const getGuestInvitationLink = (token: string): string => `${window.location.origin}${ROUTES.GUEST_INVITATION.replace(':token', token)}`

// ── Привязка гостя ──────────────────────────────────────────────────────────

export const GUEST_GRANT_STATUS_META: Record<GuestGrantStatus, StatusMeta> = {
  pending: { tone: 'attention', icon: HourglassIcon, label: 'Ждёт подтверждения' },
  active: { tone: 'success', icon: CircleCheckIcon, label: 'Подтверждён' },
  revoked: { tone: 'neutral', icon: BanIcon, label: 'Отозван' },
}

// ── Бронь гостя ─────────────────────────────────────────────────────────────

// Момент в часовом поясе брони → UTC. Даты и времена брони — снимок на момент создания, пояс — IANA
const toInstant = (date: string, time: string, timezone: string): Date => {
  const [year, month, day] = date.slice(0, 10).split('-').map(Number)
  const [hour, minute] = time.split(':').map(Number)
  const wall = Date.UTC(year, month - 1, day, hour, minute)
  const offsetAt = (instant: number) => {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).formatToParts(new Date(instant))
    const get = (type: string) => Number(parts.find((part) => part.type === type)?.value)
    return Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute')) - Math.floor(instant / 60_000) * 60_000
  }
  // Второй проход нужен у границы перевода часов: смещение считается уже для найденного момента
  const guess = wall - offsetAt(wall)
  return new Date(wall - offsetAt(guess))
}

export const getGuestCheckIn = (booking: GuestBooking): Date => toInstant(booking.start_date, booking.check_in_time, booking.timezone)

export const getGuestCheckOut = (booking: GuestBooking): Date => toInstant(booking.end_date, booking.check_out_time, booking.timezone)

// Поездка закончилась: после выезда инструкции закрыты
export const isGuestBookingPast = (booking: GuestBooking, now = new Date()): boolean => getGuestCheckOut(booking) <= now
