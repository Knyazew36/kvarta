import { RefreshCwIcon } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { useCalendar } from '@/entities/calendar'
import { useAllProperties } from '@/entities/property'
import type { CalendarBlock } from '@/shared/api/generated/models'
import { to } from '@/shared/config/paths'
import { cn } from '@/shared/lib/utils'
import { StateView } from '@/shared/ui/rb/StateView'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { type CalendarMode, getRequestRange } from '../model/range'
import { BlockSheet } from './BlockSheet'
import { CalendarAgenda } from './CalendarAgenda'
import { CalendarDayTimeline } from './CalendarDayTimeline'
import { CalendarGrid } from './CalendarGrid'
import { CalendarLegend } from './CalendarLegend'
import { DayTasksMock } from './CalendarMocks'

type CalendarBoardProps = {
  organizationId: number
  mode: CalendarMode
  days: string[]
  today: string
  propertyId?: number
}

// Сетка календаря с данными: запрос периода, его состояния и карточка блокировки
export const CalendarBoard = ({ organizationId, mode, days, today, propertyId }: CalendarBoardProps) => {
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
      <div className={cn('hidden transition-opacity md:block', isPlaceholderData && 'opacity-60')}>
        {mode === 'day' ? (
          <div className="flex flex-col gap-4">
            <CalendarDayTimeline day={days[0]} rows={rows} today={today} nowHour={nowHour} addresses={addresses} orgId={orgId} onBlockClick={setOpenBlock} />
            <DayTasksMock />
          </div>
        ) : (
          <CalendarGrid
            mode={mode}
            days={days}
            rows={rows}
            today={today}
            nowFraction={nowHour / 24}
            addresses={addresses}
            orgId={orgId}
            onBlockClick={setOpenBlock}
          />
        )}
      </div>
      <div className={cn('transition-opacity md:hidden', isPlaceholderData && 'opacity-60')}>
        <CalendarAgenda days={days} rows={rows} today={today} orgId={orgId} />
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
