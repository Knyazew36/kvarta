import { useState } from 'react'
import { DoorOpenIcon, EyeOffIcon, KeyRoundIcon, LockIcon, type LucideIcon, MapPinIcon, PencilIcon, ScrollTextIcon, WifiIcon } from 'lucide-react'
import { DEMO_TZ } from '@/shared/lib/format'
import { SectionCard } from '@/shared/ui/rb/Section'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/shadcn/animate-ui/components/animate/tabs'
import type { PropertyBrief } from '../PropertyPage'

// ── Макетные данные ─────────────────────────────────────────────────────────

type Block = {
  id: string
  icon: LucideIcon
  title: string
  text: string
  // Чувствительное (код, пароль) выдаётся по условиям и не показывается в предпросмотре заранее
  secret?: { label: string; value: string }
  updated: string
}

const BLOCKS: Block[] = [
  { id: 'route', icon: MapPinIcon, title: 'Как добраться', text: 'От метро «Лиговский проспект» 4 минуты пешком. Вход со двора, арка справа от аптеки, 3 подъезд.', updated: '1 окт' },
  { id: 'access', icon: KeyRoundIcon, title: 'Доступ в квартиру', text: 'Ключи в ключнице слева от двери, 4 этаж. Домофон — код ниже, затем кнопка «В».', secret: { label: 'Код ключницы и домофона', value: '4721 · 14В' }, updated: '1 окт' },
  { id: 'wifi', icon: WifiIcon, title: 'Wi-Fi и техника', text: 'Сеть Volna_Ligovsky. Пульт от кондиционера в ящике под телевизором.', secret: { label: 'Пароль Wi-Fi', value: 'ligovsky-2026' }, updated: '28 сен' },
  { id: 'rules', icon: ScrollTextIcon, title: 'Правила дома', text: 'Без животных и вечеринок. Тишина с 23:00. Курение только на улице.', updated: '28 сен' },
  { id: 'checkout', icon: DoorOpenIcon, title: 'Выезд', text: 'Оставьте ключи в ключнице, закройте окна. Посуду мыть не нужно.', updated: '28 сен' },
]

type Moment = 'before' | 'day'

// ── Вкладка ─────────────────────────────────────────────────────────────────

export const InstructionsTab = ({ property }: { property: PropertyBrief }) => {
  const [moment, setMoment] = useState<Moment>('before')
  const opened = moment === 'day'
  const opensAt = `${String(Number(property.checkIn.slice(0, 2)) - 1).padStart(2, '0')}${property.checkIn.slice(2)}`

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[1fr_380px]">
      <div className="flex flex-col gap-4">
        <SectionCard title="Материалы" count={BLOCKS.length} className="shadow-card">
          <ul className="-mx-3 flex flex-col">
            {BLOCKS.map(({ id, icon: Icon, title, text, secret, updated }) => (
              <li key={id} className="flex gap-4 rounded-2xl p-3 transition-colors hover:bg-mist">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-mist">
                  <Icon className="size-4" aria-hidden />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-body-sm font-medium">{title}</span>
                    {secret && (
                      <span className="mono-label inline-flex items-center gap-1 rounded-full bg-foreground px-2 py-0.5 text-background">
                        <LockIcon className="size-3" aria-hidden /> чувствительное
                      </span>
                    )}
                  </span>
                  <span className="text-body-sm text-slate">{text}</span>
                  {secret && (
                    <span className="mono-label mt-1 text-smoke">
                      {secret.label}: <span className="tracking-[0.3em]">••••</span>
                    </span>
                  )}
                  <span className="mono-label text-smoke">изменено {updated}</span>
                </span>
                <Button variant="ghost" size="icon-sm" aria-label={`Изменить: ${title}`}>
                  <PencilIcon />
                </Button>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="Условия выдачи" className="shadow-card">
          <dl className="grid gap-5 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <dt className="mono-label text-smoke">Обычные материалы</dt>
              <dd className="text-body-sm">Сразу после подтверждения брони</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="mono-label text-smoke">Чувствительные</dt>
              <dd className="text-body-sm">
                За 1 час до заезда ({property.checkIn} {DEMO_TZ}), если оплата подтверждена
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="mono-label text-smoke">Закрываются</dt>
              <dd className="text-body-sm">В момент выезда ({property.checkOut} {DEMO_TZ}) или при отмене</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="mono-label text-smoke">Канал</dt>
              <dd className="text-body-sm">Страница брони гостя и сообщение в MAX</dd>
            </div>
          </dl>
        </SectionCard>
      </div>

      {/* Предпросмотр глазами гостя: видно, что код не уходит раньше времени */}
      <section className="flex flex-col gap-5 rounded-card bg-foreground p-6 text-background shadow-card lg:sticky lg:top-24 dark:bg-mist dark:text-foreground">
        <div className="flex items-center justify-between gap-3">
          <h2 className="section-heading text-subheading-lg">Глазами гостя</h2>
          <span className="mono-label text-smoke">предпросмотр</span>
        </div>
        <Tabs value={moment} onValueChange={(value) => setMoment(value as Moment)}>
          <TabsList aria-label="Момент предпросмотра" className="w-full bg-background/10 dark:bg-foreground/5">
            <TabsTrigger value="before" className="flex-1">
              За день до заезда
            </TabsTrigger>
            <TabsTrigger value="day" className="flex-1">
              За час до заезда
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <ol className="flex flex-col gap-4">
          {BLOCKS.map(({ id, title, secret }, index) => (
            <li key={id} className="flex items-start gap-3">
              <span className="mono-label mt-0.5 w-6 shrink-0 text-smoke tabular-nums">{String(index + 1).padStart(2, '0')}</span>
              <span className="flex min-w-0 flex-col gap-1">
                <span className="text-body-sm font-medium">{title}</span>
                {secret &&
                  (opened ? (
                    <span className="mono-label inline-flex w-fit items-center gap-1.5 rounded-full bg-lime px-2.5 py-1 text-[#0a1217]">
                      <KeyRoundIcon className="size-3" aria-hidden /> {secret.value}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-caption text-smoke">
                      <EyeOffIcon className="size-3" aria-hidden /> откроется за час до заезда, в {opensAt} {DEMO_TZ}
                    </span>
                  ))}
              </span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
