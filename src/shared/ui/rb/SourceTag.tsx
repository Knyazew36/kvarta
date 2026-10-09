import { HouseIcon, type LucideIcon, PencilIcon } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

// Знак Авито — четыре круга из официального логотипа (Wikimedia Commons, источник start.avito.ru, PD-textlogo,
// товарный знак Авито). Полный логотип со словом: shared/assets/brands/avito-logo.svg
const AvitoMark = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 410 380" aria-hidden {...props}>
    <circle cx="122.965" cy="256.711" r="122.56" fill="#04e061" />
    <circle cx="335.574" cy="289.745" r="74.06" fill="#ff4053" />
    <circle cx="146.404" cy="72.347" r="45.83" fill="#965eeb" />
    <circle cx="306.803" cy="100.051" r="99.65" fill="#00aaff" />
  </svg>
)

// Знак Суточно — фавикон с sutochno.ru (static-pages/favicon.svg, товарный знак Суточно.ру).
// Копия файла: shared/assets/brands/sutochno-mark.svg
const SutochnoMark = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 120 120" aria-hidden {...props}>
    <path
      fill="#ee204d"
      fillRule="evenodd"
      clipRule="evenodd"
      d="M17.918 36.9365C17.8351 36.5269 17.7404 36.1291 17.6409 35.7407C16.4546 31.3531 12.6424 33.4179 11.8326 30.3965C10.6558 26.0065 23.042 25.2298 26.151 24.439C34.2183 22.4003 45.3448 17.5509 56.9686 14.3401C68.6445 11.3069 80.6992 9.94534 88.7097 7.67694C91.7926 6.80794 102.912 1.28611 104.089 5.67611C104.897 8.69749 100.566 8.81588 101.731 13.2106C103.398 19.2297 108.077 26.7003 110.418 35.1867C113.137 44.9967 113.546 55.8201 115.263 62.0121C115.815 63.994 116.942 64.9671 117.894 65.758C120.655 67.5197 120.873 71.152 117.524 72.0494C115.746 72.5253 113.262 73.3044 110.418 73.2712C108.934 73.2546 108.347 72.594 108.186 71.4408C107.546 66.9632 106.762 60.7974 105.394 55.8675C104.16 51.3993 101.458 44.13 98.9909 40.1331C97.6317 37.931 95.8464 35.2672 97.2268 33.4984C99.5897 30.4746 98.8038 25.7318 96.391 22.907C93.7224 19.7743 89.1193 19.8761 84.2534 21.1808C81.9826 21.7893 79.5295 22.7341 77.5618 23.4895C76.5057 23.8967 75.6178 24.2401 75.3644 24.3111C71.9145 25.2867 67.103 26.1699 61.8464 27.1312C56.2677 28.1541 50.1894 29.2694 43.7157 30.9506L43.6707 30.96C37.2207 32.743 31.4005 34.8173 26.0586 36.721C24.3135 37.3438 22.6205 37.9476 21.008 38.5064C21.008 38.5064 18.4626 39.5269 17.918 36.9365ZM63.5015 104.88C52.0316 107.392 40.2208 108.557 32.0754 110.634C26.3688 112.061 24.2472 115.651 21.3632 116.425C18.015 117.323 16.6488 114.522 18.1571 111.616C18.5833 110.454 19.0782 109.049 18.5644 107.056C17.0845 101.524 11.906 96.3436 8.11741 81.7315C4.33122 67.1219 7.31708 63.3807 5.88216 58.027C4.69587 53.637 0.888363 55.7017 0.0785577 52.6804C-1.09827 48.288 11.288 47.5137 14.3899 46.7252C24.87 44.0685 34.7818 39.5175 45.2122 36.6239C55.6923 33.9151 66.5537 32.8993 76.9556 29.9608C80.0386 29.0894 91.1509 23.57 92.3277 27.96C93.1375 30.9814 88.8091 31.0997 89.9765 35.4945C91.4114 40.8482 95.8677 42.5933 99.8907 57.1414C103.919 71.6895 102.024 78.7646 103.507 84.2959C104.058 86.2778 105.19 87.2486 106.14 88.0395C108.901 89.8036 109.116 92.9125 105.77 93.8076C102.884 94.5819 99.2517 92.5337 93.5969 94.1486C85.5012 96.4217 74.692 101.321 63.5015 104.88ZM82.9226 45.6502C91.9773 59.9212 87.2084 79.0369 84.135 86.91C84.0639 87.0947 83.9219 87.5825 84.6867 87.251C96.1021 83.2091 96.0405 56.6181 83.3938 45.3234C83.3938 45.3234 82.2809 44.6368 82.9226 45.6502Z"
    />
  </svg>
)

