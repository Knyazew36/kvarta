import { BellIcon } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { DEMO_ORG_ID, to } from '@/shared/config/paths'
import { cn } from '@/shared/lib/utils'
import { useDemoState } from '@/shared/mock/state'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/shadcn/popover'
import { DELIVERY, noticesFor, useNoticesRead } from './notices'

// В колокольчике — только свежие события, остальное на странице уведомлений
const PREVIEW = 4

export const NotificationsPopover = () => {
  const { orgId = DEMO_ORG_ID } = useParams()
  const [open, setOpen] = useState(false)
  const { isEmployee } = useDemoState()
  const { read, markRead } = useNoticesRead()
  const own = noticesFor(isEmployee)
  const unread = own.filter((notice) => !read[notice.id]).length
  const close = () => setOpen(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={`Уведомления, непрочитанных: ${unread}`}
        className="relative flex size-11 items-center justify-center rounded-full bg-card outline-none transition-colors hover:bg-mist focus-visible:ring-3 focus-visible:ring-ring/30 data-popup-open:bg-foreground data-popup-open:text-background"
      >
        <BellIcon className="size-5" aria-hidden />
        {unread > 0 && (
          <span className="mono-label absolute -top-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full bg-attention text-background">
            {unread}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-[min(380px,calc(100vw-2rem))] gap-2 p-2">
        <div className="flex items-center justify-between px-3 pt-2">
          <span className="section-heading text-subheading-lg">Уведомления</span>
          <Link to={to.notifications(orgId)} onClick={close} className="mono-label text-slate underline-offset-4 hover:underline">
            Все
          </Link>
        </div>
        <ul className="flex flex-col">
          {own.slice(0, PREVIEW).map((notice) => (
            <li key={notice.id}>
              <Link
                to={notice.href(orgId)}
                onClick={() => {
                  markRead(notice.id)
                  close()
                }}
                className="flex gap-3 rounded-3xl p-3 outline-none transition-colors hover:bg-mist focus-visible:bg-mist"
              >
                <span
                  className={cn(
                    'flex size-9 shrink-0 items-center justify-center rounded-full',
                    !read[notice.id] ? 'bg-foreground text-background' : 'bg-mist',
                  )}
                >
                  <notice.icon className="size-4" aria-hidden />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className={cn('truncate text-body-sm', read[notice.id] ? 'text-slate' : 'font-medium')}>{notice.title}</span>
                    <span className="mono-label shrink-0 text-smoke">{notice.at}</span>
                  </span>
                  <span className="truncate text-body-sm text-slate">{notice.text}</span>
                  <span className={cn('mono-label', DELIVERY[notice.max].className)}>
                    {DELIVERY[notice.max].label}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  )
}
