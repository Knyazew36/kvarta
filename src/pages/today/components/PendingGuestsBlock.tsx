import { ArrowRightIcon, UserCheckIcon } from 'lucide-react'
import { Link } from 'react-router'
import { usePendingGuestGrants } from '@/entities/guest-access'
import { isEmployee, useCurrentOrganization } from '@/entities/organization'
import { to } from '@/shared/config/paths'
import { formatRange } from '@/shared/lib/format'

// Гости, которые приняли приглашение и ждут подтверждения команды: без него гость не видит ни бронь, ни инструкции.
// Блок на API среди макетной главной — показывается только когда есть кого подтверждать
export const PendingGuestsBlock = () => {
  const { organization, role } = useCurrentOrganization()
  // Сотруднику брони недоступны (403)
  const { data: pending } = usePendingGuestGrants(organization.id, { enabled: !isEmployee(role) })

  if (!pending || pending.length === 0) return null

  return (
    <section className="flex flex-col gap-5 rounded-card bg-card p-6 shadow-card md:p-8">
      <h2 className="section-heading flex items-center gap-2.5 text-subheading-lg">
        <UserCheckIcon className="size-5 shrink-0" aria-hidden />
        Гости ждут подтверждения
        <span className="text-smoke">{pending.length}</span>
      </h2>
      <ul className="-mx-3 flex flex-col">
        {pending.map(({ booking, grant }) => (
          <li key={grant.id}>
            <Link
              to={to.booking(booking.id, String(organization.id), 'instructions')}
              className="group/row grid grid-cols-[1fr_auto] items-center gap-x-6 gap-y-1 rounded-2xl p-3 outline-none transition-colors hover:bg-mist focus-visible:bg-mist"
            >
              <span className="flex min-w-0 flex-col gap-1">
                <span className="truncate text-body font-medium">
                  {grant.guest.name} <span className="font-normal text-smoke">· {grant.guest.email}</span>
                </span>
                <span className="truncate text-caption text-smoke">
                  Бронь #{booking.id} · {formatRange(booking.start_date.slice(0, 10), booking.end_date.slice(0, 10))} · {booking.guest_name}
                </span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-caption text-slate">
                Подтвердить <ArrowRightIcon className="size-3.5 transition-transform group-hover/row:translate-x-0.5" aria-hidden />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
