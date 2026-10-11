import { EyeIcon, EyeOffIcon, HistoryIcon, LockIcon, type LucideIcon, PencilIcon, PlusIcon } from 'lucide-react'
import { INSTRUCTION_TYPES } from '@/entities/instruction'
import type { InstructionMetadata } from '@/shared/api/generated/models'
import { cn } from '@/shared/lib/utils'
import { DeviationNote } from '@/shared/mock/DeviationNote'
import { SectionCard } from '@/shared/ui/rb/Section'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { InstructionCreateSheet, InstructionEditSheet } from './InstructionFormSheet'
import { InstructionHistorySheet } from './InstructionHistorySheet'

type InstructionsListProps = {
  organizationId: number
  propertyId: number
  instructions: InstructionMetadata[]
  // Текст читают владелец и управляющий; администратору бэк отдаёт только метаданные
  canReadContent: boolean
  // Править нельзя администратору и в архивном объекте
  readOnly: boolean
}

const ROW = 'flex min-w-0 flex-1 items-center gap-4 rounded-2xl p-3'

// Пять слотов по типам: один тип — одна инструкция на объект
export const InstructionsList = ({ organizationId, propertyId, instructions, canReadContent, readOnly }: InstructionsListProps) => {
  const byType = new Map(instructions.map((instruction) => [instruction.type, instruction]))

  return (
    <SectionCard title="Материалы" count={`${instructions.length} из ${INSTRUCTION_TYPES.length}`} className="shadow-card">
      <DeviationNote reason="в списке нет текста и даты изменения — бэк отдаёт текст только при открытии инструкции, дату — в истории">
        <ul className="flex flex-col">
          {INSTRUCTION_TYPES.map((meta) => {
            const instruction = byType.get(meta.type)
            const Icon = meta.icon

            const body = instruction ? (
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className={cn('text-body-sm font-medium', !instruction.enabled && 'text-smoke')}>{instruction.title}</span>
                  {instruction.sensitive && (
                    <span className="mono-label inline-flex items-center gap-1 rounded-full bg-foreground px-2 py-0.5 text-background">
                      <LockIcon className="size-3" aria-hidden /> чувствительное
                    </span>
                  )}
                  {!instruction.enabled && (
                    <span className="mono-label inline-flex items-center gap-1 rounded-full bg-mist px-2 py-0.5 text-slate">
                      <EyeOffIcon className="size-3" aria-hidden /> выключена
                    </span>
                  )}
                </span>
                <span className="mono-label text-smoke">
                  {meta.label} · версия {instruction.version}
                </span>
              </span>
            ) : (
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="text-body-sm font-medium text-smoke">{meta.label}</span>
                <span className="text-caption text-smoke">Не заполнена · {meta.hint.toLowerCase()}</span>
              </span>
            )

            const icon = (
              <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-full bg-mist', !instruction && 'text-smoke')}>
                <Icon className="size-4" aria-hidden />
              </span>
            )

            // Строка целиком открывает форму: правку (или чтение в архиве) у заполненной, создание у пустой.
            // История — отдельная кнопка рядом, а не внутри строки: кнопка в кнопке недопустима
            const rowTrigger = (ActionIcon: LucideIcon) => (
              <button type="button" className={cn(ROW, 'cursor-pointer text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/30')}>
                {icon}
                {body}
                <ActionIcon className="size-4 shrink-0 text-smoke" aria-hidden />
              </button>
            )

            return (
              <li key={meta.type} className="flex items-center gap-1 rounded-2xl transition-colors hover:bg-mist">
                {instruction && canReadContent ? (
                  <InstructionEditSheet
                    organizationId={organizationId}
                    instruction={instruction}
                    meta={meta}
                    readOnly={readOnly}
                    trigger={rowTrigger(readOnly ? EyeIcon : PencilIcon)}
                  />
                ) : !instruction && !readOnly ? (
                  <InstructionCreateSheet organizationId={organizationId} propertyId={propertyId} meta={meta} trigger={rowTrigger(PlusIcon)} />
                ) : (
                  <div className={ROW}>
                    {icon}
                    {body}
                  </div>
                )}
                {instruction && (
                  <InstructionHistorySheet
                    organizationId={organizationId}
                    instruction={instruction}
                    trigger={
                      <Button variant="ghost" size="icon-sm" className="mr-2 shrink-0" aria-label={`История: ${instruction.title}`}>
                        <HistoryIcon />
                      </Button>
                    }
                  />
                )}
              </li>
            )
          })}
        </ul>
      </DeviationNote>
    </SectionCard>
  )
}
