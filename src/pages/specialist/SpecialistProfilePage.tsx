import { useState } from 'react'
import { CameraIcon, CheckIcon, CircleAlertIcon, EyeOffIcon, HourglassIcon, MapPinIcon, MessageCircleIcon, PhoneIcon, SendIcon } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useSearchParams } from 'react-router'
import { cn } from '@/shared/lib/utils'
import { EASE } from '@/shared/ui/rb/motion-presets'
import { PersonAvatar } from '@/shared/ui/rb/PersonAvatar'
import { RatingLine } from '@/shared/ui/rb/Rating'
import { SectionCard } from '@/shared/ui/rb/Section'
import { CATEGORY_BY_VALUE, DISTRICT_LABEL, PILOT_CITY, PILOT_DISTRICTS, SERVICE_CATEGORIES, SERVICE_LABEL } from '@/shared/ui/rb/service-categories'
import { MODERATION_STATUS, type ModerationStatus, SPECIALIST_AVAILABILITY, withLabel } from '@/shared/ui/rb/status-presets'
import { StatusBadge, StatusFromMeta } from '@/shared/ui/rb/StatusBadge'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Checkbox } from '@/shared/ui/shadcn/animate-ui/components/radix/checkbox'
import { RadioGroup, RadioGroupItem } from '@/shared/ui/shadcn/animate-ui/components/radix/radio-group'
import { Switch } from '@/shared/ui/shadcn/animate-ui/components/radix/switch'
import { DateInput } from '@/shared/ui/shadcn/date-input'
import { Input } from '@/shared/ui/shadcn/input'
import { Label } from '@/shared/ui/shadcn/label'
import { Textarea } from '@/shared/ui/shadcn/textarea'
import { SPECIALIST_ME } from '@/widgets/specialist-shell/me'
import { SpecialistShell } from '@/widgets/specialist-shell/SpecialistShell'

// ── Макетные данные профиля ─────────────────────────────────────────────────

const PROFILE = {
  headline: 'Уборка между заездами с фотоотчётом, своё бельё',
  about: 'Работаю с посуточными квартирами шестой год. Убираю по чек-листу владельца, присылаю фото каждой комнаты. Есть свои комплекты белья и полотенец, стираю у себя.',
  experience: '6',
  price: 'от 1 800 ₽ за студию, от 2 600 ₽ за двушку',
  districts: ['central', 'admiralty'],
  offers: { cleaning: ['turnover', 'deep', 'linen-change'], linen: ['laundry', 'ironing'] } as Record<string, string[]>,
  rating: 4.8,
  reviews: 23,
}

// Отклонённое модератором — с причиной и тем, что исправить (CAT-18: решение фиксируется, а не молча)
const REJECT_REASON = 'На фото не видно лица, а в описании указан телефон. Контакты указываются только в разделе «Связь» — так они открываются по вашему согласию.'

type ContactMode = 'on_request' | 'public'

const MODERATION_VALUES = Object.keys(MODERATION_STATUS) as ModerationStatus[]

// ── Поля ────────────────────────────────────────────────────────────────────

const Field = ({ id, label, hint, children, className }: { id?: string; label: string; hint?: React.ReactNode; children: React.ReactNode; className?: string }) => (
  <div className={cn('flex flex-col gap-2', className)}>
    <Label htmlFor={id} className="text-body-sm font-medium">
      {label}
    </Label>
    {children}
    {hint && <span className="text-caption text-smoke">{hint}</span>}
  </div>
)

const Warning = ({ children }: { children: React.ReactNode }) => (
  <span className="flex items-start gap-1.5 text-caption text-destructive">
    <CircleAlertIcon className="mt-px size-3.5 shrink-0" aria-hidden /> {children}
  </span>
)

// ── Страница ────────────────────────────────────────────────────────────────

