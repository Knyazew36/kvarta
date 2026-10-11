import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import {
  type InstructionPolicyInput,
  type InstructionPolicyValues,
  formatOpeningOffset,
  getPolicyFormValues,
  instructionPolicySchema,
  OFFSET_UNITS,
  useUpdateInstructionPolicy,
} from '@/entities/instruction'
import { getFieldErrors } from '@/shared/api/model/getFieldErrors'
import type { InstructionPolicy } from '@/shared/api/generated/models'
import { cn } from '@/shared/lib/utils'
import { DeviationNote } from '@/shared/mock/DeviationNote'
import { MOCK_BORDER } from '@/shared/mock/mock-border'
import { ErrorText } from '@/shared/ui/rb/ErrorText'
import { MetaItem, SectionCard } from '@/shared/ui/rb/Section'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Switch } from '@/shared/ui/shadcn/animate-ui/components/radix/switch'
import { Input } from '@/shared/ui/shadcn/input'
import { Label } from '@/shared/ui/shadcn/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/shadcn/select'
import { Spinner } from '@/shared/ui/shadcn/spinner'

const DIRECTIONS = [
  { value: 'before', label: 'до заезда' },
  { value: 'after', label: 'после заезда' },
]

type InstructionPolicyCardProps = {
  organizationId: number
  propertyId: number
  policy: InstructionPolicy
  readOnly: boolean
}

export const InstructionPolicyCard = ({ organizationId, propertyId, policy, readOnly }: InstructionPolicyCardProps) => {
  const updateOffset = useUpdateInstructionPolicy(organizationId, propertyId)
  // Переключатель готовности сохраняется сразу, без кнопки: отдельная мутация, чтобы спиннер «Сохранить» не крутился из-за него
  const updateReady = useUpdateInstructionPolicy(organizationId, propertyId)
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isDirty },
    // values: форма подхватывает ответ бэка после сохранения и свежую версию после конфликта
  } = useForm<InstructionPolicyInput, unknown, InstructionPolicyValues>({
    resolver: zodResolver(instructionPolicySchema),
    values: getPolicyFormValues(policy),
  })

  const submit = handleSubmit((values) => {
    updateOffset.mutate(
      { version: policy.version, ...values },
      {
        onError: (error) => {
          const fieldErrors = getFieldErrors(error)
          if (fieldErrors.opening_offset_minutes?.length) setError('amount', { message: fieldErrors.opening_offset_minutes.join(', ') })
        },
      },
    )
  })

  return (
    <SectionCard title="Условия выдачи" className="shadow-card">
      <div className="flex flex-col gap-5">
        <dl className="grid gap-5 sm:grid-cols-2">
          <MetaItem label="Обычные материалы">Сразу после подтверждения гостя командой</MetaItem>
          <MetaItem label="Закрываются">В момент выезда или при отмене брони</MetaItem>
        </dl>

        <div className="flex flex-col gap-4 border-t border-mist pt-5">
          <span className="mono-label text-smoke">Чувствительные</span>

          {readOnly ? (
            <dl className="grid gap-5 sm:grid-cols-2">
              <MetaItem label="Открываются">{formatOpeningOffset(policy.opening_offset_minutes)}</MetaItem>
              <MetaItem label="Готовность объекта">{policy.requires_ready ? 'Только после готовности' : 'Не требуется'}</MetaItem>
            </dl>
          ) : (
            <>
              <form className="flex flex-col gap-2" onSubmit={submit} noValidate>
                <Label htmlFor="policy-amount" className="text-body-sm font-medium">
                  Открываются
                </Label>
                <div className="grid grid-cols-[88px_1fr_1fr] gap-2">
                  <Input
                    id="policy-amount"
                    inputMode="numeric"
                    aria-invalid={!!errors.amount || undefined}
                    aria-describedby={errors.amount ? 'policy-amount-error' : undefined}
                    {...register('amount')}
                  />
                  <Controller
                    control={control}
                    name="unit"
                    render={({ field }) => (
                      <Select items={OFFSET_UNITS} value={field.value} onValueChange={(next) => next !== null && field.onChange(next)}>
                        <SelectTrigger className="w-full" aria-label="Единица времени">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {OFFSET_UNITS.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <Controller
                    control={control}
                    name="direction"
                    render={({ field }) => (
                      <Select items={DIRECTIONS} value={field.value} onValueChange={(next) => next !== null && field.onChange(next)}>
                        <SelectTrigger className="w-full" aria-label="До или после заезда">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DIRECTIONS.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <ErrorText id="policy-amount-error" errors={errors.amount} />
                {!errors.amount && <span className="text-caption text-smoke">Не больше 7 дней. 0 — в момент заезда. Время заезда берётся из брони</span>}
                <Button type="submit" size="sm" className="mt-1 self-start shadow-control" disabled={!isDirty || updateOffset.isPending}>
                  {updateOffset.isPending && <Spinner />} Сохранить
                </Button>
              </form>

              <label htmlFor="policy-ready" className="flex cursor-pointer items-start justify-between gap-4 rounded-3xl bg-mist p-4">
                <span className="flex flex-col gap-1">
                  <span className="text-body-sm font-medium">Только после готовности объекта</span>
                  <span className="text-caption text-smoke">Пока подготовка к заезду не принята, гость коды не получит. Сохраняется сразу</span>
                </span>
                <Switch
                  id="policy-ready"
                  checked={policy.requires_ready}
                  disabled={updateReady.isPending}
                  onCheckedChange={(next) => updateReady.mutate({ version: policy.version, requires_ready: next })}
                />
              </label>
            </>
          )}

          <dl className="grid gap-5 sm:grid-cols-2">
            <MetaItem label="Оплата">Только после ручного подтверждения полной оплаты — отключить нельзя</MetaItem>
            {/* Канала доставки на бэке нет: гость читает инструкции только на своей странице брони */}
            <MetaItem label="Канал" className={cn('rounded-2xl p-1.5', MOCK_BORDER)}>
              Страница брони гостя и сообщение в MAX
            </MetaItem>
          </dl>

          {!policy.sensitive_delivery_available && (
            <DeviationNote reason="бэк пока не выдаёт гостю чувствительные инструкции ни при каких условиях — настройки сохраняются, но код и пароль гость не увидит" />
          )}
        </div>
      </div>
    </SectionCard>
  )
}
