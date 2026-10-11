import { splitFieldErrors } from '@/widgets/task-actions/task-field-errors'

// Бэк называет поля серии по-разному: вложенные валидаторы отдают голое имя (title, weekdays),
// собственные проверки — с префиксом (schedule.start_date). Форма плоская, поэтому принимаем оба варианта
const PREFIXES = ['', 'schedule.', 'template.']

// Ошибка на объекте целиком — показываем у первого поля его группы
const ALIASES: Record<string, string> = {
  schedule: 'frequency',
  template: 'title',
}

export const splitSeriesFieldErrors = <Name extends string>(error: unknown, names: readonly Name[]) => {
  const fields: Record<string, Name> = {}
  for (const name of names) {
    for (const prefix of PREFIXES) fields[`${prefix}${name}`] = name
  }
  for (const [field, name] of Object.entries(ALIASES)) {
    if (names.includes(name as Name)) fields[field] = name as Name
  }
  return splitFieldErrors(error, fields)
}
