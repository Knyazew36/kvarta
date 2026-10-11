import { useLocation, useSearchParams } from 'react-router'

export type AuthMode = 'login' | 'register'

// Состояние, которое страницы входа передают друг другу через location.state:
// адрес возврата живёт весь путь, почта и имя — между формой и страницей кода
export type AuthFlowState = {
  from?: string
  mode?: AuthMode
  email?: string
  name?: string
}

// Адрес возврата приходит либо из state (редирект гарда), либо из ?from= (прямая ссылка)
export const useAuthFlowState = (): AuthFlowState => {
  const location = useLocation()
  const [params] = useSearchParams()
  const state = (location.state as AuthFlowState | null) ?? {}

  return { ...state, from: state.from ?? params.get('from') ?? undefined }
}
