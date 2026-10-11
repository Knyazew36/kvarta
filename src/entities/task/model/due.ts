import { getBrowserTimezone } from '@/entities/notification'

// Срок задачи хранится в UTC вместе с IANA-поясом. Пользователь вводит и видит локальное время этого пояса,
// а не браузера: исполнитель может быть в другом городе

type LocalParts = { year: number; month: number; day: number; hour: number; minute: number }

const partsIn = (instant: Date, timezone: string): LocalParts => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(instant)
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value)
  return { year: get('year'), month: get('month'), day: get('day'), hour: get('hour'), minute: get('minute') }
}

const pad = (value: number) => String(value).padStart(2, '0')

// Смещение пояса в миллисекундах на данный момент
const offsetAt = (instant: Date, timezone: string) => {
  const local = partsIn(instant, timezone)
  return Date.UTC(local.year, local.month - 1, local.day, local.hour, local.minute) - Math.floor(instant.getTime() / 60_000) * 60_000
}

// Локальные дата (yyyy-MM-dd) и время (HH:mm) пояса → ISO 8601 с секундами и Z, как требует бэк
export const toDueAt = (date: string, time: string, timezone: string): string => {
  const [year, month, day] = date.split('-').map(Number)
  const [hour, minute] = time.split(':').map(Number)
  const wall = Date.UTC(year, month - 1, day, hour, minute)
  // Второй проход нужен у границы перевода часов: смещение считается уже для найденного момента
  const guess = wall - offsetAt(new Date(wall), timezone)
  const instant = wall - offsetAt(new Date(guess), timezone)
  return `${new Date(instant).toISOString().slice(0, 19)}Z`
}

// Срок → значения полей формы в поясе задачи
export const getDueFormValues = (dueAt: string | null, timezone: string | null): { date: string; time: string } => {
  if (!dueAt || !timezone) return { date: '', time: '' }
  const local = partsIn(new Date(dueAt), timezone)
  return { date: `${local.year}-${pad(local.month)}-${pad(local.day)}`, time: `${pad(local.hour)}:${pad(local.minute)}` }
}

// Сегодняшняя дата (yyyy-MM-dd) в поясе
export const todayIn = (timezone: string, now = new Date()): string => {
  const local = partsIn(now, timezone)
  return `${local.year}-${pad(local.month)}-${pad(local.day)}`
}

// «UTC+3» — коротко, рядом со временем
export const formatTimezone = (timezone: string, at = new Date()): string => {
  const name = new Intl.DateTimeFormat('en-US', { timeZone: timezone, timeZoneName: 'shortOffset' })
    .formatToParts(at)
    .find((part) => part.type === 'timeZoneName')?.value
  return (name ?? timezone).replace('GMT', 'UTC')
}

export type DueLabel = { time: string; date: string; isToday: boolean }

// Время и дата срока по отдельности: в строке списка время — главная опора, дата нужна не для «сегодня»
export const getDueLabel = (dueAt: string, timezone: string | null): DueLabel => {
  const zone = timezone ?? getBrowserTimezone()
  const instant = new Date(dueAt)
  const local = partsIn(instant, zone)
  const date = new Intl.DateTimeFormat('ru-RU', { timeZone: zone, day: 'numeric', month: 'short' }).format(instant).replace('.', '')
  return {
    time: `${pad(local.hour)}:${pad(local.minute)}`,
    date,
    isToday: `${local.year}-${pad(local.month)}-${pad(local.day)}` === todayIn(zone),
  }
}

// «8 окт, 14:30 UTC+3»
export const formatDue = (dueAt: string | null, timezone: string | null): string => {
  if (!dueAt) return 'Без срока'
  const zone = timezone ?? getBrowserTimezone()
  const { date, time } = getDueLabel(dueAt, zone)
  return `${date}, ${time} ${formatTimezone(zone, new Date(dueAt))}`
}

// Момент в UTC (created_at, submitted_at) — во времени браузера
export const formatMoment = (value: string): string =>
  new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value)).replace('.', '')

// Срок уже наступил: возврат на доработку бэк принимает только с будущим сроком
export const isDuePassed = (dueAt: string): boolean => new Date(dueAt).getTime() <= Date.now()
