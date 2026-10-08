// Единая точка чтения env: опечатка в имени переменной ловится типами, а не в рантайме
export const env = {
  VITE_API_URL_PROD: import.meta.env.VITE_API_URL_PROD as string,
}
