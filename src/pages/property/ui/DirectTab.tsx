import { ArrowUpRightIcon, CircleCheckIcon, CircleDashedIcon, GlobeIcon } from 'lucide-react'
import { Link } from 'react-router'
import { DEMO_OWNER_SLUG, to } from '@/shared/config/paths'
import { cn } from '@/shared/lib/utils'
import { SectionCard } from '@/shared/ui/rb/Section'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { CopyButton } from '@/shared/ui/shadcn/animate-ui/components/buttons/copy'
import { Input } from '@/shared/ui/shadcn/input'
import { Label } from '@/shared/ui/shadcn/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/shadcn/select'
import { ArchivePropertyDialog } from '@/widgets/property-actions/ArchivePropertyDialog'
import type { PropertyBrief } from '../PropertyPage'

// ── Макетные данные ─────────────────────────────────────────────────────────

type Terms = { price: string; minNights: string; prepay: string; deposit: string; cancel: string; requisites: string | null }

const TERMS: Record<string, Terms> = {
  ligovsky: { price: '4200', minNights: '2', prepay: '50', deposit: '3000', cancel: 'flex', requisites: 'sbp-anna' },
  neva: { price: '5500', minNights: '2', prepay: '50', deposit: '5000', cancel: 'moderate', requisites: 'sbp-anna' },
  moika: { price: '4600', minNights: '3', prepay: '30', deposit: '', cancel: 'moderate', requisites: null },
  repino: { price: '11500', minNights: '2', prepay: '50', deposit: '10000', cancel: 'strict', requisites: 'sbp-anna' },
}

const CANCEL = [
  { value: 'flex', label: 'Гибкие: бесплатно за 3 дня' },
  { value: 'moderate', label: 'Умеренные: бесплатно за 7 дней' },
  { value: 'strict', label: 'Строгие: предоплата не возвращается' },
]

const REQUISITES = [{ value: 'sbp-anna', label: 'СБП · Анна В. · Т-Банк ••• 4410' }]

type Check = { id: string; label: string; done: boolean; hint?: string; tab?: string }

// Список обязательного для публикации (§3): опубликовать неполную страницу нельзя
const checksFor = (property: PropertyBrief, terms: Terms): Check[] => [
  { id: 'title', label: 'Публичный заголовок', done: Boolean(property.publicTitle), hint: 'Сведения → публичный заголовок', tab: 'info' },
  { id: 'photos', label: 'Не меньше 3 фото', done: property.id !== 'moika', hint: 'загружено 1 из 3', tab: 'info' },
  { id: 'description', label: 'Описание для гостей', done: true },
  { id: 'price', label: 'Цена за ночь', done: Boolean(terms.price) },
  { id: 'cancel', label: 'Условия отмены', done: Boolean(terms.cancel) },
  { id: 'requisites', label: 'Реквизиты для перевода', done: Boolean(terms.requisites), hint: 'не выбраны' },
  { id: 'rules', label: 'Правила дома', done: true },
]

