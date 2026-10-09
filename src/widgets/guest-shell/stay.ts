import { useSearchParams } from 'react-router'

export const DEFAULT_STAY = { from: '2026-10-15', to: '2026-10-18', guests: 2 }

// Даты и гости живут в ссылке: со страницы владельца в объект и в оформление они переходят без повторного ввода
export const useStay = () => {
  const [params, setParams] = useSearchParams()
  const stay = {
    from: params.get('from') ?? DEFAULT_STAY.from,
    to: params.get('to') ?? DEFAULT_STAY.to,
    guests: Number(params.get('guests') ?? DEFAULT_STAY.guests),
  }
  const update = (patch: Partial<typeof stay>) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        Object.entries(patch).forEach(([key, value]) => (value == null || value === '' ? next.delete(key) : next.set(key, String(value))))
        return next
      },
      { replace: true },
    )
  const query = `from=${stay.from}&to=${stay.to}&guests=${stay.guests}`
  return { ...stay, update, query }
}

const day = (iso: string) => Number(iso.slice(8, 10))

// Пересечение с занятыми ночами [from, till): день выезда соседа свободен для заезда
export const isBusy = (stay: { from: string; to: string }, busy: [number, number][]) =>
  busy.some(([from, till]) => day(stay.from) < till && day(stay.to) > from)
