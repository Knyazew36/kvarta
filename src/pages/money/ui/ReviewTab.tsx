import { BanknoteIcon, HourglassIcon, MessageCircleIcon, PaperclipIcon, SearchXIcon } from 'lucide-react'
import { Link } from 'react-router'
import { to } from '@/shared/config/paths'
import { DEMO_TZ, formatMoney } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { ConfirmPaymentDialog } from '@/widgets/booking-actions/ConfirmPaymentDialog'
import { useMoneyFilter } from './useMoneyFilter'

// ── Макетные данные: заявления гостей о переводе ────────────────────────────

type Claim = {
  id: string
  number: string
  href: string
  propertyId: string
  property: string
  guest: string
  amount: number
  purpose: string
  claimedAt: string
  receipt: boolean
  // Удержание с крайним сроком — проверить нужно раньше, иначе гость потеряет даты
  holdUntil?: string
  note?: string
}

// Порядок — по срочности: удержание с крайним сроком первым
const CLAIMS: Claim[] = [
  {
    id: 'c-2',
    number: 'Заявка 201',
    href: to.request('r-201'),
    propertyId: 'repino',
    property: 'Дом в Репино',
    guest: 'Анна Фомина',
    amount: 14000,
    purpose: 'Предоплата за 10–13 окт',
    claimedAt: '8 окт, 08:40',
    receipt: false,
    holdUntil: '18:00',
    note: 'Перевод без чека: сверьте по имени отправителя «Анна Ф.»',
  },
  {
    id: 'c-1',
    number: 'Бронь #1044',
    href: to.booking('b-1044', 'payments'),
    propertyId: 'neva',
    property: 'Лофт у Невы',
    guest: 'Елена Кравец',
    amount: 6800,
    purpose: 'Остаток за проживание',
    claimedAt: '8 окт, 09:12',
    receipt: true,
  },
]

// ── Карточка заявления ──────────────────────────────────────────────────────

const ClaimCard = ({ claim }: { claim: Claim }) => (
  <article
    className={cn(
      'grid gap-6 rounded-card bg-card p-6 shadow-card md:grid-cols-[200px_1fr_auto] md:items-center md:p-7',
      claim.holdUntil && 'ring-1 ring-foreground/15',
    )}
  >
    <div className="flex flex-col gap-1">
      <span className="text-heading-sm font-medium tabular-nums">{formatMoney(claim.amount)}</span>
      <span className="text-caption text-smoke">{claim.purpose}</span>
    </div>

    <div className="flex min-w-0 flex-col gap-2">
      <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-body font-medium">
        {claim.guest}
        <span className="text-smoke">·</span>
        <Link to={claim.href} className="text-body-sm font-normal text-slate underline-offset-4 hover:text-foreground hover:underline">
          {claim.number}
        </Link>
      </span>
      <span className="text-body-sm text-slate">
        {claim.property} · сообщил {claim.claimedAt} {DEMO_TZ}
      </span>
      <span className="flex flex-wrap gap-2">
        <span className={cn('inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-caption', claim.receipt ? 'bg-background text-foreground' : 'bg-mist text-slate')}>
          <PaperclipIcon className="size-3" aria-hidden /> {claim.receipt ? 'Чек приложен' : 'Без чека'}
        </span>
        {claim.holdUntil && (
          <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-lime px-2.5 text-caption font-medium text-[#0a1217]">
            <HourglassIcon className="size-3" aria-hidden /> удержание до {claim.holdUntil}
          </span>
        )}
      </span>
      {claim.note && <span className="text-caption text-smoke">{claim.note}</span>}
    </div>

    <div className="flex flex-wrap gap-2 md:flex-col md:items-stretch">
      <ConfirmPaymentDialog
        trigger={
          <Button className="shadow-control">
            <BanknoteIcon /> Нашёл, подтвердить
          </Button>
        }
        record={claim.number}
        property={claim.property}
        amount={claim.amount}
        purpose={claim.purpose}
        claimedAt={claim.claimedAt}
      />
      {/* «Не нашёл» не отклоняет заявку молча: гостю уходит вопрос, даты пока держатся */}
      <Button variant="ghost">
        <SearchXIcon /> Не нашёл перевод
      </Button>
    </div>
  </article>
)

// ── Вкладка ─────────────────────────────────────────────────────────────────

export const ReviewTab = () => {
  const filter = useMoneyFilter()
  const claims = filter(CLAIMS)

  if (claims.length === 0) {
    return (
      <div className="flex flex-col items-start gap-2 rounded-card bg-card p-6 shadow-card md:p-8">
        <span className="text-body font-medium">Проверять нечего</span>
        <span className="text-body-sm text-slate">Когда гость сообщит о переводе, заявление появится здесь — и на «Сегодня».</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="flex items-start gap-2 text-body-sm text-slate">
        <MessageCircleIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
        Гость сообщил, что перевёл. Пока вы не нашли деньги в банке, сумма считается заявленной и в «Получено» не входит.
      </p>
      {claims.map((claim) => (
        <ClaimCard key={claim.id} claim={claim} />
      ))}
    </div>
  )
}
