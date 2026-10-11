// Мост между API-слоем и React: request.ts и access-token.ts не знают про компоненты,
// а гварды подписываются сюда и перерисовываются при смене токена
type Listener = () => void

const listeners = new Set<Listener>()

export const subscribeSession = (listener: Listener): (() => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export const emitSessionChange = (): void => {
  listeners.forEach((listener) => listener())
}

const unauthorizedListeners = new Set<Listener>()

export const subscribeUnauthorized = (listener: Listener): (() => void) => {
  unauthorizedListeners.add(listener)
  return () => {
    unauthorizedListeners.delete(listener)
  }
}

// Бэк ответил 401: сессии больше нет. Подписчик сбрасывает пользователя в кэше — гарды уводят на логин
export const emitUnauthorized = (): void => {
  unauthorizedListeners.forEach((listener) => listener())
}
