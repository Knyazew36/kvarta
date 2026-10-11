import { defineConfig } from 'orval'

// orval генерирует только функции запросов и типы. react-query (хуки, ключи) пишется руками в entities.
export default defineConfig({
  api: {
    input: {
      target: 'https://api.rentybot.ru/docs/openapi.yaml',
    },
    output: {
      mode: 'tags-split',
      target: './src/shared/api/generated/endpoints.ts',
      schemas: './src/shared/api/generated/models',
      client: 'axios-functions',
      clean: true,
      indexFiles: true,
      override: {
        // Все запросы идут через единый инстанс $api (baseURL, cookies, CSRF, интерцепторы)
        mutator: {
          path: './src/shared/api/model/orval-mutator.ts',
          name: 'customInstance',
        },
      },
    },
  },
})
