import { useState } from 'react'
import { ArrowUpRightIcon } from 'lucide-react'
import { Link } from 'react-router'
import { DEMO_OWNER_SLUG, to } from '@/shared/config/paths'
import { formatMoney } from '@/shared/lib/format'
import { SectionCard } from '@/shared/ui/rb/Section'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { CopyButton } from '@/shared/ui/shadcn/animate-ui/components/buttons/copy'
import { Switch } from '@/shared/ui/shadcn/animate-ui/components/radix/switch'
import { Input } from '@/shared/ui/shadcn/input'
import { Label } from '@/shared/ui/shadcn/label'
import { Textarea } from '@/shared/ui/shadcn/textarea'
import { PhotoTile } from '@/widgets/guest-shell/GuestShell'

// ── Макетные данные страницы владельца ──────────────────────────────────────

type Listing = { id: string; title: string; price: number; published: boolean; ready: boolean; tone: number }

const LISTINGS: Listing[] = [
  { id: 'ligovsky', title: 'Студия у Московского вокзала', price: 4200, published: true, ready: true, tone: 0 },
  { id: 'neva', title: 'Лофт с видом на Неву', price: 5500, published: true, ready: true, tone: 2 },
  { id: 'moika', title: 'Апартаменты на Мойке', price: 4600, published: false, ready: false, tone: 1 },
  { id: 'repino', title: 'Дом у залива в Репино', price: 11500, published: false, ready: true, tone: 3 },
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

// ── Раздел ──────────────────────────────────────────────────────────────────

export const PageSection = () => {
  const [name, setName] = useState('Анна Волкова')
  const [about, setAbout] = useState('Сдаю свои квартиры сама и отвечаю обычно за 15 минут. Бронь напрямую — без комиссии площадок.')
  const [published, setPublished] = useState(() => Object.fromEntries(LISTINGS.map((item) => [item.id, item.published])))
  const visible = LISTINGS.filter((item) => published[item.id])
  const url = `rentybot.ru/${DEMO_OWNER_SLUG}`

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[1fr_360px]">
      <div className="flex flex-col gap-4">
        <SectionCard title="Ссылка" className="shadow-card">
          {/* Ссылка стабильная: её уже разослали гостям и разместили в профилях — смена ломает все старые */}
          <div className="flex items-center gap-2 rounded-2xl bg-background p-1.5 pl-4">
            <span className="flex-1 truncate font-mono text-body-sm">{url}</span>
            <CopyButton content={`https://${url}`} variant="ghost" size="lg" className="rounded-xl" aria-label="Скопировать ссылку" />
            <Button variant="outline" size="sm" className="bg-canvas" asChild>
              <Link to={to.host()}>
                Открыть <ArrowUpRightIcon />
              </Link>
            </Button>
          </div>
          <span className="mt-3 text-caption text-smoke">Ссылка не меняется при переименовании — старые ссылки у гостей продолжат работать.</span>
        </SectionCard>

        <SectionCard title="Как вас видят гости" className="shadow-card">
          <div className="flex flex-col gap-5">
            <Field id="page-name" label="Имя на странице">
              <Input id="page-name" value={name} onChange={(event) => setName(event.target.value)} />
            </Field>
            <Field id="page-about" label="О себе" hint={`${about.length} из 280 знаков`}>
              <Textarea id="page-about" rows={3} maxLength={280} value={about} onChange={(event) => setAbout(event.target.value)} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="page-contact" label="Контакт для гостей" hint="Видят на странице и в брони">
                <Input id="page-contact" defaultValue="MAX · @anna_volna" />
              </Field>
              <Field id="page-hours" label="Отвечаю">
                <Input id="page-hours" defaultValue="с 9:00 до 22:00" />
              </Field>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Объекты на странице" count={`${visible.length} из ${LISTINGS.length}`} className="shadow-card">
          <ul className="flex flex-col">
            {LISTINGS.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-4 border-t border-foreground/8 py-3.5 first:border-t-0">
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-body-sm font-medium">{item.title}</span>
                  {item.ready ? (
                    <span className="text-caption text-smoke">{formatMoney(item.price)} за ночь</span>
                  ) : (
                    <Link to={to.property(item.id, 'direct')} className="text-caption text-smoke underline-offset-4 hover:text-foreground hover:underline">
                      не готов к публикации — заполнить →
                    </Link>
                  )}
                </span>
                <Switch
                  checked={published[item.id]}
                  disabled={!item.ready}
                  onCheckedChange={(checked) => setPublished((prev) => ({ ...prev, [item.id]: checked }))}
                  aria-label={`Показывать на странице: ${item.title}`}
                />
              </li>
            ))}
          </ul>
        </SectionCard>
        <Button className="self-start shadow-control">Сохранить страницу</Button>
      </div>

      {/* Предпросмотр в рамке телефона: гости открывают страницу почти всегда с мобильного (§5) */}
      <aside className="flex flex-col items-center gap-3 lg:sticky lg:top-24">
        <span className="text-caption text-smoke">Предпросмотр · обновляется при вводе</span>
        <div className="w-full max-w-[320px] rounded-[44px] bg-foreground p-2.5 shadow-card dark:bg-mist">
          <div className="flex h-[560px] flex-col gap-4 overflow-hidden rounded-[36px] bg-background p-4">
            <span className="mx-auto mt-1 h-1.5 w-16 rounded-full bg-mist" aria-hidden />
            <span className="mx-auto flex items-center gap-2 rounded-full bg-card px-2 py-1">
              <span className="flex size-6 items-center justify-center rounded-full bg-foreground text-[9px] text-background">
                {name
                  .split(' ')
                  .map((part) => part[0])
                  .join('')
                  .slice(0, 2)}
              </span>
              <span className="text-caption">{name || 'Без имени'}</span>
            </span>
            <span className="brand-display text-center text-[30px]">{name || 'Без имени'}</span>
            <span className="line-clamp-3 text-center text-caption text-slate">{about}</span>
            <div className="flex flex-col gap-3">
              {visible.length === 0 ? (
                <span className="rounded-2xl bg-card p-4 text-center text-caption text-slate">Нет опубликованных объектов — гости увидят только контакт.</span>
              ) : (
                visible.map((item) => (
                  <span key={item.id} className="flex flex-col gap-1.5">
                    <PhotoTile label={item.title} tone={item.tone} className="aspect-[16/9] rounded-2xl" />
                    <span className="flex justify-between gap-2 text-caption">
                      <span className="truncate font-medium">{item.title}</span>
                      <span className="shrink-0 text-smoke">{formatMoney(item.price)}</span>
                    </span>
                  </span>
                ))
              )}
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}
