import { useState } from 'react'
import { CalendarClockIcon, ImageIcon, ImagePlusIcon } from 'lucide-react'
import { DEMO_TZ, DEMO_TZ_FULL } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { SectionCard } from '@/shared/ui/rb/Section'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Switch } from '@/shared/ui/shadcn/animate-ui/components/radix/switch'
import { Input } from '@/shared/ui/shadcn/input'
import { Label } from '@/shared/ui/shadcn/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/shadcn/select'
import { Textarea } from '@/shared/ui/shadcn/textarea'
import type { PropertyBrief } from '../PropertyPage'

// ── Макетные данные ─────────────────────────────────────────────────────────

const PHOTOS = ['Комната', 'Кухня', 'Ванная', 'Вид из окна', 'Подъезд']

const TIMEZONES = [
  { value: 'msk', label: DEMO_TZ_FULL },
  { value: 'kgd', label: 'Europe/Kaliningrad, UTC+2' },
  { value: 'ekb', label: 'Asia/Yekaterinburg, UTC+5' },
]

// ── Поля ────────────────────────────────────────────────────────────────────

const Field = ({ id, label, hint, children, className }: { id: string; label: string; hint?: string; children: React.ReactNode; className?: string }) => (
  <div className={cn('flex flex-col gap-2', className)}>
    <Label htmlFor={id} className="text-body-sm font-medium">
      {label}
    </Label>
    {children}
    {hint && <span className="text-caption text-smoke">{hint}</span>}
  </div>
)

// ── Вкладка ─────────────────────────────────────────────────────────────────

export const InfoTab = ({ property }: { property: PropertyBrief }) => {
  const [checkIn, setCheckIn] = useState(property.checkIn)
  const [addressPublic, setAddressPublic] = useState(false)
  // Смена времени заезда задевает будущие события — показываем влияние до сохранения, а не после
  const timeChanged = checkIn !== property.checkIn

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[1fr_380px]">
      <div className="flex flex-col gap-4">
        <SectionCard title="Название и описание" className="shadow-card">
          <div className="grid gap-5 md:grid-cols-2">
            <Field id="info-name" label="Внутреннее название" hint="Видят только вы и команда">
              <Input id="info-name" defaultValue={property.name} />
            </Field>
            <Field id="info-title" label="Публичный заголовок" hint={property.publicTitle ? 'Так объект называется на вашей странице' : 'Нужен для публикации'}>
              <Input id="info-title" defaultValue={property.publicTitle} placeholder="Например, Студия у Невского" aria-invalid={!property.publicTitle || undefined} />
            </Field>
            <Field id="info-capacity" label="Вместимость, гостей">
              <Input id="info-capacity" type="number" min={1} defaultValue={property.capacity} />
            </Field>
            <Field id="info-description" label="Описание для гостей" className="md:col-span-2">
              <Textarea
                id="info-description"
                rows={4}
                defaultValue={property.publicTitle ? 'Светлая студия в 5 минутах от Московского вокзала. Двуспальная кровать, кухня, рабочее место у окна.' : ''}
                placeholder="Что важно знать гостю до брони"
              />
            </Field>
          </div>
        </SectionCard>

        <SectionCard title="Адрес" className="shadow-card">
          <div className="flex flex-col gap-5">
            <Field id="info-address" label="Полный адрес">
              <Input id="info-address" defaultValue={property.address} />
            </Field>
            {/* Точный адрес — чувствительная информация: по умолчанию гость узнаёт его только после подтверждения брони */}
            <label htmlFor="info-address-public" className="flex cursor-pointer items-start justify-between gap-4 rounded-3xl bg-mist p-4">
              <span className="flex flex-col gap-1">
                <span className="text-body-sm font-medium">Показывать точный адрес до брони</span>
                <span className="text-caption text-smoke">
                  {addressPublic ? 'Гость видит дом и квартиру на странице объекта' : 'До брони гость видит только район: «Лиговский проспект, у метро»'}
                </span>
              </span>
              <Switch id="info-address-public" checked={addressPublic} onCheckedChange={setAddressPublic} />
            </label>
          </div>
        </SectionCard>

        <SectionCard title="Фото" count={`${PHOTOS.length} из 20`} className="shadow-card">
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {PHOTOS.map((photo, index) => (
              <li key={photo} className={cn('relative flex aspect-[4/3] items-end overflow-hidden rounded-3xl bg-mist p-3', index === 0 && 'ring-2 ring-foreground')}>
                <ImageIcon className="absolute top-1/2 left-1/2 size-6 -translate-1/2 text-smoke" aria-hidden />
                <span className="relative text-caption text-slate">{photo}</span>
                {index === 0 && <span className="mono-label absolute top-3 left-3 rounded-full bg-foreground px-2 py-0.5 text-background">обложка</span>}
              </li>
            ))}
            <li>
              <button
                type="button"
                className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-foreground/20 text-body-sm text-slate outline-none transition-colors hover:bg-mist focus-visible:ring-3 focus-visible:ring-ring/30"
              >
                <ImagePlusIcon className="size-5" aria-hidden />
                Добавить
              </button>
            </li>
          </ul>
        </SectionCard>
      </div>

      <div className="flex flex-col gap-4 lg:sticky lg:top-24">
        <SectionCard title="Время объекта" className="shadow-card">
          <div className="flex flex-col gap-5">
            <Field id="info-tz" label="Часовой пояс" hint="В нём показываются все даты объекта: брони, задачи, инструкции">
              <Select items={TIMEZONES} defaultValue="msk">
                <SelectTrigger id="info-tz" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field id="info-checkin" label={`Заезд с, ${DEMO_TZ}`}>
                <Input id="info-checkin" type="time" value={checkIn} onChange={(event) => setCheckIn(event.target.value)} />
              </Field>
              <Field id="info-checkout" label={`Выезд до, ${DEMO_TZ}`}>
                <Input id="info-checkout" type="time" defaultValue={property.checkOut} />
              </Field>
            </div>
            <div className={cn('flex items-start gap-3 rounded-3xl p-4 transition-colors', timeChanged ? 'bg-foreground text-background dark:bg-mist dark:text-foreground' : 'bg-mist')}>
              <CalendarClockIcon className={cn('mt-0.5 size-4 shrink-0', timeChanged ? 'text-lime' : 'text-smoke')} aria-hidden />
              <span className={cn('text-body-sm', timeChanged ? '' : 'text-slate')}>
                {timeChanged
                  ? `Новое время применится к 3 будущим броням и сдвинет 4 задачи подготовки. Гости с подтверждёнными бронями получат уведомление; бронь на сегодня не изменится.`
                  : 'Измените время, чтобы увидеть, какие брони и задачи это затронет.'}
              </span>
            </div>
          </div>
        </SectionCard>
        <Button className="self-start shadow-control lg:self-stretch">
          Сохранить изменения
        </Button>
      </div>
    </div>
  )
}
