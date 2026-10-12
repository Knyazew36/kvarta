import { Link } from 'react-router'
import { to } from '@/shared/config/paths'
import { cn } from '@/shared/lib/utils'
import type { CalendarRow } from '../model/entries'
import { PROPERTY_COL } from '../model/layout'

// Подпись строки: объект залипает слева при горизонтальной прокрутке сетки
export const PropertyCell = ({ row, address, orgId }: { row: CalendarRow; address?: string | null; orgId: string }) => (
  <div className={cn(PROPERTY_COL, 'flex flex-col justify-center gap-0.5 py-3')}>
    <Link to={to.property(String(row.id), 'info', orgId)} className="truncate text-body-sm font-medium hover:underline">
      {row.name}
    </Link>
    {/* Архивный объект остаётся в календаре: по нему читается история занятости */}
    <span className="truncate text-caption text-smoke">{row.status === 'archived' ? 'В архиве' : address}</span>
  </div>
)
