import { Link } from 'react-router'
import { to } from '@/shared/config/paths'
import type { CalendarRow } from '../model/entries'

// Подпись строки: объект залипает слева при горизонтальной прокрутке сетки
export const PropertyCell = ({ row, address, orgId }: { row: CalendarRow; address?: string | null; orgId: string }) => (
  <div className="sticky left-0 z-10 flex w-[220px] shrink-0 flex-col justify-center gap-0.5 bg-card px-5 py-3">
    <Link to={to.property(String(row.id), 'info', orgId)} className="truncate text-body-sm font-medium hover:underline">
      {row.name}
    </Link>
    {/* Архивный объект остаётся в календаре: по нему читается история занятости */}
    <span className="truncate text-caption text-smoke">{row.status === 'archived' ? 'В архиве' : address}</span>
  </div>
)
