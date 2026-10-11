import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowUpRightIcon, MoonStarIcon } from 'lucide-react'
import { useMemo } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { Link } from 'react-router'
import {
  getBrowserTimezone,
  getTimezoneLabel,
  getTimezoneOptions,
  type NotificationSettingsValues,
  notificationSettingsSchema,
  useUpdateNotificationSettings,
} from '@/entities/notification'
import { isEmployee, useCurrentOrganization } from '@/entities/organization'
import type { NotificationSettings } from '@/shared/api/generated/models'
import { getFieldErrors } from '@/shared/api/model/getFieldErrors'
import { to } from '@/shared/config/paths'
import { ErrorText } from '@/shared/ui/rb/ErrorText'
import { SectionCard } from '@/shared/ui/rb/Section'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Input } from '@/shared/ui/shadcn/input'
import { Label } from '@/shared/ui/shadcn/label'
import { Spinner } from '@/shared/ui/shadcn/spinner'
import { MaxCard } from './MaxCard'
import { NotificationTypes } from './NotificationTypes'
import { QuietHoursMock } from './QuietHoursMock'
import { RepeatRules } from './RepeatRules'
import { SimpleSelect } from './SimpleSelect'
import { SwitchRow } from './SwitchRow'

const FORM_ID = 'ntf-settings'

// Группы, которые бэк включает и выключает целиком
const GROUPS = [
  { name: 'events_enabled', title: 'События по задачам', hint: 'Назначение, отчёт на проверку, возврат, приёмка, отмена' },
  { name: 'reminders_enabled', title: 'Напоминания о сроках', hint: 'За час до срока и при просрочке — через 24, 48 и 72 часа' },
  { name: 'escalation_enabled', title: 'Просрочка моих поручений', hint: 'Если исполнитель не уложился в срок — один раз, через сутки' },
] as const

