import { errorCatch } from '@front-cmdt/utils/error-catch'
import { useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useNavigate } from 'react-router'
import { teamKeys, useAcceptInvitation } from '@/entities/team'
import type { PreviewTeamInvitationResponseData } from '@/shared/api/generated/models'
import { ROUTES } from '@/shared/config/paths'
import { formatDate } from '@/shared/lib/format'
import { ErrorText } from '@/shared/ui/rb/ErrorText'
import { Reveal } from '@/shared/ui/rb/motion'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Spinner } from '@/shared/ui/shadcn/spinner'

export const InviteActions = ({ token, invitation }: { token: string; invitation: PreviewTeamInvitationResponseData }) => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const accept = useAcceptInvitation(token)
  // Корень организации сам ведёт на стартовый раздел
  const toOrganization = () => navigate(`/app/${invitation.organization_id}`, { replace: true })

  const submit = () =>
    accept.mutate(undefined, {
      onSuccess: toOrganization,
      onError: (error) => {
        const status = isAxiosError(error) ? error.response?.status : undefined
        // 409 — уже участник: приглашение не нужно, ведём туда же, куда и после принятия
        if (status === 409) toOrganization()
        // 410 — приглашение успели отозвать или оно истекло: перечитанное превью покажет экран «недоступно»
        if (status === 410) queryClient.invalidateQueries({ queryKey: teamKeys.invitationPreview(token) })
      },
    })

  const status = isAxiosError(accept.error) ? accept.error.response?.status : undefined
  const failed = accept.isError && status !== 409 && status !== 410

  return (
    <Reveal delay={0.95} className="flex flex-col gap-3">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <span className="mono-label text-smoke">Действует до {formatDate(invitation.expires_at, 'd MMM, HH:mm')}</span>
        <div className="flex flex-wrap gap-2">
          {/* Ручки отказа на бэке нет: приглашение просто истечёт через 7 дней, кнопка только уводит со страницы */}
          <Button variant="ghost" disabled={accept.isPending} onClick={() => navigate(ROUTES.HOME)}>
            Не сейчас
          </Button>
          <Button className="shadow-control" onClick={submit} disabled={accept.isPending}>
            {accept.isPending ? (
              <>
                <Spinner /> Подключаем к команде
              </>
            ) : (
              'Принять и войти'
            )}
          </Button>
        </div>
      </div>
      {failed && (
        <ErrorText className="sm:justify-end">
          {String(errorCatch(accept.error, { mode: 'all', joinSeparator: ', ' }) ?? '') || 'Не удалось принять приглашение. Попробуйте ещё раз'}
        </ErrorText>
      )}
    </Reveal>
  )
}
