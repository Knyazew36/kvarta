import { MessageCircleIcon } from 'lucide-react'
import type { Booking } from '@/shared/api/generated/models'
import { formatDate, formatMoney, nights, pluralize } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { MOCK_BORDER } from '@/shared/mock/mock-border'
import { MetaItem, SectionCard } from '@/shared/ui/rb/Section'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

const EMPTY = '—'

export const BookingGuestTab = ({ booking }: { booking: Booking }) => (
  <div className="grid items-start gap-4 lg:grid-cols-2">
    <SectionCard title="Гость">
      <dl className="grid grid-cols-2 gap-5">
        <MetaItem label="Имя">{booking.guest_name}</MetaItem>
        <MetaItem label="Гостей">{pluralize(booking.guests_count, ['человек', 'человека', 'человек'])}</MetaItem>
        <MetaItem label="Телефон">
          {booking.guest_phone ? (
            <a href={`tel:${booking.guest_phone}`} className="hover:underline">
              {booking.guest_phone}
            </a>
          ) : (
            EMPTY
          )}
        </MetaItem>
        <MetaItem label="Почта" className="break-all">
          {booking.guest_email ? (
            <a href={`mailto:${booking.guest_email}`} className="hover:underline">
              {booking.guest_email}
            </a>
          ) : (
            EMPTY
          )}
        </MetaItem>
      </dl>
      {/* Переписки с гостем на бэке нет */}
      <Button variant="outline" size="sm" className={cn('mt-6 self-start bg-canvas', MOCK_BORDER)}>
        <MessageCircleIcon /> Написать гостю
      </Button>
    </SectionCard>

    <SectionCard title="Проживание">
      <dl className="grid grid-cols-2 gap-5">
        <MetaItem label="Заезд">
          {formatDate(booking.start_date, 'd MMMM yyyy')}
          {booking.check_in_time && `, с ${booking.check_in_time}`}
        </MetaItem>
        <MetaItem label="Выезд">
          {formatDate(booking.end_date, 'd MMMM yyyy')}
          {booking.check_out_time && `, до ${booking.check_out_time}`}
        </MetaItem>
        <MetaItem label="Ночей">{nights(booking.start_date, booking.end_date)}</MetaItem>
        <MetaItem label="Часовой пояс">{booking.timezone}</MetaItem>
        <MetaItem label="Сумма">{formatMoney(booking.total_amount_minor / 100)}</MetaItem>
        {/* Условий отмены и правил дома на бэке нет */}
        <MetaItem label="Отмена" className={MOCK_BORDER}>
          Бесплатно до 5 окт, далее удерживается предоплата
        </MetaItem>
      </dl>
      <span className="mt-6 text-caption text-smoke">
        Время заезда, выезда и часовой пояс зафиксированы при создании брони: изменения в объекте их не меняют. Сумма — цена проживания, а не оплата.
      </span>
    </SectionCard>

    {booking.notes && (
      <SectionCard title="Заметки" count="видны только команде" className="lg:col-span-2">
        <p className="text-body-sm whitespace-pre-wrap">{booking.notes}</p>
      </SectionCard>
    )}
  </div>
)
