import { useState } from 'react'
import { CheckIcon, ClockIcon, LinkIcon, MessageCircleIcon, PaperclipIcon, PhoneIcon, SendIcon } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useSearchParams } from 'react-router'
import { DEMO_TZ, DEMO_TZ_FULL } from '@/shared/lib/format'
import { useDemoState } from '@/shared/mock/state'
import { swapTransition } from '@/shared/ui/rb/motion-presets'
import { SectionCard } from '@/shared/ui/rb/Section'
import { type StatusMeta, StatusFromMeta } from '@/shared/ui/rb/StatusBadge'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/shared/ui/shadcn/animate-ui/components/radix/accordion'
import { Input } from '@/shared/ui/shadcn/input'
import { Label } from '@/shared/ui/shadcn/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/shadcn/select'
import { Textarea } from '@/shared/ui/shadcn/textarea'

// ── Макетные данные ─────────────────────────────────────────────────────────

const TOPICS = [
  { value: 'sync', label: 'Обмен с площадкой' },
  { value: 'money', label: 'Деньги и переводы' },
  { value: 'tasks', label: 'Задачи и команда' },
  { value: 'guest', label: 'Гость и прямая бронь' },
  { value: 'other', label: 'Другое' },
]

const EMPLOYEE_TOPICS = [
  { value: 'tasks', label: 'Задача или фотоотчёт' },
  { value: 'access', label: 'Доступ и вход' },
  { value: 'other', label: 'Другое' },
]

// Распознанная запись: поддержка сразу видит, о чём речь, без пересказа в тексте
const RECORDS: Record<string, string> = {
  'b-1044': 'Бронь #1044 · Лофт у Невы · Елена Кравец',
  'b-1045': 'Бронь #1045 · Студия на Лиговском · конфликт дат',
  't-303': 'Задача «Заменить смеситель» · Апартаменты на Мойке',
  'r-201': 'Заявка 201 · Дом в Репино',
}

const ANSWERED: StatusMeta = { tone: 'success', icon: CheckIcon, label: 'Ответили' }
const IN_WORK: StatusMeta = { tone: 'neutral', icon: ClockIcon, label: 'В работе' }

const TICKETS = [
  { id: 'HD-1182', title: 'Бронь с Суточно не появилась в календаре', record: 'Бронь #1045', at: `8 окт, 08:20 ${DEMO_TZ}`, status: IN_WORK },
  { id: 'HD-1107', title: 'Как вернуть часть залога', record: 'Бронь #1038', at: `6 окт, 13:02 ${DEMO_TZ}`, status: ANSWERED },
]

const FAQ = [
  { q: 'Бронь с площадки не появилась в календаре', a: 'Проверьте «Настройки → Площадки»: если там сбой доступа, брони не приходят до обновления ключа. Время последнего успешного обмена указано у каждой площадки.' },
  { q: 'Гость перевёл, но сумма не подтверждается', a: 'Перевод гостя — это заявление. Найдите деньги в банке и нажмите «Нашёл, подтвердить» в разделе «Деньги → На проверке». До этого сумма не считается полученной.' },
  { q: 'Как дать сотруднику доступ только к одному объекту', a: 'В «Команде и доступе» откройте «Доступ» у человека и оставьте один объект. Предпросмотр справа покажет, что он увидит.' },
  { q: 'Почему гость не видит код от квартиры', a: 'Код открывается по условиям инструкций объекта: обычно за час до заезда и после подтверждения оплаты. Причину гость видит на своей странице.' },
]

// ── Страница ────────────────────────────────────────────────────────────────

