import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import {
  type BlockEditInput,
  type BlockEditValues,
  blockEditSchema,
  getBlockChanges,
  getBlockFormValues,
  useCalendarBlock,
  useUpdateCalendarBlock,
} from '@/entities/calendar'
import type { CalendarBlock } from '@/shared/api/generated/models'
import { formatRange, nights, pluralize } from '@/shared/lib/format'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { DateRangeInput } from '@/shared/ui/shadcn/date-input'
import { Sheet, SheetBody, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/shared/ui/shadcn/sheet'
import { Spinner } from '@/shared/ui/shadcn/spinner'
import { Textarea } from '@/shared/ui/shadcn/textarea'
import { getBlockFieldErrors } from '@/widgets/booking-actions/block-field-errors'
import { BookingField, BookingFormError } from '@/widgets/booking-actions/BookingFields'
import { BlockHistory } from './BlockHistory'
import { ReleaseBlockDialog } from './ReleaseBlockDialog'

type BlockPanelProps = {
  // Блокировка из календаря: с неё карточка открывается сразу, свежую версию дочитывает запрос
  initial: CalendarBlock
  propertyName: string
  // Архивный объект: бэк правку не примет (409), снять блокировку можно
  propertyArchived: boolean
  onClose: () => void
}

const BlockPanel = ({ initial, propertyName, propertyArchived, onClose }: BlockPanelProps) => {
  const { data: block = initial } = useCalendarBlock(initial.organization_id, initial.id)
  const updateBlock = useUpdateCalendarBlock(block.organization_id, block.id)
  const active = block.status === 'active'
  const editable = active && !propertyArchived
  // values: после конфликта версий блокировка перечитывается, и форма получает свежие данные вместе с новой version
  const {
    control,
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<BlockEditInput, unknown, BlockEditValues>({ resolver: zodResolver(blockEditSchema), values: getBlockFormValues(block) })

  const submit = handleSubmit((values) => {
    const changes = getBlockChanges(block, values)
    // Ничего не поменяли — ревизию не создаём
    if (Object.keys(changes).length === 0) {
      onClose()
      return
    }

    updateBlock.mutate(
      { version: block.version, ...changes },
      {
        onSuccess: onClose,
        onError: (error) =>
          getBlockFieldErrors(error).forEach(({ name, message }) => {
            if (name !== 'property_id') setError(name, { message })
          }),
      },
    )
  })

  return (
    <>
      <SheetHeader className="border-b border-mist">
        <span className="mono-label text-smoke">
          Блокировка #{block.id} · {propertyName}
        </span>
        <SheetTitle className="text-heading-sm">{active ? 'Даты закрыты' : 'Блокировка снята'}</SheetTitle>
        <SheetDescription>
          {formatRange(block.start_date, block.end_date)} · {pluralize(nights(block.start_date, block.end_date), ['ночь', 'ночи', 'ночей'])}
          {propertyArchived && ' · объект в архиве, изменить блокировку нельзя'}
        </SheetDescription>
      </SheetHeader>

      <SheetBody className="flex flex-col gap-8 pt-6">
        <form id="block-edit-form" className="flex flex-col gap-5" onSubmit={submit} noValidate>
          {/* У диапазона ошибка может лежать и на самом поле (refine), и прийти с бэка */}
          <BookingField id="block-edit-dates" label="Даты" hint="Закрыты ночи с первой даты до второй" error={errors.dates as { message?: string } | undefined}>
            <Controller
              control={control}
              name="dates"
              render={({ field }) => (
                <DateRangeInput
                  id="block-edit-dates"
                  value={field.value}
                  onValueChange={field.onChange}
                  showNights
                  numberOfMonths={2}
                  disabled={!editable}
                  aria-invalid={!!errors.dates || undefined}
                />
              )}
            />
          </BookingField>
          <BookingField id="block-edit-reason" label="Причина" hint="Видна только команде" error={errors.reason}>
            <Textarea
              id="block-edit-reason"
              rows={3}
              disabled={!editable}
              aria-invalid={!!errors.reason || undefined}
              aria-describedby={errors.reason ? 'block-edit-reason-error' : undefined}
              {...register('reason')}
            />
          </BookingField>
          <BookingFormError error={updateBlock.error} />
        </form>

        <BlockHistory block={block} />
      </SheetBody>

      <SheetFooter className="flex-row-reverse justify-start border-t border-mist">
        {editable && (
          <Button type="submit" form="block-edit-form" className="shadow-control" disabled={updateBlock.isPending}>
            {updateBlock.isPending && <Spinner />} Сохранить
          </Button>
        )}
        {active && (
          <ReleaseBlockDialog
            block={block}
            propertyName={propertyName}
            onReleased={onClose}
            trigger={
              <Button type="button" variant="outline" className="bg-canvas">
                Снять блокировку
              </Button>
            }
          />
        )}
        <SheetClose render={<Button type="button" variant="ghost" />}>Закрыть</SheetClose>
      </SheetFooter>
    </>
  )
}

type BlockSheetProps = Omit<BlockPanelProps, 'initial'> & {
  // null — карточка закрыта
  block: CalendarBlock | null
}

// Карточка блокировки из календаря: правка дат и причины, снятие, история
export const BlockSheet = ({ block, ...props }: BlockSheetProps) => (
  <Sheet open={!!block} onOpenChange={(next) => !next && props.onClose()}>
    <SheetContent>{block && <BlockPanel key={block.id} initial={block} {...props} />}</SheetContent>
  </Sheet>
)
