import { useState } from 'react'
import { BadgeCheckIcon, EyeOffIcon, FlagIcon, ReplyIcon } from 'lucide-react'
import { useDemoState } from '@/shared/mock/state'
import { RatingBars, RatingLine, RatingStars } from '@/shared/ui/rb/Rating'
import { SectionCard } from '@/shared/ui/rb/Section'
import { StateView } from '@/shared/ui/rb/StateView'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Textarea } from '@/shared/ui/shadcn/textarea'
import { ComplaintDialog } from '@/widgets/specialist-actions/ComplaintDialog'
import { SpecialistShell } from '@/widgets/specialist-shell/SpecialistShell'

// ── Макетные данные отзывов ─────────────────────────────────────────────────

type Review = {
  id: string
  rating: number
  text: string
  at: string
  reply?: string
  // Скрытый модератором — с причиной и вне расчёта рейтинга (CAT-16, CAT-18)
  hidden?: string
}

const REVIEWS: Review[] = [
  { id: 'r1', rating: 5, text: 'Убирает быстро, фото присылает сразу. Дважды выручила в окно меньше трёх часов.', at: '3 окт 2026', reply: 'Спасибо! Рада работать с вами.' },
  { id: 'r2', rating: 4, text: 'Хорошо, но в первый раз забыла про балкон. Потом добавила в свой список.', at: '21 сен 2026' },
  { id: 'r3', rating: 5, text: 'Своё бельё — огромный плюс, не нужно возиться со стиркой.', at: '2 сен 2026' },
  { id: 'r4', rating: 1, text: 'Отзыв содержал телефон и имя гостя.', at: '28 авг 2026', hidden: 'Скрыт модератором 29 авг: раскрыты личные данные' },
]

const DISTRIBUTION = { 5: 19, 4: 3, 3: 1, 2: 0, 1: 0 }

// ── Отзыв ───────────────────────────────────────────────────────────────────

const ReviewItem = ({ review }: { review: Review }) => {
  const [reply, setReply] = useState(review.reply)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(review.reply ?? '')

  if (review.hidden) {
    return (
      <li className="flex items-start gap-3 border-t border-foreground/8 py-5 text-body-sm text-slate first:border-t-0 first:pt-0">
        <EyeOffIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
        <span className="flex flex-col gap-0.5">
          <span>{review.hidden}</span>
          <span className="text-caption text-smoke">Не виден в каталоге и не входит в рейтинг · {review.at}</span>
        </span>
      </li>
    )
  }

  return (
    <li className="flex flex-col gap-3 border-t border-foreground/8 py-5 first:border-t-0 first:pt-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <RatingStars value={review.rating} />
          <span className="inline-flex items-center gap-1 text-caption text-slate">
            <BadgeCheckIcon className="size-3.5" aria-hidden /> Пользователь с подтверждённой бронью
          </span>
        </span>
        <span className="text-caption text-smoke">{review.at}</span>
      </div>
      <p className="max-w-3xl text-body-sm">{review.text}</p>

      {editing ? (
        <form
          className="ml-4 flex flex-col gap-2 border-l-2 border-foreground/10 pl-4"
          onSubmit={(event) => {
            event.preventDefault()
            setReply(draft.trim() || undefined)
            setEditing(false)
          }}
        >
          <Textarea aria-label="Ваш ответ" rows={3} maxLength={500} value={draft} onChange={(event) => setDraft(event.target.value)} autoFocus />
          <span className="flex gap-2">
            <Button type="submit" size="sm" disabled={!draft.trim()}>
              Опубликовать ответ
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
              Отмена
            </Button>
          </span>
        </form>
      ) : (
        reply && (
          <div className="ml-4 flex flex-col gap-1 border-l-2 border-foreground/10 pl-4">
            <span className="text-caption text-smoke">Ваш ответ</span>
            <span className="text-body-sm text-slate">{reply}</span>
          </div>
        )
      )}

      {!editing && (
        <span className="-ml-2 flex flex-wrap gap-1">
          <Button variant="ghost" size="xs" onClick={() => setEditing(true)}>
            <ReplyIcon /> {reply ? 'Изменить ответ' : 'Ответить'}
          </Button>
          {/* Оценку автора специалист не правит — только жалоба модератору */}
          <ComplaintDialog
            target="review"
            subject={`отзыв от ${review.at}`}
            trigger={
              <Button variant="ghost" size="xs" className="text-smoke">
                <FlagIcon /> Пожаловаться
              </Button>
            }
          />
        </span>
      )}
    </li>
  )
}

// ── Страница ────────────────────────────────────────────────────────────────

const SpecialistReviewsPage = () => {
  const { state } = useDemoState()
  const count = Object.values(DISTRIBUTION).reduce((sum, n) => sum + n, 0)
  const rating = Object.entries(DISTRIBUTION).reduce((sum, [stars, n]) => sum + Number(stars) * n, 0) / count

  return (
    <SpecialistShell>
      <div className="flex flex-col gap-8">
        <header className="flex flex-col gap-6">
          <p className="text-caption text-smoke">Кабинет специалиста · оценки владельцев</p>
          <h1 className="text-heading font-semibold tracking-[-0.03em] md:text-heading-lg">Отзывы</h1>
        </header>

        {state !== 'ok' ? (
          <StateView
            state={state}
            empty={{ title: 'Отзывов пока нет', description: 'В каталоге у вас «Нет отзывов» — без выдуманного рейтинга. Оценить могут владельцы с подтверждённой бронью на Авито или Суточно.' }}
            error={{ title: 'Отзывы не загрузились', description: 'Список не получен — попробуйте ещё раз.' }}
          />
        ) : (
          <div className="grid items-start gap-4 lg:grid-cols-[1fr_340px]">
            <SectionCard title="Все отзывы" count={REVIEWS.length} className="shadow-card">
              <ul className="flex flex-col">
                {REVIEWS.map((review) => (
                  <ReviewItem key={review.id} review={review} />
                ))}
              </ul>
            </SectionCard>

            <section className="flex flex-col gap-5 rounded-card bg-card p-6 shadow-card lg:sticky lg:top-28">
              <span className="mono-label text-smoke">Рейтинг в каталоге</span>
              <RatingLine value={rating} count={count} size="lg" />
              <RatingBars counts={DISTRIBUTION} />
              <p className="text-caption text-smoke">
                Считаем по опубликованным оценкам пользователей с подтверждённой бронью. Скрытые модератором не входят. Если автор изменит оценку, число оценок не вырастет.
              </p>
            </section>
          </div>
        )}
      </div>
    </SpecialistShell>
  )
}

export default SpecialistReviewsPage
