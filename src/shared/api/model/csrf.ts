import axios, { type InternalAxiosRequestConfig } from 'axios'

import { apiDomain } from './constants'
import log from './log'

const CSRF_TOKEN_URL = '/api/v1/auth/csrf-token'
const CSRF_HEADER = 'X-CSRF-TOKEN'
const CSRF_MISMATCH_STATUS = 419
const SAFE_METHODS = ['get', 'head', 'options']
// После входа, регистрации и выхода бэк пересоздаёт сессию — прежний токен к ней не подходит
const CSRF_RESET_URLS = ['/api/v1/auth/login', '/api/v1/auth/register', '/api/v1/auth/logout']

const isProduction = import.meta.env.PROD

type CsrfRequestConfig = InternalAxiosRequestConfig & { _csrfRetried?: boolean }

// Токен привязан к серверной сессии, храним в памяти; промис — чтобы параллельные запросы не плодили GET
let csrfToken: Promise<string> | null = null

// Голый axios, а не $api: запрос за токеном не должен проходить через интерцепторы, которые сами ждут токен
// Интерцепторов тут нет, поэтому логируем сами — иначе запрос за токеном не виден в консоли
const fetchCsrfToken = async () => {
  if (!isProduction) log({ name: CSRF_TOKEN_URL, data: { url: CSRF_TOKEN_URL, method: 'get' }, type: 'request' })

  try {
    const response = await axios.get<{ csrf_token: string }>(`${apiDomain}${CSRF_TOKEN_URL}`, { withCredentials: true })
    if (!isProduction) log({ name: CSRF_TOKEN_URL, data: response, type: 'response' })
    return response.data.csrf_token
  } catch (error) {
    if (!isProduction) log({ name: CSRF_TOKEN_URL, data: error, type: 'catch' })
    throw error
  }
}

export const getCsrfToken = (): Promise<string> => {
  csrfToken ??= fetchCsrfToken().catch((error) => {
    csrfToken = null
    throw error
  })
  return csrfToken
}

export const resetCsrfToken = (): void => {
  csrfToken = null
}

export const requiresCsrf = (config: InternalAxiosRequestConfig): boolean =>
  !SAFE_METHODS.includes((config.method ?? 'get').toLowerCase())

export const setCsrfHeader = async (config: InternalAxiosRequestConfig): Promise<void> => {
  config.headers[CSRF_HEADER] = await getCsrfToken()
}

export const resetsCsrf = (url: string | undefined): boolean => CSRF_RESET_URLS.includes(url ?? '')

/**
 * 419 — токен устарел: сессия истекла или пересоздана (например, вход в соседней вкладке).
 * Один повтор с новым токеном; второй 419 подряд — уже не устаревший токен, отдаём ошибку наверх.
 */
export const shouldRetryWithFreshCsrf = (status: number | undefined, config: CsrfRequestConfig | undefined): config is CsrfRequestConfig => {
  if (status !== CSRF_MISMATCH_STATUS || !config || config._csrfRetried) return false
  config._csrfRetried = true
  return true
}
