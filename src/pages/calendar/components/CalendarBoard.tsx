import { ChevronLeftIcon, ChevronRightIcon, RefreshCwIcon } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { useCalendar } from '@/entities/calendar'
import { useAllProperties } from '@/entities/property'
import type { CalendarBlock } from '@/shared/api/generated/models'
import { to } from '@/shared/config/paths'
import { cn } from '@/shared/lib/utils'
import { StateView } from '@/shared/ui/rb/StateView'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { type CalendarMode, type CustomPeriod, getRequestRange } from '../model/range'
import { useDayShift } from '../model/use-period-params'
import { BlockSheet } from './BlockSheet'
import { CalendarDayTimeline } from './CalendarDayTimeline'
import { CalendarGrid } from './CalendarGrid'
import { CalendarLegend } from './CalendarLegend'
import { DayTasksMock } from './CalendarMocks'

type CalendarBoardProps = {
  organizationId: number
  mode: CalendarMode
  date: string
  shift: number
  custom: CustomPeriod | null
  days: string[]
  today: string
  propertyId?: number
}

// Сетка календаря с данными: запрос периода, его состояния и карточка блокировки
export const CalendarBoard = ({ organizationId, mode, date, shift, custom, days, today, propertyId }: CalendarBoardProps) => {
  const shiftDay = useDayShift(mode, date, shift, custom)
  const { data: rows, isPending, isError, refetch, isRefetching, isPlaceholderData } = useCalendar(organizationId, getRequestRange(days, propertyId))
  // В ответе календаря у объекта только название и пояс — адрес берём из списка объектов, вместе с архивными
  const { data: properties } = useAllProperties(organizationId, 'all')
  const [openBlock, setOpenBlock] = useState<CalendarBlock | null>(null)
  // Время браузера на момент открытия: линия «сейчас» одна на всю сетку, хотя пояса у объектов разные
  const [nowHour] = useState(() => {
    const now = new Date()
    return now.getHours() + now.getMinutes() / 60
  })

  if (isPending) return <StateView state="loading" />

  if (isError) {
    return (
      <StateView
        state="error"
        error={{
          title: 'Календарь не загрузился',
          description: 'Проверьте соединение и повторите попытку.',
          action: (
            <Button variant="outline" size="sm" disabled={isRefetching} onClick={() => refetch()}>
              <RefreshCwIcon /> Повторить
            </Button>
          ),
        }}
      />
    )
  }

  const orgId = String(organizationId)

  if (rows.length === 0) {
    return (
      <StateView
        state="empty"
        empty={{
          title: 'Нет объектов',
          description: 'Календарь строится по объектам. Добавьте первый объект — на нём появятся брони и блокировки.',
          action: (
            <Button variant="outline" size="sm" asChild>
              <Link to={to.properties(orgId)}>Добавить объект</Link>
            </Button>
          ),
        }}
      />
    )
  }

  const addresses = new Map(properties?.map((property) => [property.id, property.address]))
  const blockRow = openBlock && rows.find((row) => row.id === openBlock.property_id)

  return (
    <>
      {/* Пока грузится соседний период, на экране прежний — приглушаем его */}
      <div className={cn('transition-opacity', isPlaceholderData && 'opacity-60')}>
        {mode === 'day' ? (
          <div className="flex flex-col gap-4">
            <CalendarDayTimeline day={days[0]} rows={rows} today={today} nowHour={nowHour} addresses={addresses} orgId={orgId} onBlockClick={setOpenBlock} />
            <DayTasksMock />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <CalendarGrid
              mode={mode}
              days={days}
              rows={rows}
              today={today}
              nowFraction={nowHour / 24}
              addresses={addresses}
              orgId={orgId}
              onBlockClick={setOpenBlock}
              onShiftDay={shiftDay}
            />
            {shiftDay && (
              <>
                <p className="hidden px-1.5 text-right text-caption text-smoke md:block">Сдвиг по дням: тяните шапку с датами или Shift + колесо</p>
                {/* На телефоне палец прокручивает сетку, а не тянет шапку — окно по дням двигают кнопки */}
                <div className="flex justify-center gap-3 md:hidden">
                  <Button variant="ghost" size="icon" className="rounded-full bg-card shadow-control" aria-label="На день назад" onClick={() => shiftDay(-1)}>
                    <ChevronLeftIcon />
                  </Button>
                  <Button variant="ghost" size="icon" className="rounded-full bg-card shadow-control" aria-label="На день вперёд" onClick={() => shiftDay(1)}>
                    <ChevronRightIcon />
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <CalendarLegend withTasks={mode === 'day'} />

      <BlockSheet
        block={openBlock}
        propertyName={blockRow?.name ?? (openBlock ? `Объект #${openBlock.property_id}` : '')}
        propertyArchived={blockRow?.status === 'archived'}
        onClose={() => setOpenBlock(null)}
      />
    </>
  )
}
