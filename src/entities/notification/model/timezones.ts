// Часовые пояса России (IANA). Бэк принимает любой IANA-пояс, список — только для удобного выбора
const RUSSIAN_TIMEZONES = [
  { value: 'Europe/Kaliningrad', label: 'Калининград, UTC+2' },
  { value: 'Europe/Moscow', label: 'Москва, UTC+3' },
  { value: 'Europe/Samara', label: 'Самара, UTC+4' },
  { value: 'Asia/Yekaterinburg', label: 'Екатеринбург, UTC+5' },
  { value: 'Asia/Omsk', label: 'Омск, UTC+6' },
  { value: 'Asia/Novosibirsk', label: 'Новосибирск, UTC+7' },
  { value: 'Asia/Krasnoyarsk', label: 'Красноярск, UTC+7' },
  { value: 'Asia/Irkutsk', label: 'Иркутск, UTC+8' },
  { value: 'Asia/Yakutsk', label: 'Якутск, UTC+9' },
  { value: 'Asia/Vladivostok', label: 'Владивосток, UTC+10' },
  { value: 'Asia/Magadan', label: 'Магадан, UTC+11' },
  { value: 'Asia/Kamchatka', label: 'Камчатка, UTC+12' },
]

export const getBrowserTimezone = (): string => Intl.DateTimeFormat().resolvedOptions().timeZone

// Пояс браузера и уже сохранённый пояс могут быть не из списка (человек за границей) — добавляем их, чтобы селект не терял значение
export const getTimezoneOptions = (...extra: (string | null | undefined)[]) => {
  const options = [...RUSSIAN_TIMEZONES]
  for (const value of extra) {
    if (value && !options.some((option) => option.value === value)) options.push({ value, label: value })
  }
  return options
}

export const getTimezoneLabel = (timezone: string): string =>
  RUSSIAN_TIMEZONES.find((option) => option.value === timezone)?.label ?? timezone
