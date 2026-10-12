import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
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
