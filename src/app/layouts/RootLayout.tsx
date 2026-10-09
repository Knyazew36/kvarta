import { Outlet, ScrollRestoration } from 'react-router'
import { env } from '@/env'
import { DemoSwitcher } from '@/widgets/demo-switcher/DemoSwitcher'
import { UxMapWidget } from '@/widgets/ux-map/UxMapWidget'

// Обёртка без своего <main>: у кабинета и гостевых страниц собственная разметка оболочки
// ScrollRestoration: новый переход открывает страницу сверху, «назад/вперёд» возвращает прежнюю позицию
const RootLayout = () => (
  <>
    <Outlet />
    <ScrollRestoration />
    {env.DEMO && <DemoSwitcher />}
    {env.DEMO && <UxMapWidget />}
  </>
)

export default RootLayout
