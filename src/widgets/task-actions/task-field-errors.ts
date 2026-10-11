import { getFieldErrors } from '@/shared/api/model/getFieldErrors'

// Ошибки полей из 422, разложенные по полям формы. fields: поле бэка → поле формы (срок на бэке — due_at и timezone,
// в форме — дата и время). Незнакомые поля возвращаются в rest: их показывает общая ошибка формы
export const splitFieldErrors = <Name extends string>(error: unknown, fields: Record<string, Name>): { known: { name: Name; message: string }[]; rest: string[] } => {
  const messages = new Map<Name, string[]>()
  const rest: string[] = []
  for (const [field, errors] of Object.entries(getFieldErrors(error))) {
    const name = fields[field]
    if (name) messages.set(name, [...(messages.get(name) ?? []), ...errors])
    else rest.push(...errors)
  }
  return { known: [...messages].map(([name, errors]) => ({ name, message: errors.join(', ') })), rest }
}
