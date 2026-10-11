import { ArrowUpRightIcon, LuggageIcon, ShieldCheckIcon } from 'lucide-react'
import { Link } from 'react-router'
import { to } from '@/shared/config/paths'
import { SectionCard } from '@/shared/ui/rb/Section'
import { RowIcon } from './RowIcon'

// Гостевой и профессиональный кабинеты — отдельные контуры, переход в них явный (§2)
export const OtherCabinets = () => (
  <SectionCard title="Другие кабинеты" className="shadow-card">
    <ul className="-mx-3 flex flex-col gap-1">
      <li>
        <Link
          to={to.guestBookings()}
          className="flex items-center gap-4 rounded-3xl p-3 outline-none transition-colors hover:bg-mist focus-visible:ring-3 focus-visible:ring-ring/30"
        >
          <RowIcon>
            <LuggageIcon />
          </RowIcon>
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-body-sm font-medium">Мои поездки как гость</span>
            <span className="text-caption text-smoke">Брони, которые вы сделали у других владельцев</span>
          </span>
          <ArrowUpRightIcon className="size-4 shrink-0 text-smoke" aria-hidden />
        </Link>
      </li>
      <li>
        <Link
          to={to.specialistProfile()}
          className="flex items-center gap-4 rounded-3xl p-3 outline-none transition-colors hover:bg-mist focus-visible:ring-3 focus-visible:ring-ring/30"
        >
          <RowIcon>
            <ShieldCheckIcon />
          </RowIcon>
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-body-sm font-medium">Кабинет специалиста</span>
            <span className="text-caption text-smoke">Для мастеров и клинеров из каталога: профиль, обращения, отзывы</span>
          </span>
          <ArrowUpRightIcon className="size-4 shrink-0 text-smoke" aria-hidden />
        </Link>
      </li>
    </ul>
  </SectionCard>
)
