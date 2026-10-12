import { zodResolver } from '@hookform/resolvers/zod'
import { InfoIcon, RefreshCwIcon } from 'lucide-react'
import { useState } from 'react'
import { Controller, type UseFormReturn, useForm, useFormState, useWatch } from 'react-hook-form'
import {
  type InstructionTypeMeta,
  type InstructionValues,
  getInstructionChanges,
  getInstructionFormValues,
  instructionSchema,
  useCreateInstruction,
  useInstruction,
  useUpdateInstruction,
} from '@/entities/instruction'
import { getFieldErrors } from '@/shared/api/model/getFieldErrors'
import type { InstructionMetadata } from '@/shared/api/generated/models'
import { ErrorText } from '@/shared/ui/rb/ErrorText'
import { StateView } from '@/shared/ui/rb/StateView'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Switch } from '@/shared/ui/shadcn/animate-ui/components/radix/switch'
import { Input } from '@/shared/ui/shadcn/input'
import { Label } from '@/shared/ui/shadcn/label'
import { Sheet, SheetBody, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@/shared/ui/shadcn/sheet'
import { Spinner } from '@/shared/ui/shadcn/spinner'
import { Textarea } from '@/shared/ui/shadcn/textarea'

const FIELD_NAMES = ['title', 'content', 'sensitive', 'enabled'] as const

// Ошибки бэка по полям — под инпутами; остальное показывает общий тост
const applyFieldErrors = (error: unknown, setError: UseFormReturn<InstructionValues>['setError']) => {
  const fieldErrors = getFieldErrors(error)
  FIELD_NAMES.forEach((name) => fieldErrors[name]?.length && setError(name, { message: fieldErrors[name].join(', ') }))
}

// ── Поля ────────────────────────────────────────────────────────────────────

type InstructionFieldsProps = {
  form: UseFormReturn<InstructionValues>
  idPrefix: string
  meta: InstructionTypeMeta
  disabled?: boolean
}

const InstructionFields = ({ form, idPrefix, meta, disabled }: InstructionFieldsProps) => {
  const { register, control } = form
  // Подписка самого компонента: объект формы между рендерами тот же, и React Compiler не перерисовал бы поля при появлении ошибок
  const { errors } = useFormState({ control })
  const sensitive = useWatch({ control, name: 'sensitive' })
  const enabled = useWatch({ control, name: 'enabled' })

  return (
    <>
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${idPrefix}-title`} className="text-body-sm font-medium">
          Название
        </Label>
        <Input
          id={`${idPrefix}-title`}
          disabled={disabled}
          aria-invalid={!!errors.title || undefined}
          aria-describedby={errors.title ? `${idPrefix}-title-error` : undefined}
          {...register('title')}
        />
        <ErrorText id={`${idPrefix}-title-error`} errors={errors.title} />
        {!errors.title && <span className="text-caption text-smoke">Видно в списках и истории — не пишите сюда коды и пароли</span>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={`${idPrefix}-content`} className="text-body-sm font-medium">
          Текст для гостя
        </Label>
        <Textarea
          id={`${idPrefix}-content`}
          rows={10}
          placeholder={meta.hint}
          disabled={disabled}
          aria-invalid={!!errors.content || undefined}
          aria-describedby={errors.content ? `${idPrefix}-content-error` : undefined}
          {...register('content')}
        />
        <ErrorText id={`${idPrefix}-content-error`} errors={errors.content} />
        {/* {!errors.content && <span className="text-caption text-smoke">Обычный текст без разметки, до 10 000 символов. Хранится зашифрованным</span>} */}
      </div>

      {/* Одно из двух: инструкцию либо показывают гостям, либо она чувствительная. Выбрали одно — второе убираем */}
      {(sensitive || !enabled) && (
        <Controller
          control={control}
          name="sensitive"
          render={({ field }) => (
            <label htmlFor={`${idPrefix}-sensitive`} className="flex cursor-pointer items-start justify-between gap-4 rounded-3xl bg-mist p-4">
              <span className="flex flex-col gap-1">
                <span className="text-body-sm font-medium">Чувствительное</span>
                <span className="text-caption text-smoke">
                  Выдаётся только по условиям объекта: время, оплата, готовность
                </span>
                <ErrorText errors={errors.sensitive} />
              </span>
              <Switch id={`${idPrefix}-sensitive`} checked={field.value} onCheckedChange={field.onChange} disabled={disabled || meta.forcedSensitive} />
            </label>
          )}
        />
      )}

      {sensitive && (
        <div className="flex items-start gap-3 rounded-3xl border border-mist p-4">
          <InfoIcon className="mt-0.5 size-4 shrink-0 text-smoke" aria-hidden />
          <span className="text-caption text-slate">
            {meta.forcedSensitive &&
              'Доступ и Wi-Fi всегда чувствительные, отключить нельзя: здесь коды и пароли, гость не должен получить их до оплаты и времени заезда. '}
            Сейчас чувствительные инструкции гостю не выдаются совсем — передайте данные лично. Такая инструкция сохраняется скрытой от гостей.
          </span>
        </div>
      )}

      {!sensitive && (
        <Controller
          control={control}
          name="enabled"
          render={({ field }) => (
            <label htmlFor={`${idPrefix}-enabled`} className="flex cursor-pointer items-start justify-between gap-4 rounded-3xl bg-mist p-4">
              <span className="flex flex-col gap-1">
                <span className="text-body-sm font-medium">Показывать гостям</span>
                <span className="text-caption text-smoke">Выключенную инструкцию гость не видит. Удалить инструкцию нельзя — только выключить</span>
                <ErrorText errors={errors.enabled} />
              </span>
              <Switch id={`${idPrefix}-enabled`} checked={field.value} onCheckedChange={field.onChange} disabled={disabled} />
            </label>
          )}
        />
      )}
    </>
  )
}

// ── Создание ────────────────────────────────────────────────────────────────

type InstructionCreateSheetProps = {
  trigger: React.ReactElement
  organizationId: number
  propertyId: number
  meta: InstructionTypeMeta
}

export const InstructionCreateSheet = ({ trigger, organizationId, propertyId, meta }: InstructionCreateSheetProps) => {
  const [open, setOpen] = useState(false)
  const createInstruction = useCreateInstruction(organizationId, propertyId)
  const form = useForm<InstructionValues>({
    resolver: zodResolver(instructionSchema),
    defaultValues: { title: meta.label, content: '', sensitive: meta.forcedSensitive, enabled: !meta.forcedSensitive },
  })
  const formId = `instruction-create-${meta.type}`

  const submit = form.handleSubmit((values) => {
    createInstruction.mutate(
      { type: meta.type, ...values },
      { onSuccess: () => setOpen(false), onError: (error) => applyFieldErrors(error, form.setError) },
    )
  })

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) {
          form.reset()
          createInstruction.reset()
        }
      }}
    >
      <SheetTrigger render={trigger} />
      <SheetContent>
        <SheetHeader className="border-b border-mist">
          <span className="mono-label text-smoke">{meta.label}</span>
          <SheetTitle className="text-heading-sm">Новая инструкция</SheetTitle>
          <SheetDescription>Одна инструкция каждого типа на объект. Тип потом не меняется.</SheetDescription>
        </SheetHeader>

        <SheetBody className="pt-6">
          <form id={formId} className="flex flex-col gap-5" onSubmit={submit} noValidate>
            <InstructionFields form={form} idPrefix={formId} meta={meta} />
          </form>
        </SheetBody>

        <SheetFooter className="flex-row-reverse justify-start border-t border-mist">
          <Button type="submit" form={formId} className="shadow-control" disabled={createInstruction.isPending}>
            {createInstruction.isPending && <Spinner />} Создать
          </Button>
          <SheetClose render={<Button type="button" variant="ghost" />}>Отмена</SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

// ── Правка ──────────────────────────────────────────────────────────────────

type InstructionEditSheetProps = {
  trigger: React.ReactElement
  organizationId: number
  instruction: InstructionMetadata
  meta: InstructionTypeMeta
  // Архивный объект: текст открыт для чтения, править бэк не даёт (409)
  readOnly?: boolean
}

const EMPTY_VALUES: InstructionValues = { title: '', content: '', sensitive: false, enabled: true }

export const InstructionEditSheet = ({ trigger, organizationId, instruction, meta, readOnly }: InstructionEditSheetProps) => {
  const [open, setOpen] = useState(false)
  const propertyId = instruction.property_id
  // Текста в списке нет — грузим его, только когда форму открыли
  const { data: detail, isPending, isError, refetch, isRefetching } = useInstruction(organizationId, propertyId, instruction.id, { enabled: open })
  const updateInstruction = useUpdateInstruction(organizationId, propertyId, instruction.id)
  // values: после конфликта версий инструкция перечитывается, и форма получает свежие данные вместе с новой version
  const form = useForm<InstructionValues>({
    resolver: zodResolver(instructionSchema),
    values: detail ? getInstructionFormValues(detail) : EMPTY_VALUES,
  })
  const formId = `instruction-edit-${instruction.id}`

  const submit = form.handleSubmit((values) => {
    if (!detail) return

    const changes = getInstructionChanges(detail, values)
    // Ничего не поменяли — версию не создаём: иначе у гостей сбросятся отметки получения
    if (Object.keys(changes).length === 0) {
      setOpen(false)
      return
    }

    updateInstruction.mutate(
      { version: detail.version, ...changes },
      { onSuccess: () => setOpen(false), onError: (error) => applyFieldErrors(error, form.setError) },
    )
  })

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) {
          form.reset()
          updateInstruction.reset()
        }
      }}
    >
      <SheetTrigger render={trigger} />
      <SheetContent>
        <SheetHeader className="border-b border-mist">
          <span className="mono-label text-smoke">
            {meta.label}
          </span>
          <SheetTitle className="text-heading-sm">{readOnly ? instruction.title : 'Изменить инструкцию'}</SheetTitle>
          <SheetDescription>
            {readOnly
              ? 'Объект в архиве: инструкция доступна только для чтения.'
              : 'Сохранение создаёт новую версию: гостям нужно будет открыть и подтвердить её заново.'}
          </SheetDescription>
        </SheetHeader>

        <SheetBody className="pt-6">
          {isPending ? (
            <StateView state="loading" />
          ) : isError ? (
            <StateView
              state="error"
              error={{
                title: 'Инструкция не загрузилась',
                description: 'Проверьте соединение и повторите попытку.',
                action: (
                  <Button variant="outline" size="sm" disabled={isRefetching} onClick={() => refetch()}>
                    <RefreshCwIcon /> Повторить
                  </Button>
                ),
              }}
            />
          ) : (
            <form id={formId} className="flex flex-col gap-5" onSubmit={submit} noValidate>
              <InstructionFields form={form} idPrefix={formId} meta={meta} disabled={readOnly} />
            </form>
          )}
        </SheetBody>

        <SheetFooter className="flex-row-reverse justify-start border-t border-mist">
          {!readOnly && (
            <Button type="submit" form={formId} className="shadow-control" disabled={!detail || updateInstruction.isPending}>
              {updateInstruction.isPending && <Spinner />} Сохранить
            </Button>
          )}
          <SheetClose render={<Button type="button" variant="ghost" />}>{readOnly ? 'Закрыть' : 'Отмена'}</SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
