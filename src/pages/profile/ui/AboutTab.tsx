import { useState } from 'react'
import { ImagePlusIcon, MonitorIcon, MoonIcon, SunIcon, Trash2Icon } from 'lucide-react'
import { useTheme } from 'next-themes'
import { DEMO_TZ_FULL } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { PersonAvatar } from '@/shared/ui/rb/PersonAvatar'
import { SectionCard } from '@/shared/ui/rb/Section'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Input } from '@/shared/ui/shadcn/input'
import { Label } from '@/shared/ui/shadcn/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/shadcn/select'
import { ToggleGroup, ToggleGroupItem } from '@/shared/ui/shadcn/toggle-group'
import type { ProfileBrief } from '../ProfilePage'

// ── Макетные данные ─────────────────────────────────────────────────────────

const TIMEZONES = [
  { value: 'msk', label: DEMO_TZ_FULL },
  { value: 'kgd', label: 'Europe/Kaliningrad, UTC+2' },
  { value: 'ekb', label: 'Asia/Yekaterinburg, UTC+5' },
  { value: 'nsk', label: 'Asia/Novosibirsk, UTC+7' },
]

const LANGUAGES = [{ value: 'ru', label: 'Русский' }]

const THEMES = [
  { value: 'light', label: 'Светлая', icon: SunIcon },
  { value: 'dark', label: 'Тёмная', icon: MoonIcon },
  { value: 'system', label: 'Как в системе', icon: MonitorIcon },
] as const

// ── Поля ────────────────────────────────────────────────────────────────────

const Field = ({ id, label, hint, children, className }: { id: string; label: string; hint?: React.ReactNode; children: React.ReactNode; className?: string }) => (
  <div className={cn('flex flex-col gap-2', className)}>
    <Label htmlFor={id} className="text-body-sm font-medium">
      {label}
    </Label>
    {children}
    {hint && <span className="text-caption text-smoke">{hint}</span>}
  </div>
)

// ── Вкладка ─────────────────────────────────────────────────────────────────

export const AboutTab = ({ profile }: { profile: ProfileBrief }) => {
  const initial = { firstName: profile.firstName, lastName: profile.lastName, displayName: profile.displayName }
  const [form, setForm] = useState(initial)
  const { theme = 'system', setTheme } = useTheme()
  const dirty = form.firstName !== initial.firstName || form.lastName !== initial.lastName || form.displayName !== initial.displayName
  const patch = (field: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [field]: event.target.value })

  // Пустое короткое имя — подставляем «Имя Ф.»: так человек сразу видит, как его подпишут, а не пустоту
  const shown = form.displayName || [form.firstName, form.lastName && `${form.lastName[0]}.`].filter(Boolean).join(' ')
  const fullName = `${form.firstName} ${form.lastName}`.trim()

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[1fr_380px]">
      <div className="flex flex-col gap-4">
        <SectionCard title="Как вас зовут" className="shadow-card">
          <div className="grid gap-5 md:grid-cols-2">
            <Field id="about-first" label="Имя" hint={!form.firstName ? 'Обязательно: без имени в задачах стоит номер телефона' : undefined}>
              <Input id="about-first" value={form.firstName} onChange={patch('firstName')} placeholder="Например, Марина" aria-invalid={!form.firstName || undefined} />
            </Field>
            <Field id="about-last" label="Фамилия">
              <Input id="about-last" value={form.lastName} onChange={patch('lastName')} placeholder="Необязательно" />
            </Field>
            <Field
              id="about-display"
              label="Короткое имя"
              hint="Видят коллеги в задачах и гости в сообщениях о брони. Полное имя — только команда"
              className="md:col-span-2"
            >
              <Input id="about-display" value={form.displayName} onChange={patch('displayName')} placeholder={shown || 'Например, Марина С.'} />
            </Field>
          </div>

          {/* Предпросмотр подписи: одно поле влияет на два контура, команду и гостей */}
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-2 rounded-3xl bg-mist p-4">
              <span className="mono-label text-smoke">В задаче</span>
              <span className="flex items-center gap-2 text-body-sm">
                <span className="text-slate">Исполнитель:</span>
                <PersonAvatar name={fullName || '?'} size="xs" />
                <span className={cn('font-medium', !shown && 'text-smoke')}>{shown || profile.phone}</span>
              </span>
            </div>
            <div className="flex flex-col gap-2 rounded-3xl bg-mist p-4">
              <span className="mono-label text-smoke">Гостю</span>
              <span className="text-body-sm">
                {shown ? (
                  <>
                    «Здравствуйте! Я <span className="font-medium">{shown}</span>, встречу вас в 14:00»
                  </>
                ) : (
                  <span className="text-smoke">Гость увидит «Представитель владельца»</span>
                )}
              </span>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Фото" className="shadow-card">
          <div className="flex flex-wrap items-center gap-5">
            <PersonAvatar name={fullName || '?'} size="xl" tone="accent" />
            <div className="flex flex-col gap-3">
              <span className="text-body-sm text-slate">Фото видят команда и гости в карточке брони. Без фото — инициалы.</span>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm">
                  <ImagePlusIcon /> Загрузить
                </Button>
                <Button variant="ghost" size="sm" disabled>
                  <Trash2Icon /> Удалить
                </Button>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="flex flex-col gap-4 lg:sticky lg:top-24">
        <SectionCard title="Время и язык" className="shadow-card">
          <div className="flex flex-col gap-5">
            <Field id="about-tz" label="Ваш часовой пояс" hint="Для сводки и тихих часов. Сроки задач и брони показываются в поясе объекта">
              <Select items={TIMEZONES} defaultValue="msk">
                <SelectTrigger id="about-tz" className="w-full">
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
            <Field id="about-lang" label="Язык интерфейса" hint="Другие языки появятся позже">
              <Select items={LANGUAGES} defaultValue="ru" disabled>
                <SelectTrigger id="about-lang" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
        </SectionCard>

        {/* Тема дублирует меню в шапке: на мобильном меню профиля короткое, а здесь её ищут в первую очередь */}
        <SectionCard title="Оформление" className="shadow-card">
          <ToggleGroup
            value={[theme]}
            onValueChange={(value) => value[0] && setTheme(value[0] as string)}
            aria-label="Тема оформления"
            className="grid w-full grid-cols-3 gap-2"
          >
            {THEMES.map(({ value, label, icon: Icon }) => (
              <ToggleGroupItem key={value} value={value} className="h-auto flex-col gap-2 rounded-3xl bg-mist py-4 text-caption">
                <Icon className="size-5" aria-hidden />
                {label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </SectionCard>
      </div>

      {/* Панель сохранения появляется только при правках: тема и пояс сохраняются сразу, имя — явно */}
      {dirty && (
        <div className="sticky bottom-24 z-10 flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-card p-3 pl-5 shadow-card ring-1 ring-foreground/10 md:bottom-4 lg:col-span-2">
          <span className="text-body-sm text-slate">Имя изменено — сохраните, чтобы его увидели команда и гости</span>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setForm(initial)}>
              Отменить
            </Button>
            <Button size="sm" className="shadow-control" disabled={!form.firstName}>
              Сохранить
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
