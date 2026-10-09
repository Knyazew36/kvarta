import { useState } from 'react'
import { CheckCheckIcon, Settings2Icon } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { Link, useParams } from 'react-router'
import { DEMO_ORG_ID, to } from '@/shared/config/paths'
import { DEMO_TZ, DEMO_TZ_FULL, pluralize } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { useDemoState } from '@/shared/mock/state'
import { EASE } from '@/shared/ui/rb/motion-presets'
import { StateView } from '@/shared/ui/rb/StateView'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/shadcn/animate-ui/components/animate/tabs'
import { DELIVERY, type Notice, noticesFor, useNoticesRead } from '@/widgets/app-shell/notices'

// ── Дни и подборки ──────────────────────────────────────────────────────────

const DAY_LABEL = { today: 'Сегодня, 8 окт', yesterday: 'Вчера, 7 окт' }

type Filter = 'all' | 'unread' | 'urgent'

// ── Строка ──────────────────────────────────────────────────────────────────

const NoticeRow = ({ notice, orgId, read, onOpen }: { notice: Notice; orgId: string; read: boolean; onOpen: () => void }) => {
  const Icon = notice.icon
  return (
    <motion.li layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.35, ease: EASE }}>
      <Link
        to={notice.href(orgId)}
        onClick={onOpen}
        className="-mx-3 flex gap-4 rounded-2xl p-3 outline-none transition-colors hover:bg-background/70 focus-visible:bg-background/70"
      >
        <span className={cn('relative flex size-10 shrink-0 items-center justify-center rounded-full', notice.urgent && !read ? 'bg-foreground text-background' : 'bg-background')}>
          <Icon className="size-4" aria-hidden />
          {!read && <span className="absolute -top-0.5 -right-0.5 size-3 rounded-full bg-lime ring-2 ring-card" aria-label="не прочитано" />}
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="flex items-baseline justify-between gap-3">
            <span className={cn('text-body-sm', read ? 'text-slate' : 'font-medium')}>{notice.title}</span>
            <span className="shrink-0 text-caption text-smoke tabular-nums">{notice.at}</span>
          </span>
          <span className="text-body-sm text-slate">{notice.text}</span>
          <span className={cn('text-caption', DELIVERY[notice.max].className)}>{notice.maxNote ?? DELIVERY[notice.max].label}</span>
        </span>
      </Link>
    </motion.li>
  )
}

// ── Страница ────────────────────────────────────────────────────────────────

const NotificationsPage = () => {
  const { orgId = DEMO_ORG_ID } = useParams()
  const { state, isEmployee } = useDemoState()
  const [filter, setFilter] = useState<Filter>('all')
  const { read, markRead, markAll } = useNoticesRead()

  const own = noticesFor(isEmployee)
  const unread = own.filter((notice) => !read[notice.id]).length
  const list = own.filter((notice) => (filter === 'unread' ? !read[notice.id] : filter === 'urgent' ? notice.urgent : true))
  const failed = own.filter((notice) => notice.max === 'failed').length

  const header = (
    <header className="flex flex-col gap-6 pt-4 md:pt-10">
      <p className="text-caption text-smoke">Лента событий · {DEMO_TZ_FULL}</p>
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-4">
          <h1 className="text-heading font-semibold tracking-[-0.03em] md:text-heading-lg">Уведомления</h1>
          {state === 'ok' && (
            <p className="max-w-2xl text-subheading-lg text-slate">
              {unread > 0 ? (
                <>
                  <span className="text-foreground">{pluralize(unread, ['непрочитанное', 'непрочитанных', 'непрочитанных'])}</span>
                  {failed > 0 && `, ${failed} не дошло до MAX`}.
                </>
              ) : (
                'Всё прочитано.'
              )}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="bg-canvas shadow-control" disabled={unread === 0} onClick={() => markAll(own.map((notice) => notice.id))}>
            <CheckCheckIcon /> Прочитать всё
          </Button>
          {!isEmployee && (
            <Button variant="ghost" asChild>
              <Link to={to.settings('notifications', orgId)}>
                <Settings2Icon /> Правила
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  )

  if (state === 'loading' || state === 'empty' || state === 'denied') {
    return (
      <div className="flex flex-col gap-10 pb-8">
        {header}
        <StateView
          state={state}
          empty={{ title: 'Событий пока нет', description: 'Новые брони, переводы гостей, отчёты и сбои площадок появятся здесь и, если настроено, в MAX.' }}
          denied={{ title: 'Уведомления недоступны', description: 'Доступ к организации отозван. Новые события организации вам больше не приходят.' }}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 pb-8">
      {header}
      {state === 'error' && (
        <StateView
          state="error"
          error={{
            title: 'Лента обновлена не полностью',
            description: 'Новые события могли не загрузиться. Показанные — актуальны на момент последней загрузки.',
            lastSuccess: `8 окт, 09:31 ${DEMO_TZ}`,
          }}
        />
      )}

      {/* Подборки — только Animate UI: переезжающая подложка одинакова во всём кабинете */}
      <Tabs value={filter} onValueChange={(value) => setFilter(value as Filter)}>
        <TabsList aria-label="Подборка уведомлений" className="h-12 bg-card shadow-control">
          <TabsTrigger value="all" className="h-10">
            Все
          </TabsTrigger>
          <TabsTrigger value="unread" className="h-10">
            Непрочитанные
            {unread > 0 && <span className="rounded-full bg-lime px-1.5 text-caption text-[#0a1217] tabular-nums">{unread}</span>}
          </TabsTrigger>
          <TabsTrigger value="urgent" className="h-10">
            Срочные
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {list.length === 0 ? (
        <div className="rounded-card bg-card p-6 text-body-sm text-slate shadow-card md:p-8">В этой подборке пусто.</div>
      ) : (
        (['today', 'yesterday'] as const).map((day) => {
          const items = list.filter((notice) => notice.day === day)
          if (items.length === 0) return null
          return (
            <section key={day} className="flex flex-col gap-3 rounded-card bg-card p-6 shadow-card md:p-8">
              <h2 className="section-heading text-subheading-lg">{DAY_LABEL[day]}</h2>
              <ul className="flex flex-col">
                <AnimatePresence initial={false}>
                  {items.map((notice) => (
                    <NoticeRow key={notice.id} notice={notice} orgId={orgId} read={read[notice.id]} onOpen={() => markRead(notice.id)} />
                  ))}
                </AnimatePresence>
              </ul>
            </section>
          )
        })
      )}
    </div>
  )
}

export default NotificationsPage
