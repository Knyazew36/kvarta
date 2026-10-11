import axios, { AxiosError, type AxiosResponse } from 'axios'

// NOTE: следующие импорты — паттерны из другого проекта (organization/planы/MAX-платформа).
// В этом проекте таких сущностей пока нет, закомментировано до появления соответствующих
// стора/фичи. Раскомментировать по мере портирования логики.
// import { useOrganizationStore } from '@/entitites/organization/model/organization.store'
// import { ErrorEventEmitter, eventEmitter } from '@/features/error-handler'
// import { getAuthHeader, getPlatform, requiresPhoneBinding } from '@/shared/miniapp'
// import { getOrganizationIdFromStore } from '../middleware/organization.middleware'
// import { consumeRecaptchaToken } from './recaptcha-token'
// import { useGuestModeStore } from '@/entitites/...'

import { emitUnauthorized } from '@/shared/auth/session-events'

import { getAccessToken, clearAccessToken } from './access-token'
import { apiDomain } from './constants'
import log from './log'
import type { BaseResponse, ErrorResponse } from './type'

const isProduction = import.meta.env.PROD

// Authorization ставится динамически в интерцепторе: токен появляется только после логина
const $api = axios.create({
  baseURL: apiDomain,
  withCredentials: true
})

const CSRF_TOKEN_URL = '/api/v1/auth/csrf-token'
const SAFE_METHODS = ['get', 'head', 'options']
// После входа, регистрации и выхода сессия пересоздаётся — токен нужно получить заново
const CSRF_RESET_URLS = ['/api/v1/auth/login', '/api/v1/auth/register', '/api/v1/auth/logout']

// Токен привязан к серверной сессии, храним в памяти; промис — чтобы параллельные запросы не плодили GET
let csrfToken: Promise<string> | null = null

const getCsrfToken = () => {
  csrfToken ??= $api
    .get<{ csrf_token: string }>(CSRF_TOKEN_URL)
    .then(res => res.data.csrf_token)
    .catch(error => {
      csrfToken = null
      throw error
    })
  return csrfToken
}

$api.interceptors.request.use(
  async config => {
    if (!SAFE_METHODS.includes((config.method ?? 'get').toLowerCase())) {
      config.headers['X-CSRF-TOKEN'] = await getCsrfToken()
    }

    const token = getAccessToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    } else {
      delete config.headers.Authorization
    }

    // Мультиорганизационный контекст (x-organization-id) — паттерн из другого проекта,
    // в этом проекте организаций пока нет
    // const organizationId = getOrganizationIdFromStore()
    // if (organizationId) {
    //   config.headers['x-organization-id'] = organizationId.toString()
    // }

    // Капча ставится компонентом Captcha перед конкретным запросом — паттерн из другого проекта
    // const recaptchaToken = consumeRecaptchaToken()
    // if (recaptchaToken) {
    //   config.headers.recaptcha = recaptchaToken
    // }

    if (!isProduction) {
      log({
        name: config.url ?? 'undefined url',
        data: config,
        type: 'request',
        payload: config.data
      })
    }
    return config
  },
  error => {
    throw error
  }
)

$api.interceptors.response.use(
  (response: AxiosResponse<BaseResponse<any>>) => {
    if (!isProduction) {
      log({
        name: response.config.url ?? 'undefined url',
        data: response,
        type: 'response'
      })
    }

    if (CSRF_RESET_URLS.includes(response.config.url ?? '')) {
      csrfToken = null
    }

    // Редирект по "юзер без роли в организации" — паттерн из другого проекта, нет организаций тут
    // const hasSelectedOrganization = !!getOrganizationIdFromStore()
    // if (
    //   (!hasSelectedOrganization && response.data?.user?.id && !response.data?.user?.role) ||
    //   response.data?.data?.message === 'User not found in organization'
    // ) {
    //   const errorData: ErrorEventEmitter = { action: 'navigation', href: '/' }
    //   eventEmitter.emit('request-error', errorData)
    // }

    // Привязка телефона — только для MAX-платформы, тут её нет
    // if (response.data?.user?.phone === false && requiresPhoneBinding()) {
    //   const errorData: ErrorEventEmitter = {
    //     action: 'bottom-sheet',
    //     description: 'Для продолжения работы необходимо разрешить доступ к телефону...',
    //     message: 'Необходимо подтверждение телефона',
    //     variant: 'auth'
    //   }
    //   eventEmitter.emit('request-error', errorData)
    // }

    return response
  },
  async (error: AxiosError<ErrorResponse>) => {
    // Бинарные ручки (customInstanceBlob) шлют responseType: 'blob' на весь запрос,
    // из-за этого JSON-тело ошибки тоже приходит как Blob — перепарсиваем его в JSON
    if (error.response?.data instanceof Blob && error.response.data.type.includes('json')) {
      try {
        error.response.data = JSON.parse(await error.response.data.text())
      } catch {
        // тело не JSON — оставляем Blob как есть
      }
    }

    // 419 — CSRF-токен устарел (сессия пересоздана), следующий запрос получит новый
    if (error.response?.status === 419) {
      csrfToken = null
    }

    if (error.response?.status === 401) {
      clearAccessToken()
      // Сброс auth-стора (редирект на /login делают гварды). Мост через session-events,
      // чтобы не тянуть стор в request.ts напрямую (циклический импорт).
      emitUnauthorized()
    }

    logErrorDetails(error)

    // Доменные ошибки другого проекта (товары/категории/тарифы/роли) — нерелевантны тут
    // if (error.response?.data?.message === 'Product already exists in this organization') { ... }
    // if (error.response?.data?.message === 'Category with this name already exists') { ... }
    // if (error.response?.data?.message === 'Category already exists in this organization') { ... }
    // handleResponseError(error) // ROLE_FORBIDDEN / ORGANIZATION_DELETED / PLAN_LIMIT_EXCEEDED и т.д.

    throw error
  }
)

function logErrorDetails(error: AxiosError) {
  log({
    name: axios.isAxiosError(error) ? (error.config?.url ?? 'undefined url') : 'Not instance of AxiosError',
    data: error,
    type: 'catch'
  })
}

export default $api
