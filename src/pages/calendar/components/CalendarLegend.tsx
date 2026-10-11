import { cn } from '@/shared/lib/utils'
import { DeviationNote } from '@/shared/mock/DeviationNote'
import { MOCK_BORDER } from '@/shared/mock/mock-border'

const Item = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <li className={cn('flex items-center gap-2', className)}>{children}</li>
)

export const CalendarLegend = ({ withTasks }: { withTasks?: boolean }) => (
  <DeviationNote reason="Окно подготовки — промежуток между плановым выездом и заездом в один день из ответа календаря: готовность объекта и задачи подготовки в него не входят, красная полоска — заезд не позже выезда. Брони только ручные; свободные даты не означают, что они свободны на площадках — обмена с ними нет.">
    <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 px-1.5 text-caption text-slate">
      <Item>
        <span className="h-3 w-6 rounded-full bg-foreground" aria-hidden /> Подтверждена
      </Item>
      <Item>
        <span className="hatch h-3 w-6 rounded-full bg-mist" aria-hidden /> Даты закрыты
      </Item>
      <Item>
        <span className="h-1.5 w-6 rounded-full bg-lime" aria-hidden /> Окно подготовки
      </Item>
      {/* Удержаний и конфликтов на бэке нет: заявок ещё нет, а пересечение дат бэк не даёт создать */}
      <Item className={MOCK_BORDER}>
        <span className="hatch h-3 w-6 rounded-full border border-dashed border-foreground" aria-hidden /> Удержание
      </Item>
      <Item className={MOCK_BORDER}>
        <span className="h-3 w-6 rounded-full bg-foreground ring-2 ring-destructive ring-offset-1 ring-offset-background" aria-hidden /> Конфликт
      </Item>
      {withTasks && (
        <Item className={MOCK_BORDER}>
          <span className="h-3 w-6 rounded-full border border-ash bg-canvas" aria-hidden /> Задача
        </Item>
      )}
    </ul>
  </DeviationNote>
)
