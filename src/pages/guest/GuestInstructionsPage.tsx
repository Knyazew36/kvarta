import { isAxiosError } from 'axios'
import { ArrowLeftIcon, RefreshCwIcon } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { useGuestBooking, useGuestInstructions } from '@/entities/guest-access'
import { sortByInstructionType } from '@/entities/instruction'
import { to } from '@/shared/config/paths'
import { formatRange } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { DeviationNote } from '@/shared/mock/DeviationNote'
import { MOCK_BORDER } from '@/shared/mock/mock-border'
import { Reveal, RevealGroup, RevealItem, SplitHeadline } from '@/shared/ui/rb/motion'
import { StateView } from '@/shared/ui/rb/StateView'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { GuestInstructionCard } from './components/GuestInstructionCard'

const GuestInstructionsPage = () => {
  const { bookingId = '' } = useParams()
  // Бэк принимает только числовой id; остальное — «не найдена» без запроса
  const isValidId = /^\d+$/.test(bookingId)
  const id = Number(bookingId)
  const { data: booking } = useGuestBooking(id)
  const { data: instructions, isPending, isError, error, refetch, isRefetching } = useGuestInstructions(id)

  const notFound = !isValidId || (isError && isAxiosError(error) && error.response?.status === 404)
  const awaitsPayment = instructions?.some((instruction) => instruction.locked_reasons.includes('payment_approval_required'))

  return (
    <>
      <div className="flex w-full flex-col gap-8">
        <div className="flex flex-col gap-4">
          <Reveal>
            <Link
              to={isValidId ? to.guestBooking(bookingId) : to.guestBookings()}
              className="inline-flex w-fit items-center gap-1.5 text-caption text-smoke transition-colors hover:text-foreground"
            >
              <ArrowLeftIcon className="size-3.5" aria-hidden /> {isValidId ? 'К брони' : 'Мои бронирования'}
            </Link>
          </Reveal>
          <SplitHeadline text="Как заселиться" delay={0.05} className="brand-display text-[44px] md:text-[64px]" />
          {booking && (
            <Reveal delay={0.2} className="text-body text-slate">
              {booking.property.public_title ?? 'Ваше бронирование'} · {formatRange(booking.start_date.slice(0, 10), booking.end_date.slice(0, 10))}
            </Reveal>
          )}
        </div>

        {notFound ? (
          // 404 — привязки нет, она не подтверждена или отозвана, бронь отменена. Причину бэк не называет
          <StateView
            state="empty"
            empty={{
              title: 'Инструкции недоступны',
              description: 'Бронь отменена, доступ отозван или владелец ещё не подтвердил его.',
            }}
          />
        ) : isPending ? (
          <StateView state="loading" />
        ) : isError ? (
          <StateView
            state="error"
            error={{
              title: 'Инструкции не загрузились',
              description: 'Проверьте соединение и повторите попытку.',
              action: (
                <Button variant="outline" size="sm" disabled={isRefetching} onClick={() => refetch()}>
                  <RefreshCwIcon /> Повторить
                </Button>
              ),
            }}
          />
        ) : instructions.length === 0 ? (
          <StateView state="empty" empty={{ title: 'Инструкций пока нет', description: 'Владелец ещё не добавил инструкции для этого жилья.' }} />
        ) : (
          <>
            <RevealGroup as="ol" delay={0.25} stagger={0.08} className="flex flex-col gap-3">
              {sortByInstructionType(instructions).map((instruction, index) => (
                <RevealItem as="li" key={instruction.id}>
                  <GuestInstructionCard index={index} bookingId={id} instruction={instruction} timezone={booking?.timezone ?? ''} />
                </RevealItem>
              ))}
            </RevealGroup>

            {/* Сообщить о переводе гость пока не может: ручки под оплаты на бэке нет */}
            {awaitsPayment && (
              <Reveal delay={0.5} className={cn('flex flex-col items-start gap-3 rounded-3xl p-4', MOCK_BORDER)}>
                <span className="text-body-sm text-slate">Если вы уже перевели оплату — сообщите о переводе, владелец сверит его.</span>
                <Button className="h-12 shadow-control">Сообщить о переводе</Button>
              </Reveal>
            )}

            <DeviationNote reason="крупного блока с цифрами кода и отдельной карточки Wi-Fi нет — бэк отдаёт инструкции свободным текстом, а чувствительные гостю пока не выдаёт" />
          </>
        )}
      </div>
    </>
  )
}

export default GuestInstructionsPage
