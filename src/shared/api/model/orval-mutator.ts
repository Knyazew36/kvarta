import type { AxiosRequestConfig } from 'axios'

import $api from './request'

// Точка входа для сгенерированных orval-функций: все запросы идут через единый $api.
// Возвращаем тело ответа как есть — схемы OpenAPI уже описывают его целиком
// (`{ data }`, `{ data, meta, links }`, `{ csrf_token }`), разворачивать нечего.
// options — второй аргумент сгенерированной функции (signal от react-query, headers и т.д.).
export const customInstance = <T>(config: AxiosRequestConfig, options?: AxiosRequestConfig): Promise<T> => {
  return $api<T>({ ...config, ...options }).then(res => res.data)
}

export default customInstance