export type Source = 'avito' | 'sutochno' | 'ostrovok' | 'direct' | 'manual'

type SourceMeta = {
  label: string
  // Подпись для узких мест: полоса брони в месяце, ячейка таблицы на телефоне
  short: string
  // Значок площадки: фирменный знак (svg), иконка или монограмма на фирменном цвете. Меняется здесь, в одном месте
  mark: { svg?: (props: React.SVGProps<SVGSVGElement>) => React.ReactNode; letter?: string; icon?: LucideIcon; bg: string; fg: string }
  // Внешняя площадка: брони приходят обменом, отменяются в её кабинете
  external: boolean
}

export const SOURCE_META: Record<Source, SourceMeta> = {
  avito: { label: 'Авито', short: 'Ав', mark: { svg: AvitoMark, bg: 'transparent', fg: 'currentColor' }, external: true },
  sutochno: { label: 'Суточно', short: 'Сут', mark: { svg: SutochnoMark, bg: 'transparent', fg: 'currentColor' }, external: true },
  ostrovok: { label: 'Островок', short: 'Остр', mark: { letter: 'О', bg: '#7b5cff', fg: '#ffffff' }, external: true },
  direct: { label: 'Прямая', short: 'Прям', mark: { icon: HouseIcon, bg: 'var(--foreground)', fg: 'var(--background)' }, external: false },
  manual: { label: 'Вручную', short: 'Ручн', mark: { icon: PencilIcon, bg: 'var(--mist)', fg: 'var(--foreground)' }, external: false },
}

export const SOURCE_LABEL = Object.fromEntries(
  Object.entries(SOURCE_META).map(([key, meta]) => [key, meta.label]),
) as Record<Source, string>

export const SOURCES = Object.keys(SOURCE_META) as Source[]

// Габарит значка; для svg-знака вложенные размеры иконок не нужны
const MARK_BOX = { xs: 'size-3.5', sm: 'size-4', md: 'size-5' }
const MARK_SIZE = { xs: 'size-3.5 text-[8px] [&>svg]:size-2', sm: 'size-4 text-[9px] [&>svg]:size-2.5', md: 'size-5 text-[11px] [&>svg]:size-3' }

// Значок площадки без подписи — там, где места нет, подпись уходит в title/aria-label
export const SourceMark = ({ source, size = 'sm', className }: { source: Source; size?: keyof typeof MARK_SIZE; className?: string }) => {
  const { mark, label } = SOURCE_META[source]
  const Icon = mark.icon
  const Svg = mark.svg
  if (Svg) {
    return (
      <span role="img" aria-label={label} title={label} className={cn('inline-flex shrink-0', MARK_BOX[size], className)}>
        <Svg className="size-full" />
      </span>
    )
  }
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className={cn('inline-flex shrink-0 items-center justify-center rounded-full leading-none font-semibold', MARK_SIZE[size], className)}
      style={{ background: mark.bg, color: mark.fg }}
    >
      {Icon ? <Icon aria-hidden strokeWidth={2.5} /> : mark.letter}
    </span>
  )
}

type SourceTagProps = {
  source: Source
  // outline — шильдик в рамке (по умолчанию); plain — значок и текст без рамки, для таблиц и плотных списков
  variant?: 'outline' | 'plain'
  size?: 'sm' | 'default'
  short?: boolean
  inverted?: boolean
  className?: string
}

// Источник — таксономия, а не статус: значок площадки + название, без заливки цветом статуса
export const SourceTag = ({ source, variant = 'outline', size = 'sm', short, inverted, className }: SourceTagProps) => (
  <span
    className={cn(
      'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap',
      size === 'sm' ? 'text-caption' : 'text-body-sm',
      variant === 'outline' && (size === 'sm' ? 'h-6 rounded-full border pr-2.5 pl-1' : 'h-8 rounded-full border pr-3 pl-1.5'),
      variant === 'outline' && (inverted ? 'border-current/30' : 'border-foreground/15 bg-card'),
      inverted ? 'text-current' : 'text-foreground',
      className,
    )}
  >
    <SourceMark source={source} size={size === 'sm' ? 'sm' : 'md'} />
    {short ? SOURCE_META[source].short : SOURCE_META[source].label}
  </span>
)
