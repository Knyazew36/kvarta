import { useState } from 'react'
import { CheckIcon, ImageIcon, LoaderIcon, RotateCwIcon, TriangleAlertIcon } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { FileDropzone } from '@/shared/ui/rb/FileDropzone'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

export type UploadFile = {
  id: string
  name: string
  size: string
  state: 'uploaded' | 'uploading' | 'failed'
  progress?: number
}

type FileUploaderProps = {
  files: UploadFile[]
  required?: boolean
  hint?: string
  readOnly?: boolean
  className?: string
}

// У каждого файла своё состояние (§9): неуспешная загрузка не считается принятым отчётом
export const FileUploader = ({ files: initial, required, hint, readOnly, className }: FileUploaderProps) => {
  const [files, setFiles] = useState(initial)
  const uploaded = files.filter((file) => file.state === 'uploaded').length

  const retry = (id: string) =>
    setFiles((prev) => prev.map((file) => (file.id === id ? { ...file, state: 'uploading', progress: 35 } : file)))

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {!readOnly && (
        <FileDropzone
          kind="images"
          hint={[hint, required && 'фото обязательно для сдачи'].filter(Boolean).join(' · ') || undefined}
          onFiles={(added) =>
            setFiles((prev) => [...prev, ...added.map((file) => ({ id: crypto.randomUUID(), name: file.name, size: `${(file.size / 1024 / 1024).toFixed(1)} МБ`, state: 'uploaded' as const }))])
          }
        />
      )}
      {files.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {files.map((file) => (
            <li
              key={file.id}
              className={cn('flex items-center gap-3 rounded-2xl px-3 py-2.5', file.state === 'failed' ? 'bg-destructive/10' : 'bg-mist')}
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-card">
                <ImageIcon className="size-4 text-slate" aria-hidden />
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="truncate text-body-sm font-medium">{file.name}</span>
                {file.state === 'uploading' ? (
                  <div className="h-1 w-full overflow-hidden rounded-full bg-ash/50">
                    <div className="h-full rounded-full bg-foreground" style={{ width: `${file.progress ?? 50}%` }} />
                  </div>
                ) : (
                  <span className={cn('mono-label', file.state === 'failed' ? 'text-destructive' : 'text-smoke')}>
                    {file.state === 'failed' ? 'Не загружено · нет сети' : file.size}
                  </span>
                )}
              </div>
              {file.state === 'uploaded' && (
                <span className="flex items-center gap-1 text-caption font-medium">
                  <CheckIcon className="size-3.5" aria-hidden /> Загружено
                </span>
              )}
              {file.state === 'uploading' && (
                <span className="flex items-center gap-1 text-caption text-slate">
                  <LoaderIcon className="size-3.5 animate-spin" aria-hidden /> {file.progress ?? 50}%
                </span>
              )}
              {file.state === 'failed' && (
                <Button size="xs" variant="outline" onClick={() => retry(file.id)}>
                  <RotateCwIcon /> Повторить
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
      {required && uploaded === 0 && (
        <p className="flex items-center gap-1.5 text-caption text-slate">
          <TriangleAlertIcon className="size-3.5" aria-hidden />
          Без загруженного фото задачу нельзя отправить на проверку
        </p>
      )}
    </div>
  )
}
