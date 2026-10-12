import { CheckIcon, EyeIcon, LockIcon, RefreshCwIcon } from 'lucide-react'
import { useState } from 'react'
import { useAcknowledgeGuestInstruction, useGuestInstruction } from '@/entities/guest-access'
import { formatInstant, getInstructionConflict, getInstructionTypeMeta, getLockedReasonText } from '@/entities/instruction'
import type { GuestInstructionMetadata } from '@/shared/api/generated/models'
import { ErrorText } from '@/shared/ui/rb/ErrorText'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { CopyButton } from '@/shared/ui/shadcn/animate-ui/components/buttons/copy'
import { Skeleton } from '@/shared/ui/shadcn/skeleton'
import { Spinner } from '@/shared/ui/shadcn/spinner'

type LockedReasonsProps = { reasons: string[]; opensAt: string | null; timezone: string }

const LockedReasons = ({ reasons, opensAt, timezone }: LockedReasonsProps) => (
  <ul className="flex flex-col gap-1 text-body-sm text-slate">
    {reasons.map((reason) => (
      <li key={reason}>
        {getLockedReasonText(reason, 'guest')}
        {reason === 'window_not_open' && opensAt && ` — ${formatInstant(opensAt, timezone)}`}
      </li>
    ))}
  </ul>
)

type GuestInstructionCardProps = {
  index: number
  bookingId: number
  instruction: GuestInstructionMetadata
  timezone: string
}

export const GuestInstructionCard = ({ index, bookingId, instruction, timezone }: GuestInstructionCardProps) => {
  // Текст запрашиваем только по нажатию: первое чтение версии владелец видит как «открыто гостем».
  // Скрытый текст не висит на экране, который могут видеть рядом
  const [open, setOpen] = useState(false)
  const content = useGuestInstruction(bookingId, instruction.id, { enabled: open && instruction.available })
  const acknowledge = useAcknowledgeGuestInstruction(bookingId, instruction.id)
  const Icon = getInstructionTypeMeta(instruction.type).icon
  // Инструкцию могли закрыть между списком и нажатием: бэк отвечает 409 с причинами
  const lockedNow = getInstructionConflict(content.error)?.locked_reasons
  const receivedAt = content.data?.received_at ?? instruction.received_at

  return (
    <div className="flex gap-4 rounded-3xl bg-card p-4 md:p-5">
      <span className="text-caption text-smoke tabular-nums">{String(index + 1).padStart(2, '0')}</span>
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <span className="flex items-center gap-2 text-body font-medium">
          <Icon className="size-4 shrink-0" aria-hidden /> {instruction.title}
        </span>

        {!instruction.available ? (
          <span className="flex items-start gap-2">
            <LockIcon className="mt-1 size-3.5 shrink-0 text-smoke" aria-hidden />
            <LockedReasons reasons={instruction.locked_reasons} opensAt={instruction.opens_at} timezone={timezone} />
          </span>
        ) : !open ? (
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" size="sm" className="bg-canvas" onClick={() => setOpen(true)}>
              <EyeIcon /> {instruction.opened_at ? 'Показать' : 'Открыть'}
            </Button>
            <span className="text-caption text-smoke">
              {receivedAt ? 'Получение подтверждено' : instruction.opened_at ? 'Вы уже открывали эту инструкцию' : `Доступна до ${formatInstant(instruction.closes_at, timezone)}`}
            </span>
          </div>
        ) : content.isPending ? (
          <div className="flex flex-col gap-2" aria-busy="true" aria-label="Загрузка">
            <Skeleton className="h-4 w-full rounded-full" />
            <Skeleton className="h-4 w-2/3 rounded-full" />
          </div>
        ) : lockedNow ? (
          <span className="flex items-start gap-2">
            <LockIcon className="mt-1 size-3.5 shrink-0 text-smoke" aria-hidden />
            <LockedReasons reasons={lockedNow} opensAt={instruction.opens_at} timezone={timezone} />
          </span>
        ) : content.isError ? (
          <div className="flex flex-col items-start gap-2">
            <ErrorText>Инструкция не загрузилась. Проверьте соединение и повторите попытку.</ErrorText>
            <Button variant="outline" size="sm" disabled={content.isRefetching} onClick={() => content.refetch()}>
              <RefreshCwIcon /> Повторить
            </Button>
          </div>
        ) : (
          <>
            {/* Обычный текст без разметки — как ввёл владелец */}
            <p className="text-body-sm whitespace-pre-wrap text-slate">{content.data.content}</p>
            <div className="flex flex-wrap items-center gap-2">
              {receivedAt ? (
                <span className="inline-flex items-center gap-1.5 text-caption text-smoke">
                  <CheckIcon className="size-3.5" aria-hidden /> Получение подтверждено
                </span>
              ) : (
                <Button size="sm" className="shadow-control" disabled={acknowledge.isPending} onClick={() => acknowledge.mutate(content.data.version)}>
                  {acknowledge.isPending ? <Spinner /> : <CheckIcon />} Получил(а)
                </Button>
              )}
              <CopyButton content={content.data.content} variant="ghost" size="sm" className="rounded-full bg-background hover:bg-mist" aria-label="Скопировать текст" />
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                Скрыть
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