const HelpPage = () => {
  const [params] = useSearchParams()
  const { isEmployee } = useDemoState()
  // ?record= — обращение из карточки записи: ID подставляется сам (§4.7)
  const [record, setRecord] = useState(params.get('record') ?? '')
  const [sent, setSent] = useState(false)
  const topics = isEmployee ? EMPLOYEE_TOPICS : TOPICS
  const recognized = RECORDS[record.trim()]

  return (
    <div className="flex flex-col gap-8 pb-8">
      <header className="flex flex-col gap-6 pt-4 md:pt-10">
        <p className="text-caption text-smoke">Поддержка Rentybot · {DEMO_TZ_FULL}</p>
        <div className="flex flex-col gap-4">
          <h1 className="text-heading font-semibold tracking-[-0.03em] md:text-heading-lg">Помощь</h1>
          <p className="max-w-2xl text-subheading-lg text-slate">Отвечаем живыми людьми с 9:00 до 21:00, обычно за 20 минут.</p>
        </div>
      </header>

      <div className="grid items-start gap-4 lg:grid-cols-[1fr_360px]">
        <SectionCard title="Написать в поддержку" className="shadow-card">
          <AnimatePresence mode="wait" initial={false}>
            {sent ? (
              <motion.div key="sent" {...swapTransition} className="flex flex-col items-start gap-4 py-4">
                <span className="flex size-12 items-center justify-center rounded-full bg-foreground text-background">
                  <CheckIcon className="size-5" aria-hidden />
                </span>
                <span className="text-subheading-lg font-medium">Обращение HD-1190 принято</span>
                <span className="max-w-md text-body-sm text-slate">Ответ придёт сюда и в MAX. {recognized ? `Поддержка видит запись: ${recognized}.` : ''}</span>
                <Button variant="ghost" onClick={() => setSent(false)}>
                  Новое обращение
                </Button>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                {...swapTransition}
                className="flex flex-col gap-5"
                onSubmit={(event) => {
                  event.preventDefault()
                  setSent(true)
                }}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="help-topic" className="text-body-sm font-medium">
                      Тема
                    </Label>
                    <Select items={topics} defaultValue={topics[0].value}>
                      <SelectTrigger id="help-topic" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {topics.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="help-record" className="text-body-sm font-medium">
                      Номер записи <span className="font-normal text-smoke">— если есть</span>
                    </Label>
                    <Input id="help-record" value={record} onChange={(event) => setRecord(event.target.value)} placeholder="b-1044, t-303…" className="font-mono" />
                  </div>
                </div>
                {recognized && (
                  <span className="flex items-center gap-2 rounded-2xl bg-background p-3 text-body-sm">
                    <LinkIcon className="size-4 shrink-0 text-smoke" aria-hidden /> {recognized}
                  </span>
                )}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="help-text" className="text-body-sm font-medium">
                    Что случилось
                  </Label>
                  <Textarea id="help-text" rows={5} placeholder="Опишите, что делали и что пошло не так. Скриншот поможет." />
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button type="submit" className="shadow-control">
                    <SendIcon /> Отправить
                  </Button>
                  <Button type="button" variant="ghost">
                    <PaperclipIcon /> Приложить скриншот
                  </Button>
                </div>
                {/* Диагностика ограниченная (§4.7): передаём технические сведения, но не данные гостей */}
                <span className="text-caption text-smoke">К обращению приложим версию кабинета и время — без данных гостей и денег.</span>
              </motion.form>
            )}
          </AnimatePresence>
        </SectionCard>

        <div className="flex flex-col gap-4 lg:sticky lg:top-24">
          <section className="flex flex-col gap-4 rounded-card bg-foreground p-6 text-background shadow-card dark:bg-mist dark:text-foreground">
            <h2 className="section-heading text-subheading-lg">Срочно?</h2>
            <span className="text-body-sm opacity-70">Гость у двери, а код не работает, или пропали брони — пишите в чат, ответим в первую очередь.</span>
            <div className="flex flex-col gap-2">
              <Button variant="accent" className="justify-start">
                <MessageCircleIcon /> Чат в MAX · @rentybot_help
              </Button>
              <Button variant="ghost" className="justify-start text-background hover:bg-background/10 hover:text-background dark:text-foreground dark:hover:bg-foreground/5">
                <PhoneIcon /> +7 (800) 555-27-10
              </Button>
            </div>
          </section>

          {!isEmployee && (
            <SectionCard title="Мои обращения" count={TICKETS.length} className="shadow-card">
              <ul className="flex flex-col">
                {TICKETS.map((ticket) => (
                  <li key={ticket.id} className="flex flex-col gap-1.5 border-t border-foreground/8 py-3 first:border-t-0">
                    <span className="flex items-start justify-between gap-3">
                      <span className="text-body-sm font-medium">{ticket.title}</span>
                      <StatusFromMeta meta={ticket.status} size="sm" />
                    </span>
                    <span className="text-caption text-smoke">
                      {ticket.id} · {ticket.record} · {ticket.at}
                    </span>
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}
        </div>
      </div>

      <SectionCard title="Частые вопросы" className="shadow-card">
        <Accordion type="single" collapsible className="w-full">
          {FAQ.map((item, index) => (
            <AccordionItem key={item.q} value={String(index)}>
              <AccordionTrigger className="text-body-sm">{item.q}</AccordionTrigger>
              <AccordionContent className="text-body-sm text-slate">{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </SectionCard>
    </div>
  )
}

export default HelpPage
