// Момент из бэка (UTC) во времени объекта: окно выдачи считается по часовому поясу брони, а не браузера.
// «15 окт, 13:00 UTC+3»
export const formatInstant = (iso: string, timezone?: string | null): string => {
  const instant = new Date(iso)
  const zone = timezone || undefined
  const date = new Intl.DateTimeFormat('ru-RU', { timeZone: zone, day: 'numeric', month: 'short' }).format(instant).replace('.', '')
  const time = new Intl.DateTimeFormat('ru-RU', { timeZone: zone, hour: '2-digit', minute: '2-digit' }).format(instant)
  if (!zone) return `${date}, ${time}`

  const offset = new Intl.DateTimeFormat('en-US', { timeZone: zone, timeZoneName: 'shortOffset' })
    .formatToParts(instant)
    .find((part) => part.type === 'timeZoneName')?.value
  return `${date}, ${time} ${(offset ?? zone).replace('GMT', 'UTC')}`
}