const SpecialistProfilePage = () => {
  const [params] = useSearchParams()
  const initialModeration = MODERATION_VALUES.find((value) => value === params.get('moderation')) ?? 'published'
  const [moderation, setModeration] = useState<ModerationStatus>(initialModeration)
  const [dirty, setDirty] = useState(false)
  const [headline, setHeadline] = useState(PROFILE.headline)
  const [districts, setDistricts] = useState<string[]>(PROFILE.districts)
  const [offers, setOffers] = useState<Record<string, string[]>>(PROFILE.offers)
  const [accepting, setAccepting] = useState(true)
  const [hidden, setHidden] = useState(false)
  const [mode, setMode] = useState<ContactMode>('on_request')

  const touch = () => setDirty(true)
  const toggleDistrict = (value: string) => {
    setDistricts((prev) => (prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]))
    touch()
  }
  const toggleCategory = (value: string, on: boolean) => {
    setOffers((prev) => {
      const next = { ...prev }
      if (on) next[value] = []
      else delete next[value]
      return next
    })
    touch()
  }
  const toggleService = (category: string, service: string, on: boolean) => {
    setOffers((prev) => ({ ...prev, [category]: on ? [...prev[category], service] : prev[category].filter((item) => item !== service) }))
    touch()
  }

  const categories = Object.keys(offers)
  const incomplete = categories.filter((category) => offers[category].length === 0)
  const invalid = districts.length === 0 || categories.length === 0 || incomplete.length > 0
  const availability = hidden ? SPECIALIST_AVAILABILITY.hidden : accepting ? SPECIALIST_AVAILABILITY.available : withLabel(SPECIALIST_AVAILABILITY.unavailable, 'Недоступен до 20 окт')

  return (
    <SpecialistShell>
      <div className="flex flex-col gap-8">
        <header className="flex flex-col gap-6">
          <p className="text-caption text-smoke">Кабинет специалиста · {PILOT_CITY}</p>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <h1 className="text-heading font-semibold tracking-[-0.03em] md:text-heading-lg">Мой профиль</h1>
            <StatusFromMeta meta={MODERATION_STATUS[moderation]} />
          </div>
          {moderation === 'pending' && (
            <p className="flex items-start gap-3 rounded-3xl bg-card p-4 text-body-sm text-slate shadow-control md:px-5">
              <HourglassIcon className="mt-0.5 size-4 shrink-0 text-foreground" aria-hidden />
              Изменения проверяет модератор — обычно до одного рабочего дня. В каталоге пока прежняя версия профиля.
            </p>
          )}
          {moderation === 'rejected' && (
            <div role="alert" className="flex flex-col gap-2 rounded-3xl bg-destructive/10 p-4 text-body-sm md:px-5 dark:bg-destructive/20">
              <span className="font-medium text-destructive">Профиль не прошёл модерацию и не виден в каталоге</span>
              <span className="text-slate">{REJECT_REASON}</span>
              <span className="text-caption text-smoke">Исправьте и сохраните — профиль снова уйдёт на проверку.</span>
            </div>
          )}
        </header>

        <div className="grid items-start gap-4 lg:grid-cols-[1fr_360px]">
          <form
            id="specialist-profile-form"
            className="flex min-w-0 flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault()
              if (invalid) return
              setDirty(false)
              // Текст и фото видят владельцы — после правки профиль снова проверяет модератор
              setModeration('pending')
            }}
          >
            <SectionCard title="О себе" className="shadow-card">
              <div className="flex flex-col gap-5">
                <div className="flex items-center gap-5">
                  <PersonAvatar name={SPECIALIST_ME.name} size="xl" />
                  <div className="flex flex-col items-start gap-1.5">
                    <Button type="button" variant="outline" size="sm" onClick={touch}>
                      <CameraIcon /> Сменить фото
                    </Button>
                    <span className="text-caption text-smoke">Лицо крупно, без логотипов и контактов на фото</span>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
                  <Field id="sp-name" label="Имя или название бригады">
                    <Input id="sp-name" defaultValue={SPECIALIST_ME.name} onChange={touch} />
                  </Field>
                  <Field id="sp-exp" label="Опыт, лет">
                    <Input id="sp-exp" type="number" min={0} max={60} defaultValue={PROFILE.experience} onChange={touch} />
                  </Field>
                </div>
                <Field id="sp-headline" label="Коротко о себе" hint={`${headline.length} из 80 — видно в карточке поиска`}>
                  <Input
                    id="sp-headline"
                    value={headline}
                    maxLength={80}
                    onChange={(event) => {
                      setHeadline(event.target.value)
                      touch()
                    }}
                  />
                </Field>
                <Field id="sp-about" label="Подробнее" hint="Как работаете, что берёте с собой. Телефон здесь не пишите — для него раздел «Связь».">
                  <Textarea id="sp-about" rows={4} maxLength={1000} defaultValue={PROFILE.about} onChange={touch} />
                </Field>
              </div>
            </SectionCard>

            <SectionCard title="Где работаю" className="shadow-card">
              <div className="flex flex-col gap-4">
                <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-foreground/10 px-4 py-2 text-body-sm text-slate">
                  <MapPinIcon className="size-4" aria-hidden /> {PILOT_CITY} — город пилота
                </span>
                <div role="group" aria-label="Районы" className="flex flex-wrap gap-2">
                  {PILOT_DISTRICTS.map((district) => {
                    const on = districts.includes(district.value)
                    return (
                      <button
                        key={district.value}
                        type="button"
                        aria-pressed={on}
                        onClick={() => toggleDistrict(district.value)}
                        className={cn(
                          'flex h-10 items-center gap-1.5 rounded-full px-4 text-body-sm outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/30',
                          on ? 'bg-foreground text-background' : 'bg-background hover:bg-mist',
                        )}
                      >
                        {on && <CheckIcon className="size-3.5" aria-hidden />}
                        {district.label}
                      </button>
                    )
                  })}
                </div>
                {districts.length === 0 && <Warning>Выберите хотя бы один район — без него профиль не найдут.</Warning>}
              </div>
            </SectionCard>

            {/* Несколько направлений в одном профиле, услуги — внутри своих направлений (CAT-07) */}
            <SectionCard title="Что делаю" count={`${categories.length} из ${SERVICE_CATEGORIES.length}`} className="shadow-card">
              <div className="flex flex-col gap-2">
                {SERVICE_CATEGORIES.map((category) => {
                  const on = category.value in offers
                  return (
                    <div key={category.value} className={cn('flex flex-col gap-3 rounded-3xl p-4 transition-colors', on ? 'bg-background' : 'hover:bg-background/60')}>
                      <label className="flex cursor-pointer items-center gap-3">
                        <Checkbox checked={on} onCheckedChange={(checked) => toggleCategory(category.value, checked === true)} />
                        <category.icon className="size-4 text-smoke" aria-hidden />
                        <span className="text-body-sm font-medium">{category.label}</span>
                      </label>
                      <AnimatePresence initial={false}>
                        {on && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3, ease: EASE }}
                            className="flex flex-col gap-2 overflow-hidden pl-8"
                          >
                            <div className="flex flex-wrap gap-x-5 gap-y-2">
                              {category.services.map((service) => (
                                <label key={service.value} className="flex cursor-pointer items-center gap-2 text-body-sm">
                                  <Checkbox
                                    size="sm"
                                    checked={offers[category.value].includes(service.value)}
                                    onCheckedChange={(checked) => toggleService(category.value, service.value, checked === true)}
                                  />
                                  {service.label}
                                </label>
                              ))}
                            </div>
                            {offers[category.value].length === 0 && <Warning>Отметьте услуги — направление без них не попадёт в поиск.</Warning>}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                })}
                {categories.length === 0 && <Warning>Выберите хотя бы одно направление.</Warning>}
              </div>
            </SectionCard>

            <SectionCard title="Стоимость" className="shadow-card">
              <Field id="sp-price" label="Ориентир для владельцев — необязательно" hint="Итог вы согласуете с владельцем напрямую, каталог цену не фиксирует.">
                <Input id="sp-price" defaultValue={PROFILE.price} maxLength={80} onChange={touch} />
              </Field>
            </SectionCard>

            <SectionCard title="Связь" className="shadow-card">
              <div className="flex flex-col gap-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field id="sp-phone" label="Телефон">
                    <div className="relative">
                      <PhoneIcon className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-smoke" aria-hidden />
                      <Input id="sp-phone" type="tel" defaultValue="+7 921 555-14-08" className="pl-10" onChange={touch} />
                    </div>
                  </Field>
                  <Field id="sp-tg" label="Telegram — необязательно">
                    <div className="relative">
                      <SendIcon className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-smoke" aria-hidden />
                      <Input id="sp-tg" placeholder="@имя" className="pl-10" onChange={touch} />
                    </div>
                  </Field>
                </div>
                {/* Подключённый MAX — канал, через который Rentybot передаёт первое обращение (CAT-09) */}
                <div className="flex items-center justify-between gap-4 rounded-3xl bg-background p-4">
                  <span className="flex items-center gap-3">
                    <MessageCircleIcon className="size-4 shrink-0 text-smoke" aria-hidden />
                    <span className="flex flex-col gap-0.5">
                      <span className="text-body-sm font-medium">MAX · @olga_clean</span>
                      <span className="text-caption text-smoke">Сюда приходят запросы и первые сообщения от владельцев</span>
                    </span>
                  </span>
                  <StatusBadge tone="success" size="sm" icon={CheckIcon}>
                    Подключён
                  </StatusBadge>
                </div>

                <fieldset className="flex flex-col gap-3">
                  <legend className="mb-3 text-body-sm font-medium">Кто видит контакты</legend>
                  <RadioGroup
                    value={mode}
                    onValueChange={(value) => {
                      setMode(value as ContactMode)
                      touch()
                    }}
                    className="grid gap-2 sm:grid-cols-2"
                  >
                    {(
                      [
                        { value: 'on_request', title: 'По запросу', text: 'Каждый раз решаю сам, кому и какие контакты открыть' },
                        { value: 'public', title: 'Все в каталоге', text: 'Видят владельцы с допуском к каталогу. Публично в интернете — нет' },
                      ] as const
                    ).map((item) => (
                      <label
                        key={item.value}
                        className={cn('flex cursor-pointer items-start gap-3 rounded-3xl p-4 ring-1 ring-mist transition-colors hover:bg-mist', mode === item.value && 'bg-mist ring-foreground')}
                      >
                        <RadioGroupItem value={item.value} className="mt-0.5" />
                        <span className="flex flex-col gap-0.5">
                          <span className="text-body-sm font-medium">
                            {item.title} {item.value === 'on_request' && <span className="font-normal text-smoke">· по умолчанию</span>}
                          </span>
                          <span className="text-caption text-smoke">{item.text}</span>
                        </span>
                      </label>
                    ))}
                  </RadioGroup>
                </fieldset>
              </div>
            </SectionCard>
          </form>

          <div className="flex flex-col gap-4 lg:sticky lg:top-28">
            {/* Приём обращений меняется сразу, без модерации: это не текст профиля, а состояние (CAT-08) */}
            <section className="flex flex-col gap-4 rounded-card bg-foreground p-6 text-background shadow-card dark:bg-mist dark:text-foreground">
              <h2 className="section-heading text-subheading-lg">Приём обращений</h2>
              <label htmlFor="sp-accepting" className="flex cursor-pointer items-start justify-between gap-4">
                <span className="flex flex-col gap-0.5">
                  <span className="text-body-sm font-medium">Принимаю обращения</span>
                  <span className="text-caption opacity-60">{accepting ? 'Владельцы могут писать и запрашивать контакты' : 'В профиле — «Временно недоступен»'}</span>
                </span>
                <Switch id="sp-accepting" checked={accepting} onCheckedChange={setAccepting} disabled={hidden} />
              </label>
              {!accepting && !hidden && (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="sp-until" className="text-caption opacity-60">
                    Вернусь
                  </Label>
                  <DateInput id="sp-until" defaultValue="2026-10-20" min="2026-10-09" className="bg-background text-foreground" />
                </div>
              )}
              <label htmlFor="sp-hidden" className="flex cursor-pointer items-start justify-between gap-4 border-t border-background/15 pt-4 dark:border-foreground/10">
                <span className="flex flex-col gap-0.5">
                  <span className="flex items-center gap-1.5 text-body-sm font-medium">
                    <EyeOffIcon className="size-3.5" aria-hidden /> Скрыть профиль
                  </span>
                  <span className="text-caption opacity-60">Пропадёт из поиска. Отзывы и история сохранятся</span>
                </span>
                <Switch id="sp-hidden" checked={hidden} onCheckedChange={setHidden} />
              </label>
            </section>

            <section className="flex flex-col gap-4 rounded-card bg-card p-5 shadow-card">
              <span className="mono-label text-smoke">Так вас видят в поиске</span>
              <div className={cn('flex flex-col gap-4 rounded-3xl bg-background p-4', hidden && 'opacity-50')}>
                <div className="flex items-start gap-3">
                  <PersonAvatar name={SPECIALIST_ME.name} />
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-body-sm font-medium">{SPECIALIST_ME.name}</span>
                    <span className="text-caption text-slate">{headline || 'Без описания'}</span>
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <StatusFromMeta meta={availability} size="sm" />
                  <RatingLine value={PROFILE.rating} count={PROFILE.reviews} size="sm" />
                </div>
                <ul className="flex flex-col gap-2">
                  {categories.map((category) => (
                    <li key={category} className="flex flex-col text-caption">
                      <span className="font-medium">{CATEGORY_BY_VALUE[category].label}</span>
                      <span className="text-slate">{offers[category].map((service) => SERVICE_LABEL[service]).join(' · ') || 'Услуги не выбраны'}</span>
                    </li>
                  ))}
                </ul>
                <span className="text-caption text-smoke">
                  {districts.map((district) => DISTRICT_LABEL[district]).join(', ') || 'Районы не выбраны'} · {mode === 'public' ? 'контакты открыты' : 'контакты по запросу'}
                </span>
              </div>
              {hidden && <span className="text-caption text-smoke">Профиль скрыт — в поиске его нет.</span>}
            </section>
          </div>
        </div>

        <AnimatePresence>
          {dirty && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ duration: 0.35, ease: EASE }}
              className="sticky bottom-4 z-10 flex flex-col gap-3 rounded-3xl bg-foreground p-3 pl-5 text-background shadow-card sm:flex-row sm:items-center sm:justify-between sm:rounded-full dark:bg-mist dark:text-foreground"
            >
              <span className="text-body-sm">{invalid ? 'Заполните районы и услуги, чтобы сохранить' : 'Профиль уйдёт на проверку модератору'}</span>
              <span className="flex gap-2">
                <Button type="button" variant="ghost" className="text-background hover:bg-background/10 hover:text-background dark:text-foreground dark:hover:bg-foreground/5" onClick={() => setDirty(false)}>
                  Отменить
                </Button>
                <Button type="submit" form="specialist-profile-form" variant="accent" disabled={invalid}>
                  Сохранить
                </Button>
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </SpecialistShell>
  )
}

export default SpecialistProfilePage
