import { CircleCheckIcon, EyeOffIcon, LockIcon, RefreshCwIcon } from 'lucide-react'
import { useState } from 'react'
import { formatInstant, getInstructionTypeMeta, getLockedReasonText, sortByInstructionType, useInstructionPreview, useInstructions } from '@/entities/instruction'
import type { Booking, GuestGrant, InstructionMetadata, InstructionPreviewItem } from '@/shared/api/generated/models'
import { StateView } from '@/shared/ui/rb/StateView'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/shadcn/select'

const NO_GUEST = 'none'

type PreviewRowProps = {
  index: number
  instruction: InstructionMetadata | InstructionPreviewItem
  timezone: string
}

const PreviewRow = ({ index, instruction, timezone }: PreviewRowProps) => {
  // Текст чувствительной инструкции скрыт до нажатия: экран могут видеть рядом
  const [shown, setShown] = useState(false)
  const Icon = getInstructionTypeMeta(instruction.type).icon
  const preview = 'content' in instruction ? instruction : null

  return (
    <li className="flex items-start gap-3">
      <span className="mono-label mt-0.5 w-6 shrink-0 text-smoke tabular-nums">{String(index + 1).padStart(2, '0')}</span>
      <span className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="flex flex-wrap items-center gap-2 text-body-sm font-medium">
          <Icon className="size-4 shrink-0" aria-hidden /> {instruction.title}
          {instruction.sensitive && <LockIcon className="size-3 text-smoke" aria-label="Чувствительное" />}
        </span>

        {preview &&
          (preview.available ? (
            <span className="mono-label inline-flex w-fit items-center gap-1.5 rounded-full bg-lime px-2.5 py-1 text-[#0a1217]">
              <CircleCheckIcon className="size-3" aria-hidden /> гость видит · до {formatInstant(preview.closes_at, timezone)}
            </span>
          ) : (
            <span className="flex flex-col gap-1 text-caption text-smoke">
              {preview.locked_reasons.map((reason) => (
                <span key={reason} className="inline-flex items-center gap-1.5">
                  <EyeOffIcon className="size-3 shrink-0" aria-hidden /> {getLockedReasonText(reason)}
                  {reason === 'window_not_open' && preview.opens_at && ` — откроется ${formatInstant(preview.opens_at, timezone)}`}
                </span>
              ))}
            </span>
          ))}
        {!preview && !instruction.enabled && (
          <span className="inline-flex items-center gap-1.5 text-caption text-smoke">
            <EyeOffIcon className="size-3 shrink-0" aria-hidden /> {getLockedReasonText('instruction_disabled')}
          </span>
        )}

        {preview &&
          (preview.sensitive && !shown ? (
            <Button variant="ghost" size="xs" className="self-start bg-background/10 text-current hover:bg-background/20 dark:bg-foreground/5" onClick={() => setShown(true)}>
              Показать текст
            </Button>
          ) : (
            <p className="text-body-sm whitespace-pre-wrap opacity-80">{preview.content}</p>
          ))}
      </span>
    </li>
  )
}

type InstructionPreviewCardProps = {
  booking: Booking
  grants: GuestGrant[] | undefined
  // Тексты и условия — только владельцу и управляющему; администратору бэк отдаёт лишь список без текста
  canPreview: boolean
}

// Что и на каких условиях увидит гость этой брони прямо сейчас. Гостю предпросмотр ничего не открывает
export const InstructionPreviewCard = ({ booking, grants, canPreview }: InstructionPreviewCardProps) => {
  const [guest, setGuest] = useState(NO_GUEST)
  const candidates = grants?.filter((grant) => grant.status !== 'revoked') ?? []
  // Привязку могли отозвать, пока она была выбрана
  const grantId = candidates.some((grant) => String(grant.id) === guest) ? Number(guest) : null
  const preview = useInstructionPreview(booking.organization_id, booking.id, grantId, { enabled: canPreview })
  const metadata = useInstructions(booking.organization_id, booking.property_id, { enabled: !canPreview })
  const query = canPreview ? preview : metadata
  const items = canPreview ? preview.data?.instructions : metadata.data

  const guestItems = [
    { value: NO_GUEST, label: 'Без гостя' },
    ...candidates.map((grant) => ({ value: String(grant.id), label: `${grant.guest.name} · ${grant.status === 'active' ? 'подтверждён' : 'ждёт подтверждения'}` })),
  ]

  return (
    <section className="flex flex-col gap-5 rounded-card bg-foreground p-6 text-background shadow-card dark:bg-mist dark:text-foreground">
      <div className="flex items-center justify-between gap-3">
        <h2 className="section-heading text-subheading-lg">Глазами гостя</h2>
        <span className="mono-label text-smoke">предпросмотр</span>
      </div>

      {canPreview && candidates.length > 0 && (
        <Select items={guestItems} value={guest} onValueChange={(next) => next !== null && setGuest(next as string)}>
          <SelectTrigger className="w-full border-background/20 bg-background/10 text-current dark:border-foreground/10 dark:bg-foreground/5" aria-label="Гость для предпросмотра">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {guestItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {!canPreview && (
        <span className="text-caption text-smoke">Тексты и условия выдачи видят владелец и управляющий. Вам доступен список инструкций объекта.</span>
      )}

      {query.isPending ? (
        <StateView state="loading" className="opacity-60" />
      ) : query.isError ? (
        <div className="flex flex-col items-start gap-3">
          <span className="text-body-sm">Предпросмотр не загрузился. Проверьте соединение и повторите попытку.</span>
          <Button variant="accent" size="sm" disabled={query.isRefetching} onClick={() => query.refetch()}>
            <RefreshCwIcon /> Повторить
          </Button>
        </div>
      ) : items && items.length > 0 ? (
        <ol className="flex flex-col gap-5">
          {sortByInstructionType(items).map((instruction, index) => (
            <PreviewRow key={instruction.id} index={index} instruction={instruction} timezone={booking.timezone} />
          ))}
        </ol>
      ) : (
        <span className="text-body-sm text-smoke">У объекта пока нет инструкций. Добавьте их во вкладке «Инструкции» объекта.</span>
      )}

    </section>
  )
}
