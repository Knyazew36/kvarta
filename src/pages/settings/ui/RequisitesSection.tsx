import { PencilIcon, PlusIcon } from 'lucide-react'
import { DEMO_TZ } from '@/shared/lib/format'
import { useDemoState } from '@/shared/mock/state'
import { type HistoryEntry, HistoryFeed } from '@/shared/ui/rb/HistoryFeed'
import { SectionCard } from '@/shared/ui/rb/Section'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { EditRequisitesDialog } from '@/widgets/settings-actions/EditRequisitesDialog'

// ── Макетные данные реквизитов ──────────────────────────────────────────────

type RequisitesSet = {
  id: string
  title: string
  phone: string
  phoneMasked: string
  bank: string
  recipient: string
  // Область применения: для каких объектов гости видят эти реквизиты
  scope: string[]
  activeHolds: number
}

const SETS: RequisitesSet[] = [
  {
    id: 'main',
    title: 'Основные',
    phone: '+7 (921) 555-14-08',
    phoneMasked: '+7 (921) •••-••-08',
    bank: 'Т-Банк',
    recipient: 'Анна Сергеевна В.',
    scope: ['Студия на Лиговском', 'Лофт у Невы', 'Апартаменты на Мойке'],
    activeHolds: 0,
  },
  {
    id: 'repino',
    title: 'Для дома в Репино',
    phone: '+7 (911) 302-40-77',
    phoneMasked: '+7 (911) •••-••-77',
    bank: 'Сбербанк',
    recipient: 'Сергей Павлович В.',
    scope: ['Дом в Репино'],
    activeHolds: 1,
  },
]

const HISTORY: HistoryEntry[] = [
  { id: 'h3', at: `1 окт, 12:40 ${DEMO_TZ}`, author: 'Анна Волкова', staff: true, text: 'Добавлены реквизиты «Для дома в Репино»: Сбербанк, •••-••-77', reason: 'подтверждено кодом' },
  { id: 'h2', at: `14 сен, 09:05 ${DEMO_TZ}`, author: 'Анна Волкова', staff: true, text: 'Основные: банк изменён с «Сбербанк» на «Т-Банк»', reason: 'подтверждено кодом' },
  { id: 'h1', at: `2 сен, 18:20 ${DEMO_TZ}`, author: 'Rentybot', system: true, text: 'Созданы основные реквизиты при первом шаге настройки' },
]

// ── Раздел ──────────────────────────────────────────────────────────────────

export const RequisitesSection = () => {
  const { state } = useDemoState()
  const sets = state === 'empty' ? [] : SETS

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[1fr_380px]">
      <div className="flex flex-col gap-4">
        {sets.length === 0 && (
          <div className="flex flex-col items-start gap-3 rounded-card bg-card p-6 shadow-card md:p-8">
            <span className="text-body font-medium">Реквизитов нет</span>
            <span className="max-w-md text-body-sm text-slate">Без них прямое бронирование не опубликовать: гостю некуда перевести предоплату.</span>
          </div>
        )}
        {sets.map((set) => (
          <article key={set.id} className="flex flex-col gap-5 rounded-card bg-card p-6 shadow-card md:p-7">
            <header className="flex items-start justify-between gap-3">
              <span className="flex flex-col gap-0.5">
                <span className="text-subheading-lg font-medium">{set.title}</span>
                <span className="text-caption text-smoke">Перевод по СБП</span>
              </span>
              <EditRequisitesDialog
                current={{ phone: set.phone, bank: set.bank, recipient: set.recipient }}
                activeHolds={set.activeHolds}
                trigger={
                  <Button variant="outline" size="sm" className="bg-canvas">
                    <PencilIcon /> Изменить
                  </Button>
                }
              />
            </header>
            {/* Номер замаскирован и здесь: страницу настроек могут видеть через плечо, полный — в форме изменения */}
            <dl className="grid gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-0.5">
                <dt className="text-caption text-smoke">Телефон</dt>
                <dd className="text-body-sm font-medium tabular-nums">{set.phoneMasked}</dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="text-caption text-smoke">Банк</dt>
                <dd className="text-body-sm font-medium">{set.bank}</dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="text-caption text-smoke">Получатель</dt>
                <dd className="text-body-sm font-medium">{set.recipient}</dd>
              </div>
            </dl>
            <div className="flex flex-col gap-2 border-t border-foreground/8 pt-4">
              <span className="text-caption text-smoke">Гости видят их для объектов</span>
              <span className="flex flex-wrap gap-1.5">
                {set.scope.map((item) => (
                  <span key={item} className="inline-flex h-7 items-center rounded-full bg-background px-3 text-caption">
                    {item}
                  </span>
                ))}
              </span>
              {set.activeHolds > 0 && <span className="text-caption text-smoke">Сейчас по ним идёт {set.activeHolds} удержание</span>}
            </div>
          </article>
        ))}
        <EditRequisitesDialog
          activeHolds={0}
          trigger={
            <Button variant="outline" className="self-start bg-canvas">
              <PlusIcon /> Добавить реквизиты
            </Button>
          }
        />
      </div>

      <SectionCard title="История изменений" count={HISTORY.length} className="shadow-card lg:sticky lg:top-24">
        <HistoryFeed entries={HISTORY} />
      </SectionCard>
    </div>
  )
}