// Настройки уведомлений текущего пользователя — общие для всех его организаций
export const NotificationSettingsForm = ({ settings }: { settings: NotificationSettings }) => {
  const { organization, role } = useCurrentOrganization()
  const updateSettings = useUpdateNotificationSettings()
  // Пока пояс не сохранён, бэк ничего не публикует: предлагаем пояс браузера, но сохранить его должен сам человек
  const timezoneSaved = settings.timezone !== null
  const values = useMemo<NotificationSettingsValues>(() => {
    const { version: _version, timezone, ...rest } = settings
    return { ...rest, timezone: timezone ?? getBrowserTimezone() }
  }, [settings])

  const {
    control,
    register,
    handleSubmit,
    setError,
    formState: { errors, isDirty, dirtyFields },
  } = useForm<NotificationSettingsValues>({ resolver: zodResolver(notificationSettingsSchema), values })

  const [timezone, summaryEnabled] = useWatch({ control, name: ['timezone', 'summary_enabled'] })
  const timezoneLabel = getTimezoneLabel(timezone)

  const submit = handleSubmit((next) => {
    // Бэк ждёт только изменённые поля и версию; при первой настройке пояс обязателен
    const changed = Object.fromEntries(Object.entries(next).filter(([name]) => dirtyFields[name as keyof NotificationSettingsValues]))

    updateSettings.mutate(
      { ...changed, ...(!timezoneSaved && { timezone: next.timezone }), version: settings.version },
      {
        onError: (error) => {
          // Ошибки бэка по полю — под тем же инпутом; остальное показывает общий тост
          for (const [name, messages] of Object.entries(getFieldErrors(error))) {
            if (name in next) setError(name as keyof NotificationSettingsValues, { message: messages.join(', ') })
          }
        },
      },
    )
  })

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[1fr_380px]">
      {/* Форма пустая, поля привязаны к ней через react-hook-form, кнопка — через form: так моковые блоки с кнопками и диалогами не попадают в submit */}
      <form id={FORM_ID} onSubmit={submit} noValidate hidden />

      <div className="flex flex-col gap-4">
        <MaxCard />

        <SectionCard title="Что присылать" className="shadow-card">
          <div className="flex flex-col gap-1">
            {GROUPS.map((group) => (
              <Controller
                key={group.name}
                control={control}
                name={group.name}
                render={({ field }) => (
                  <SwitchRow id={`ntf-${group.name}`} title={group.title} hint={group.hint} checked={field.value} onCheckedChange={field.onChange} className="-mx-3" />
                )}
              />
            ))}
          </div>
        </SectionCard>

        <NotificationTypes />
      </div>

      <div className="flex flex-col gap-4 lg:sticky lg:top-24">
        <SectionCard title="Часовой пояс" className="shadow-card">
          <div className="flex flex-col gap-2">
            <Label htmlFor="ntf-timezone" className="text-body-sm font-medium">
              По нему считаются сводка и тихие часы
            </Label>
            <Controller
              control={control}
              name="timezone"
              render={({ field }) => (
                <SimpleSelect
                  id="ntf-timezone"
                  items={getTimezoneOptions(getBrowserTimezone(), settings.timezone)}
                  value={field.value}
                  onValueChange={field.onChange}
                  invalid={!!errors.timezone}
                />
              )}
            />
            <ErrorText errors={errors.timezone} />
            {!timezoneSaved && <span className="text-caption text-smoke">Пока пояс не сохранён, уведомления не приходят</span>}
          </div>
        </SectionCard>

        <SectionCard title="Сводка" className="shadow-card">
          <div className="flex flex-col gap-4">
            <Controller
              control={control}
              name="summary_enabled"
              render={({ field }) => (
                <SwitchRow
                  id="ntf-digest"
                  title="Утренняя сводка"
                  hint="Задачи на день одним сообщением"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="-mx-3"
                />
              )}
            />
            {summaryEnabled && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="ntf-digest-time" className="text-body-sm font-medium">
                  Время сводки, {timezoneLabel}
                </Label>
                <Input id="ntf-digest-time" type="time" form={FORM_ID} aria-invalid={!!errors.summary_time || undefined} {...register('summary_time')} />
                <ErrorText errors={errors.summary_time} />
              </div>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Тихие часы" action={<MoonStarIcon className="size-4 text-smoke" aria-hidden />} className="shadow-card">
          <div className="flex flex-col gap-4">
            <span className="text-caption text-smoke">В это время уведомления не приходят и ждут конца тихих часов. {timezoneLabel}</span>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="ntf-quiet-from" className="text-body-sm font-medium">
                  С
                </Label>
                <Input id="ntf-quiet-from" type="time" form={FORM_ID} aria-invalid={!!errors.quiet_start || undefined} {...register('quiet_start')} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="ntf-quiet-to" className="text-body-sm font-medium">
                  До
                </Label>
                <Input id="ntf-quiet-to" type="time" form={FORM_ID} aria-invalid={!!errors.quiet_end || undefined} {...register('quiet_end')} />
              </div>
            </div>
            <ErrorText errors={[errors.quiet_start, errors.quiet_end]} />
            <QuietHoursMock />
          </div>
        </SectionCard>

        <RepeatRules />

        {/* Личные настройки и правила организации разведены: здесь — как получаю я, там — кому что уходит */}
        {!isEmployee(role) && (
          <Link
            to={to.settings('notifications', String(organization.id))}
            className="flex items-center gap-3 rounded-3xl bg-card px-5 py-4 shadow-card outline-none transition-colors hover:bg-mist focus-visible:ring-3 focus-visible:ring-ring/30"
          >
            <span className="flex flex-1 flex-col gap-0.5">
              <span className="text-body-sm font-medium">Правила организации</span>
              <span className="text-caption text-smoke">Кому из команды что уходит и эскалация</span>
            </span>
            <ArrowUpRightIcon className="size-4 shrink-0 text-smoke" aria-hidden />
          </Link>
        )}

        <Button type="submit" form={FORM_ID} disabled={(!isDirty && timezoneSaved) || updateSettings.isPending} className="self-start shadow-control lg:self-stretch">
          {updateSettings.isPending && <Spinner />} Сохранить настройки
        </Button>
      </div>
    </div>
  )
}
