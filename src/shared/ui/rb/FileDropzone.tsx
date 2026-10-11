import { useRef, useState } from 'react'
import { UploadIcon } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { ErrorText } from '@/shared/ui/rb/ErrorText'
import { Spinner } from '@/shared/ui/shadcn/spinner'

type Requirements = {
  mimeTypes: string[]
  maxSize: number
  // Те же требования словами — под зоной и в тексте отказа
  typesLabel: string
  sizeLabel: string
}

// Требования бэка к файлам по видам. images — фото отчёта (TaskPhotoController::store): HEIC не принимается
const REQUIREMENTS: Record<'images', Requirements> = {
  images: {
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxSize: 10 * 1024 * 1024,
    typesLabel: 'JPEG, PNG, WebP',
    sizeLabel: '10 МБ',
  },
}

type FileDropzoneProps = {
  // Получает только файлы, прошедшие проверку вида (kind) и лимита (maxFiles)
  onFiles: (files: File[]) => void
  // Вид файлов: зона сама ограничивает выбор, проверяет тип и размер и подписывает требования.
  // Без него принимает что угодно — проверка остаётся вызывающему
  kind?: keyof typeof REQUIREMENTS
  // Сколько файлов ещё можно добавить: лишние отбрасываются с пояснением
  maxFiles?: number
  // Маска для диалога выбора, когда kind не задан (image/*)
  accept?: string
  multiple?: boolean
  disabled?: boolean
  // Идёт загрузка: зона занята и новые файлы не принимает
  pending?: boolean
  title?: string
  // Дополнение к требованиям: например, «фото обязательно для сдачи»
  hint?: React.ReactNode
  className?: string
}

// Зона добавления файлов: клик открывает диалог выбора, файлы можно и перетащить сюда из проводника
export const FileDropzone = ({ onFiles, kind, maxFiles, accept, multiple = true, disabled, pending, title = 'Добавить фото', hint, className }: FileDropzoneProps) => {
  const [dragging, setDragging] = useState(false)
  const [rejected, setRejected] = useState<string[]>([])
  // dragenter/dragleave срабатывают и на вложенных элементах: считаем глубину, иначе подсветка мигает
  const depth = useRef(0)
  const blocked = disabled || pending
  const requirements = kind ? REQUIREMENTS[kind] : undefined

  const stop = (event: React.DragEvent) => {
    // Без этого браузер откроет брошенный файл вместо страницы
    event.preventDefault()
    event.stopPropagation()
  }

  const take = (files: File[]) => {
    const errors: string[] = []
    let accepted = multiple ? files : files.slice(0, 1)
    if (requirements) {
      accepted = accepted.filter((file) => {
        if (!requirements.mimeTypes.includes(file.type)) errors.push(`${file.name}: только ${requirements.typesLabel}`)
        else if (file.size > requirements.maxSize) errors.push(`${file.name}: больше ${requirements.sizeLabel}`)
        else return true
        return false
      })
    }
    if (maxFiles !== undefined && accepted.length > maxFiles) {
      errors.push(`Можно добавить ещё ${maxFiles}: лишние не загружены`)
      accepted = accepted.slice(0, maxFiles)
    }
    setRejected(errors)
    if (accepted.length > 0) onFiles(accepted)
  }

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <label
        aria-disabled={blocked || undefined}
        className={cn(
          'flex cursor-pointer flex-col items-center gap-2 rounded-3xl border-[1.5px] border-dashed border-ash px-6 py-8 text-center transition-colors focus-within:border-foreground hover:border-foreground hover:bg-mist aria-disabled:cursor-default aria-disabled:opacity-60 aria-disabled:hover:border-ash aria-disabled:hover:bg-transparent',
          dragging && 'border-foreground bg-mist',
        )}
        onDragEnter={(event) => {
          stop(event)
          if (blocked) return
          depth.current += 1
          setDragging(true)
        }}
        onDragOver={stop}
        onDragLeave={(event) => {
          stop(event)
          depth.current = Math.max(0, depth.current - 1)
          if (depth.current === 0) setDragging(false)
        }}
        onDrop={(event) => {
          stop(event)
          depth.current = 0
          setDragging(false)
          if (blocked) return
          const files = [...event.dataTransfer.files]
          if (files.length > 0) take(files)
        }}
      >
        <input
          type="file"
          accept={requirements ? requirements.mimeTypes.join(',') : accept}
          multiple={multiple}
          className="sr-only"
          disabled={blocked}
          onChange={(event) => {
            const files = [...(event.target.files ?? [])]
            // Сброс значения: тот же файл можно выбрать повторно после ошибки
            event.target.value = ''
            if (files.length > 0) take(files)
          }}
        />
        <span className="flex size-12 items-center justify-center rounded-full bg-mist">{pending ? <Spinner /> : <UploadIcon className="size-5" aria-hidden />}</span>
        <span className="text-body-sm font-medium">{pending ? 'Загружаем…' : dragging ? 'Отпустите, чтобы загрузить' : title}</span>
        <span className="text-caption text-slate">или перетащите файлы сюда</span>
        {(requirements || hint) && (
          <span className="mono-label text-smoke">
            {requirements && `${requirements.typesLabel} · до ${requirements.sizeLabel}`}
            {requirements && hint && ' · '}
            {hint}
          </span>
        )}
      </label>
      <ErrorText errors={rejected} />
    </div>
  )
}
