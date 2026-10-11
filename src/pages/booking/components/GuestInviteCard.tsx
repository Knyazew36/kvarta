import { zodResolver } from '@hookform/resolvers/zod'
import { LinkIcon } from 'lucide-react'
import { useId, useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  type GuestInviteValues,
  getGuestInvitationLink,
  getGuestInvitationStatus,
  GUEST_INVITATION_STATUS_META,
  guestInviteSchema,
  useCreateGuestInvitation,
  useGuestInvitations,
  useRevokeGuestInvitation,
} from '@/entities/guest-access'
import { getFieldErrors } from '@/shared/api/model/getFieldErrors'
import type { Booking } from '@/shared/api/generated/models'
import { formatDate } from '@/shared/lib/format'
import { ErrorText } from '@/shared/ui/rb/ErrorText'
import { SectionCard } from '@/shared/ui/rb/Section'
import { StateView } from '@/shared/ui/rb/StateView'
import { StatusFromMeta } from '@/shared/ui/rb/StatusBadge'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { CopyButton } from '@/shared/ui/shadcn/animate-ui/components/buttons/copy'
import { Input } from '@/shared/ui/shadcn/input'
import { Label } from '@/shared/ui/shadcn/label'
import { Spinner } from '@/shared/ui/shadcn/spinner'
import { GuestAccessActionDialog } from './GuestAccessActionDialog'

type GuestInviteCardProps = {
  booking: Booking
  // Отменённая или закончившаяся бронь: новых приглашений бэк не выдаёт (409), отзыв остаётся
  canInvite: boolean
  // Внутри диалога: без своей карточки и заголовка — они уже есть у диалога
  embedded?: boolean
}

export const GuestInviteCard = ({ booking, canInvite, embedded }: GuestInviteCardProps) => {
  const { data: invitations, isPending, isError } = useGuestInvitations(booking.organization_id, booking.id)
  // Карточка бывает на экране дважды: во вкладке и в диалоге из шапки брони
  const emailId = useId()
  const createInvitation = useCreateGuestInvitation(booking.organization_id, booking.id)
  const revokeInvitation = useRevokeGuestInvitation(booking.organization_id, booking.id)
  // Токен приходит один раз — в ответе создания. Ссылку держим только в состоянии карточки
  const [created, setCreated] = useState<{ email: string; link: string } | null>(null)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<GuestInviteValues>({ resolver: zodResolver(guestInviteSchema), defaultValues: { email: booking.guest_email ?? '' } })

  const submit = handleSubmit((values) => {
    createInvitation.mutate(values, {
      onSuccess: (invitation) => setCreated({ email: invitation.email, link: getGuestInvitationLink(invitation.token) }),
      onError: (error) => {
        const emailErrors = getFieldErrors(error).email
        if (emailErrors?.length) setError('email', { message: emailErrors.join(', ') })
      },
    })
  })

  const content = (
    <div className="flex min-w-0 flex-col gap-5">
      {canInvite ? (
        <form className="flex flex-col gap-2" onSubmit={submit} noValidate>
          <Label htmlFor={emailId} className="text-body-sm font-medium">
            Почта гостя
          </Label>
          <div className="flex gap-2">
            <Input
              id={emailId}
              type="email"
              autoComplete="off"
              placeholder="guest@example.com"
              aria-invalid={!!errors.email || undefined}
              aria-describedby={errors.email ? `${emailId}-error` : undefined}
              {...register('email')}
            />
            <Button type="submit" className="shrink-0 shadow-control" disabled={createInvitation.isPending}>
              {createInvitation.isPending ? <Spinner /> : <LinkIcon />} Создать ссылку
            </Button>
          </div>
          <ErrorText id={`${emailId}-error`} errors={errors.email} />
          {!errors.email && (
            <span className="text-caption text-smoke">
              Ссылка действует 7 дней и открывается только с этой почтой. Новая ссылка на ту же почту отменяет прежнюю. Письмо не отправляется.
            </span>
          )}
        </form>
      ) : (
        <span className="text-body-sm text-slate">Бронь отменена или уже закончилась — новые приглашения не выдаются.</span>
      )}

      {created && (
        <div className="flex min-w-0 flex-col gap-2 rounded-3xl bg-foreground p-4 text-background dark:bg-mist dark:text-foreground">
          <span className="truncate text-body-sm font-medium">Ссылка для {created.email}</span>
          <div className="flex min-w-0 items-center gap-2">
            <span className="min-w-0 flex-1 truncate font-mono text-caption opacity-80">{created.link}</span>
            <CopyButton content={created.link} size="sm" className="rounded-full bg-lime text-[#0a1217] hover:bg-lime/85" aria-label="Скопировать ссылку" />
          </div>
          <span className="text-caption opacity-70">
            Показывается один раз. Отправьте её гостю сами: после входа гость запросит доступ, а вы подтвердите его ниже.
          </span>
        </div>
      )}

      {isPending ? (
        <StateView state="loading" />
      ) : isError ? (
        <ErrorText>Приглашения не загрузились. Обновите страницу.</ErrorText>
      ) : (
        invitations.length > 0 && (
          <ul className="-mx-3 flex flex-col border-t border-mist pt-3">
            {/* Бэк отдаёт id ASC; свежие приглашения нужнее */}
            {[...invitations].reverse().map((invitation) => {
              const status = getGuestInvitationStatus(invitation)

              return (
                <li key={invitation.id} className="flex items-center gap-3 rounded-2xl p-3">
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="truncate text-body-sm font-medium">{invitation.email}</span>
                    <span className="mono-label text-smoke">до {formatDate(invitation.expires_at, 'd MMM, HH:mm')}</span>
                  </span>
                  <StatusFromMeta meta={GUEST_INVITATION_STATUS_META[status]} size="sm" />
                  {status === 'pending' && (
                    <GuestAccessActionDialog
                      trigger={
                        <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                          Отозвать
                        </Button>
                      }
                      subject={invitation.email}
                      title="Отозвать приглашение?"
                      description="Ссылка перестанет работать. Чтобы пригласить гостя снова, создайте новую."
                      placeholder="Например, ошиблись адресом"
                      submitLabel="Отозвать"
                      destructive
                      isPending={revokeInvitation.isPending}
                      onSubmit={(reason, callbacks) => revokeInvitation.mutate({ invitationId: invitation.id, version: invitation.version, reason }, callbacks)}
                      onClose={revokeInvitation.reset}
                    />
                  )}
                </li>
              )
            })}
          </ul>
        )
      )}
    </div>
  )

  if (embedded) return content

  return (
    <SectionCard title="Приглашение гостя" className="shadow-card">
      {content}
    </SectionCard>
  )
}
