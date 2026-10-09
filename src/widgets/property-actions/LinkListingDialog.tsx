import { useState } from 'react'
import { ArrowLeftIcon, LinkIcon } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { type Source, SourceMark, SOURCE_LABEL } from '@/shared/ui/rb/SourceTag'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Dialog, DialogBody, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/shadcn/dialog'
import { Input } from '@/shared/ui/shadcn/input'
import { Label } from '@/shared/ui/shadcn/label'

// ── Макетные данные: что площадка вернула по ссылке ─────────────────────────

const CHANNELS: Source[] = ['avito', 'sutochno']

const FOUND: Record<'avito' | 'sutochno', { title: string; address: string; facts: [string, string][] }> = {
  avito: {
    title: '1-к. квартира, 32 м², студия у метро Лиговский',
    address: 'Санкт-Петербург, Лиговский пр., 50',
    facts: [
      ['ID объявления', '4127730918'],
      ['Вместимость', '2 гостя'],
      ['Владелец объявления', 'Анна В.'],
    ],
  },
  sutochno: {
    title: 'Студия на Лиговском, 5 мин до Московского вокзала',
    address: 'Санкт-Петербург, Лиговский пр., 50',
    facts: [
      ['ID объявления', 'SPB-882104'],
      ['Вместимость', '3 гостя'],
      ['Владелец объявления', 'Волна'],
    ],
  },
}

type LinkListingDialogProps = {
  trigger: React.ReactElement
  property: string
  defaultSource?: 'avito' | 'sutochno'
}

// Привязка — два шага (§3): ссылка, затем сверка с тем, что вернула площадка. Сохранённая ссылка ≠ подтверждённый доступ
export const LinkListingDialog = ({ trigger, property, defaultSource = 'avito' }: LinkListingDialogProps) => {
  const [source, setSource] = useState<'avito' | 'sutochno'>(defaultSource)
  const [step, setStep] = useState<'link' | 'check'>('link')
  const found = FOUND[source]

  return (
    <Dialog onOpenChange={(open) => !open && setStep('link')}>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="gap-2">
          <span className="mono-label text-smoke">
            {property} · шаг {step === 'link' ? '1' : '2'} из 2
          </span>
          <DialogTitle className="section-heading text-heading-sm">{step === 'link' ? 'Привязать объявление' : 'Это ваш объект?'}</DialogTitle>
          <DialogDescription className="text-body-sm text-slate">
            {step === 'link'
              ? 'Вставьте ссылку на объявление или его номер. Мы покажем, что нашли, прежде чем связывать.'
              : `Сверьте данные с площадки. После подтверждения брони из объявления будут попадать в календарь объекта «${property}».`}
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          {step === 'link' ? (
            <>
              <div className="flex flex-col gap-2">
                <span className="text-body-sm font-medium">Площадка</span>
                <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Площадка">
                  {CHANNELS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      role="radio"
                      aria-checked={source === item}
                      onClick={() => setSource(item as 'avito' | 'sutochno')}
                      className={cn(
                        'flex h-12 items-center gap-2.5 rounded-2xl px-4 text-body-sm font-medium outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/30',
                        source === item ? 'bg-foreground text-background' : 'bg-mist hover:bg-ash/40',
                      )}
                    >
                      <SourceMark source={item} size="md" />
                      {SOURCE_LABEL[item]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="listing-url" className="text-body-sm font-medium">
                  Ссылка или номер объявления
                </Label>
                <Input
                  id="listing-url"
                  defaultValue={source === 'avito' ? 'https://www.avito.ru/sankt-peterburg/kvartiry/4127730918' : ''}
                  placeholder={source === 'avito' ? 'avito.ru/…' : 'sutochno.ru/…'}
                />
                <span className="text-caption text-smoke">Доступ к броням подтверждается отдельно — в кабинете площадки</span>
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-4 rounded-3xl bg-mist p-5">
              <span className="flex items-center gap-2">
                <SourceMark source={source} size="md" />
                <span className="mono-label text-smoke">Найдено на {SOURCE_LABEL[source]}</span>
              </span>
              <span className="flex flex-col gap-1">
                <span className="text-body font-medium">{found.title}</span>
                <span className="text-body-sm text-slate">{found.address}</span>
              </span>
              <dl className="grid grid-cols-2 gap-4 border-t border-foreground/10 pt-4">
                {found.facts.map(([label, value]) => (
                  <div key={label} className="flex flex-col gap-1">
                    <dt className="mono-label text-smoke">{label}</dt>
                    <dd className="text-body-sm font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </DialogBody>
        <DialogFooter className="gap-2">
          {step === 'link' ? (
            <>
              <DialogClose render={<Button variant="ghost" />}>Отмена</DialogClose>
              <Button onClick={() => setStep('check')}>
                <LinkIcon /> Найти объявление
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => setStep('link')}>
                <ArrowLeftIcon /> Другая ссылка
              </Button>
              <DialogClose render={<Button />}>Да, это мой объект</DialogClose>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
