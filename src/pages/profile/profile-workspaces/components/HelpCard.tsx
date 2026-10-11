import { ArrowUpRightIcon, BookOpenIcon, LifeBuoyIcon, MessageSquareWarningIcon } from 'lucide-react'
import { Link, useLocation } from 'react-router'
import { useCurrentUser } from '@/entities/auth'
import { useCurrentOrganization } from '@/entities/organization'
import { to } from '@/shared/config/paths'
import { DEMO_TZ } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { MOCK_BORDER } from '@/shared/mock/mock-border'
import { SectionCard } from '@/shared/ui/rb/Section'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Dialog, DialogBody, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/shadcn/dialog'
import { Label } from '@/shared/ui/shadcn/label'
import { Textarea } from '@/shared/ui/shadcn/textarea'

// Мок: статей помощи и ручки обращения в поддержку на бэке нет. Версия и время в обращении тоже макетные
const HELP_LINKS = [
  { id: 'max', title: 'Как подключить MAX и что туда приходит' },
  { id: 'tasks', title: 'Как отметить задачу и приложить фото' },
  { id: 'sync', title: 'Что делать, если площадка не отдаёт брони' },
]

// Обращение уходит с техническим контекстом (OPS-13), чтобы поддержка не переспрашивала, где и когда
const ReportDialog = () => {
  const { pathname } = useLocation()
  const { data: user } = useCurrentUser()
  const { organization } = useCurrentOrganization()
  const context = [
    ['Пользователь', String(user?.id ?? '')],
    ['Организация', String(organization.id)],
    ['Экран', pathname],
    ['Версия', '0.4.0'],
    ['Время', `8 окт, 09:40 ${DEMO_TZ}`],
  ]

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <MessageSquareWarningIcon /> Сообщить о проблеме
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="gap-2">
          <span className="mono-label text-smoke">Поддержка Rentybot</span>
          <DialogTitle className="section-heading text-heading-sm">Что пошло не так?</DialogTitle>
          <DialogDescription className="text-body-sm text-slate">Ответим в течение рабочего дня в MAX или на почту.</DialogDescription>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="report-text" className="text-body-sm font-medium">
              Опишите, что произошло
            </Label>
            <Textarea id="report-text" rows={4} placeholder="Например: не могу приложить фото к задаче, кнопка не нажимается" />
          </div>
          <div className="flex flex-col gap-2 rounded-3xl bg-mist p-4">
            <span className="mono-label text-smoke">Приложим автоматически</span>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
              {context.map(([label, value]) => (
                <div key={label} className="contents">
                  <dt className="text-caption text-smoke">{label}</dt>
                  <dd className="truncate font-mono text-caption">{value}</dd>
                </div>
              ))}
            </dl>
            <span className="text-caption text-smoke">Пароли и коды доступа к объектам не передаются.</span>
          </div>
        </DialogBody>
        <DialogFooter className="gap-2">
          <DialogClose render={<Button variant="ghost" />}>Отмена</DialogClose>
          <Button>Отправить</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export const HelpCard = () => {
  const { organization } = useCurrentOrganization()

  return (
    <SectionCard title="Помощь" action={<LifeBuoyIcon className="size-4 text-smoke" aria-hidden />} className={cn('shadow-card', MOCK_BORDER)}>
      <ul className="-mx-3 flex flex-col gap-1">
        {HELP_LINKS.map((item) => (
          <li key={item.id}>
            <Link
              to={to.help(String(organization.id))}
              className="flex items-center gap-3 rounded-3xl p-3 text-body-sm outline-none transition-colors hover:bg-mist focus-visible:ring-3 focus-visible:ring-ring/30"
            >
              <BookOpenIcon className="size-4 shrink-0 text-smoke" aria-hidden />
              <span className="flex-1">{item.title}</span>
              <ArrowUpRightIcon className="size-4 shrink-0 text-smoke" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex flex-col gap-3 border-t border-mist pt-4">
        <span className="text-body-sm text-slate">Не нашли ответ или что-то сломалось — напишите, мы увидим, на каком экране вы были.</span>
        <ReportDialog />
      </div>
    </SectionCard>
  )
}
