import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Rentybot',
        short_name: 'Rentybot',
        description: 'Все объекты. Один экран.',
        lang: 'ru',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        cleanupOutdatedCaches: true,
        // Бандл пока один и весит ~2.9 МБ — больше лимита workbox в 2 МБ; без этого оболочка не попадёт в precache
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        navigateFallback: '/index.html',
        // API в кэш не попадает: сессия и CSRF живут только в сети, а оффлайн-ответ тут хуже ошибки
        navigateFallbackDenylist: [/^\/api\//],
      },
    }),
  ],
  server: {
    // Dev ходит на API через тот же origin: бэк не отдаёт CORS для localhost, а cookies сессии SameSite=Lax
    proxy: {
      '/api': {
        target: 'https://api.rentybot.ru',
        changeOrigin: true,
        // Бэк ставит куки Secure; SameSite=None. По http на IP в локальной сети (не localhost) браузер их выбрасывает —
        // сессия каждый раз новая, отсюда CSRF token mismatch. Через proxy запросы same-origin, хватает Lax без Secure
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes) => {
            const cookies = proxyRes.headers['set-cookie']
            if (!cookies) return
            proxyRes.headers['set-cookie'] = cookies.map((cookie) =>
              cookie.replace(/;\s*secure/gi, '').replace(/;\s*samesite=none/gi, '; SameSite=Lax'),
            )
          })
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