const Field = ({ id, label, hint, children }: { id: string; label: string; hint?: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-2">
    <Label htmlFor={id} className="text-body-sm font-medium">
      {label}
    </Label>
    {children}
    {hint && <span className="text-caption text-smoke">{hint}</span>}
  </div>
)

// ── Вкладка ─────────────────────────────────────────────────────────────────

export const DirectTab = ({ property, canPublish }: { property: PropertyBrief; canPublish: boolean }) => {
  const terms = TERMS[property.id] ?? TERMS.ligovsky
  const checks = checksFor(property, terms)
  const missing = checks.filter((check) => !check.done)
  const published = property.publicity === 'published'
  const publicUrl = `rentybot.ru/${DEMO_OWNER_SLUG}/${property.id}`

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[1fr_380px]">
      <SectionCard title="Условия бронирования" className="shadow-card">
        <div className="grid gap-5 md:grid-cols-2">
          <Field id="direct-price" label="Цена за ночь, ₽" hint="Базовая; цены по датам — в календаре">
            <Input id="direct-price" inputMode="numeric" defaultValue={terms.price} />
          </Field>
          <Field id="direct-min" label="Минимум ночей">
            <Input id="direct-min" type="number" min={1} defaultValue={terms.minNights} />
          </Field>
          <Field id="direct-prepay" label="Предоплата, %" hint="Остаток гость платит до заезда">
            <Input id="direct-prepay" type="number" min={0} max={100} defaultValue={terms.prepay} />
          </Field>
          <Field id="direct-deposit" label="Залог, ₽" hint={terms.deposit ? 'Возвращается после выезда' : 'Без залога'}>
            <Input id="direct-deposit" inputMode="numeric" defaultValue={terms.deposit} placeholder="0" />
          </Field>
          <Field id="direct-cancel" label="Условия отмены">
            <Select items={CANCEL} defaultValue={terms.cancel}>
              <SelectTrigger id="direct-cancel" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CANCEL.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field id="direct-requisites" label="Реквизиты для перевода" hint="Гость видит их только во время удержания">
            <Select items={REQUISITES} defaultValue={terms.requisites ?? undefined}>
              <SelectTrigger id="direct-requisites" className="w-full" aria-invalid={!terms.requisites || undefined}>
                <SelectValue placeholder="Не выбраны" />
              </SelectTrigger>
              <SelectContent>
                {REQUISITES.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <div className="mt-6 flex flex-col gap-1 rounded-3xl bg-mist p-4">
          <span className="mono-label text-smoke">Удержание дат</span>
          <span className="text-body-sm text-slate">
            Пока гость переводит предоплату, даты держатся столько, сколько задано в{' '}
            <Link to={to.settings('page')} className="text-foreground underline-offset-4 hover:underline">
              настройках страницы
            </Link>
            . Затем удержание истекает само.
          </span>
        </div>
        <Button className="mt-6 self-start shadow-control">Сохранить условия</Button>
      </SectionCard>

      <div className="flex flex-col gap-4 lg:sticky lg:top-24">
        {published ? (
          <section className="flex flex-col gap-5 rounded-card bg-foreground p-6 text-background shadow-card dark:bg-mist dark:text-foreground">
            <span className="mono-label inline-flex items-center gap-1.5 text-smoke">
              <GlobeIcon className="size-3" aria-hidden /> Опубликован с 2 окт
            </span>
            <span className="flex items-center gap-2 rounded-2xl bg-background/10 p-1 pl-4 dark:bg-foreground/5">
              <span className="flex-1 truncate font-mono text-body-sm">{publicUrl}</span>
              <CopyButton content={`https://${publicUrl}`} size="lg" className="rounded-xl bg-lime text-[#0a1217] hover:bg-lime/85" aria-label="Скопировать ссылку" />
            </span>
            <div className="flex flex-wrap gap-2">
              <Button variant="accent" size="sm" asChild>
                <Link to={to.hostProperty(property.id)}>
                  Открыть страницу <ArrowUpRightIcon />
                </Link>
              </Button>
              {canPublish && (
                <ArchivePropertyDialog
                  mode="unpublish"
                  property={property.name}
                  trigger={
                    <Button variant="ghost" size="sm" className="text-smoke hover:bg-background/10 hover:text-background dark:hover:bg-foreground/5 dark:hover:text-foreground">
                      Снять с публикации
                    </Button>
                  }
                />
              )}
            </div>
          </section>
        ) : (
          <section className="flex flex-col gap-4 rounded-card bg-card p-6 shadow-card">
            <span className="mono-label text-smoke">Публикация</span>
            <span className="text-subheading-lg font-medium">
              {missing.length > 0 ? `Не хватает ${missing.length} ${missing.length === 1 ? 'пункта' : 'пунктов'}` : 'Всё готово к публикации'}
            </span>
            <span className="text-body-sm text-slate">
              {missing.length > 0
                ? 'Объект появится на вашей странице, когда список ниже будет заполнен.'
                : 'После публикации объект появится на вашей странице, гости смогут отправлять заявки.'}
            </span>
            {canPublish ? (
              <Button className="self-start shadow-control" disabled={missing.length > 0}>
                <GlobeIcon /> Опубликовать
              </Button>
            ) : (
              <span className="text-caption text-smoke">Публикует владелец организации</span>
            )}
          </section>
        )}

        <SectionCard title="Готовность" count={`${checks.length - missing.length}/${checks.length}`} className="shadow-card">
          <ul className="flex flex-col gap-2.5">
            {checks.map((check) => (
              <li key={check.id} className="flex items-start gap-3">
                {check.done ? (
                  <CircleCheckIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
                ) : (
                  <CircleDashedIcon className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
                )}
                <span className="flex flex-col">
                  <span className={cn('text-body-sm', !check.done && 'font-medium')}>
                    {check.label}
                    <span className="sr-only">{check.done ? ' — готово' : ' — не заполнено'}</span>
                  </span>
                  {!check.done && check.hint && (
                    check.tab ? (
                      <Link to={to.property(property.id, check.tab)} className="text-caption text-smoke underline-offset-4 hover:text-foreground hover:underline">
                        {check.hint} →
                      </Link>
                    ) : (
                      <span className="text-caption text-smoke">{check.hint}</span>
                    )
                  )}
                </span>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>
    </div>
  )
}
