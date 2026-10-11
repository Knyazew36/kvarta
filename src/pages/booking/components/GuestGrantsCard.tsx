import { CheckIcon, EyeIcon } from 'lucide-react'
import { GUEST_GRANT_STATUS_META, useApproveGuestPayment, useConfirmGuestGrant, useRevokeGuestGrant } from '@/entities/guest-access'
import type { GuestGrant, InstructionMetadata } from '@/shared/api/generated/models'
import { formatDate } from '@/shared/lib/format'
import { ErrorText } from '@/shared/ui/rb/ErrorText'
import { SectionCard } from '@/shared/ui/rb/Section'
import { StateView } from '@/shared/ui/rb/StateView'
import { StatusFromMeta } from '@/shared/ui/rb/StatusBadge'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { GuestAccessActionDialog } from './GuestAccessActionDialog'

type GuestGrantsCardProps = {
  organizationId: number
  bookingId: number
  grants: GuestGrant[] | undefined
  isError: boolean
  // Названия инструкций для отметок открытия и получения: в привязке приходит только id
  instructions: InstructionMetadata[] | undefined
  // Отменённая или закончившаяся бронь: подтверждение и разрешение бэк не принимает (409), отзыв остаётся
  canManage: boolean
}

export const GuestGrantsCard = ({ organizationId, bookingId, grants, isError, instructions, canManage }: GuestGrantsCardProps) => {
  const confirmGrant = useConfirmGuestGrant(organizationId, bookingId)
  const revokeGrant = useRevokeGuestGrant(organizationId, bookingId)
  const approvePayment = useApproveGuestPayment(organizationId, bookingId)
  const titles = new Map(instructions?.map((instruction) => [instruction.id, instruction.title]))

  return (
    <SectionCard title="Гости с доступом" count={grants?.length || undefined} className="shadow-card">
      {isError ? (
        <ErrorText>Привязки гостей не загрузились. Обновите страницу.</ErrorText>
      ) : !grants ? (
        <StateView state="loading" />
      ) : grants.length === 0 ? (
        <span className="text-body-sm text-slate">Пока никто не запросил доступ. Гость появится здесь, когда откроет ссылку-приглашение и примет её.</span>
      ) : (
        <ul className="flex flex-col gap-5">
          {grants.map((grant) => (
            <li key={grant.id} className="flex flex-col gap-3 border-t border-mist pt-5 first:border-t-0 first:pt-0">
              <div className="flex items-start justify-between gap-3">
                <span className="flex min-w-0 flex-col gap-1">
                  <span className="truncate text-body-sm font-medium">{grant.guest.name}</span>
                  <span className="truncate text-caption text-smoke">{grant.guest.email}</span>
                </span>
                <StatusFromMeta meta={GUEST_GRANT_STATUS_META[grant.status]} size="sm" />
              </div>

              {grant.status === 'pending' && (
                <span className="text-caption text-slate">
                  Гость принял приглашение. Проверьте, что это тот самый человек: вход и почта сами по себе доступа не дают.
                </span>
              )}
              {grant.status === 'revoked' && <span className="text-caption text-slate">Чтобы вернуть доступ, создайте новое приглашение.</span>}

              {grant.status === 'active' && (
                <div className="flex flex-col gap-1 rounded-2xl bg-mist p-3">
                  <span className="mono-label text-smoke">Оплата для чувствительных инструкций</span>
                  {grant.payment_approved_at ? (
                    <>
                      <span className="text-body-sm">Проверена {formatDate(grant.payment_approved_at, 'd MMM, HH:mm')}</span>
                      {grant.payment_approval_reason && <span className="text-caption text-slate">Основание: {grant.payment_approval_reason}</span>}
                    </>
                  ) : (
                    <span className="text-body-sm">Не подтверждена</span>
                  )}
                </div>
              )}

              {grant.receipts.length > 0 && (
                <ul className="flex flex-col gap-1.5">
                  {grant.receipts.map((receipt) => (
                    <li key={receipt.instruction_id} className="flex items-center gap-2 text-caption text-slate">
                      {receipt.received_at ? <CheckIcon className="size-3.5 shrink-0" aria-hidden /> : <EyeIcon className="size-3.5 shrink-0" aria-hidden />}
                      <span className="min-w-0 truncate">
                        {titles.get(receipt.instruction_id) ?? `Инструкция #${receipt.instruction_id}`} ·{' '}
                        {receipt.received_at
                          ? `получение подтверждено ${formatDate(receipt.received_at, 'd MMM, HH:mm')}`
                          : `открыта ${formatDate(receipt.opened_at, 'd MMM, HH:mm')}`}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {grant.status !== 'revoked' && (
                <div className="flex flex-wrap gap-2">
                  {grant.status === 'pending' && canManage && (
                    <GuestAccessActionDialog
                      trigger={
                        <Button size="sm" className="shadow-control">
                          Подтвердить гостя
                        </Button>
                      }
                      subject={grant.guest.email}
                      title="Подтвердить гостя?"
                      description="Гость увидит бронь и обычные инструкции. Чувствительные откроются только по условиям объекта."
                      placeholder="Например, личность и бронь сверил по телефону"
                      submitLabel="Подтвердить"
                      isPending={confirmGrant.isPending}
                      onSubmit={(reason, callbacks) => confirmGrant.mutate({ grantId: grant.id, version: grant.version, reason }, callbacks)}
                      onClose={confirmGrant.reset}
                    />
                  )}
                  {grant.status === 'active' && canManage && (
                    <GuestAccessActionDialog
                      trigger={
                        <Button variant="outline" size="sm" className="bg-canvas">
                          {grant.payment_approved_at ? 'Обновить основание оплаты' : 'Оплата проверена'}
                        </Button>
                      }
                      subject={grant.guest.email}
                      title="Разрешить выдачу по оплате?"
                      description="Это разрешение на выдачу инструкций, а не запись о платеже: финансы брони не меняются. Сумма в брони и слова гостя оплату не доказывают — подтверждайте, только если проверили поступление сами."
                      placeholder="Например, полную оплату проверил по выписке"
                      submitLabel="Разрешить"
                      isPending={approvePayment.isPending}
                      onSubmit={(reason, callbacks) => approvePayment.mutate({ grantId: grant.id, version: grant.version, reason }, callbacks)}
                      onClose={approvePayment.reset}
                    />
                  )}
                  <GuestAccessActionDialog
                    trigger={
                      <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                        Отозвать доступ
                      </Button>
                    }
                    subject={grant.guest.email}
                    title="Отозвать доступ гостя?"
                    description="Гость сразу перестанет видеть бронь и инструкции, разрешение по оплате сбросится. Вернуть доступ можно только новым приглашением."
                    placeholder="Например, бронь оформлена на другого человека"
                    submitLabel="Отозвать"
                    destructive
                    isPending={revokeGrant.isPending}
                    onSubmit={(reason, callbacks) => revokeGrant.mutate({ grantId: grant.id, version: grant.version, reason }, callbacks)}
                    onClose={revokeGrant.reset}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  )
}
