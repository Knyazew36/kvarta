import { useEffect } from 'react'

// Статус-бар и панели браузера красим в фон приложения. Мета-теги в index.html знают только системную тему,
// а тему можно выбрать и вручную — поэтому следим за классом на <html> и берём цвет из CSS: источник один, global.css
export const useThemeColor = () => {
  useEffect(() => {
    const root = document.documentElement

    const sync = () => {
      const color = getComputedStyle(root).backgroundColor
      document
        .querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')
        .forEach((meta) => meta.setAttribute('content', color))
    }

    sync()
    const observer = new MutationObserver(sync)
    observer.observe(root, { attributes: true, attributeFilter: ['class'] })

    return () => observer.disconnect()
  }, [])
}
