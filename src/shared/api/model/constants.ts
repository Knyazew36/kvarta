import { env } from '@/env'

// Только origin, без `/api`: пути из OpenAPI уже содержат префикс `/api/v1/...`.
// В dev — пусто: запросы идут на тот же origin и уходят на бэк через proxy в vite.config.ts
export const apiDomainAccountDev = ''

export const apiDomainAccountProd = env.VITE_API_URL_PROD
export const apiDomain = import.meta.env.DEV ? `${apiDomainAccountDev}` : `${apiDomainAccountProd}`

/**
 * Бэк отдаёт avatarUrl либо своим относительным путём (`/uploads/...`), либо
 * абсолютной ссылкой на VK CDN (когда своя аватарка не загружена) — см.
 * resolveAvatarUrl на бэке. Абсолютный URL префиксовать apiDomain нельзя.
 */
export function toAssetUrl(url: string | null | undefined): string | null {
  if (!url) return null
  return /^https?:\/\//.test(url) ? url : `${apiDomain}${url}`
}
