import { matchPath, Outlet, ScrollRestoration, useLocation } from 'react-router'
import { env } from '@/env'
import { ROUTES } from '@/shared/config/paths'
import { DemoSwitcher } from '@/widgets/demo-switcher/DemoSwitcher'
import { UxMapWidget } from '@/widgets/ux-map/UxMapWidget'

// Обёртка без своего <main>: у кабинета и гостевых страниц собственная разметка оболочки
// ScrollRestoration: новый переход открывает страницу сверху, «назад/вперёд» возвращает прежнюю позицию
// Страницы с настоящей логикой: демо-панели (варианты макета, карта путей) на них не показываем
const PAGES_WITHOUT_DEMO_TOOLS: string[] = [
  ROUTES.LOGIN,
  ROUTES.REGISTER,
  ROUTES.OTP,
  ROUTES.WORKSPACES,
  ROUTES.ORG_NEW,
  ROUTES.ONBOARDING,
  ROUTES.NOTIFICATIONS,
  ROUTES.PROPERTIES,
  // Со всеми вкладками объекта
  `${ROUTES.PROPERTY}/*`,
]

const LayoutRoot = () => {
  const { pathname } = useLocation()
  const showDemoTools = env.DEMO && !PAGES_WITHOUT_DEMO_TOOLS.some((pattern) => matchPath(pattern, pathname))

  return (
    <>
      <Outlet />
      <ScrollRestoration />
      {showDemoTools && <DemoSwitcher />}
      {showDemoTools && <UxMapWidget />}
    </>
  )
}

export default LayoutRoot
