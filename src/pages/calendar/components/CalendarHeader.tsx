import { BanIcon, CalendarPlusIcon } from 'lucide-react'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { BlockFormSheet } from '@/widgets/booking-actions/BlockFormSheet'
import { BookingFormSheet } from '@/widgets/booking-actions/BookingFormSheet'

type CalendarHeaderProps = {
  period: string
  // Сотруднику раздел закрыт: создавать записи он не может
  canManage?: boolean
}

export const CalendarHeader = ({ period, canManage }: CalendarHeaderProps) => (
  <header className="flex flex-col gap-6 pt-4 md:pt-10">
    <p className="text-caption text-smoke">{period} · ручные брони и блокировки</p>
    <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
      <h1 className="text-heading font-semibold tracking-[-0.03em] md:text-heading-lg">Календарь</h1>
      {canManage && (
        <div className="flex flex-wrap gap-2">
          <BookingFormSheet
            trigger={
              <Button className="shadow-control">
                <CalendarPlusIcon /> Ручная бронь
              </Button>
            }
          />
          <BlockFormSheet
            trigger={
              <Button variant="outline" className="bg-canvas shadow-control">
                <BanIcon /> Закрыть даты
              </Button>
            }
          />
        </div>
      )}
    </div>
  </header>
)
