import { ImageOffIcon, Trash2Icon, TriangleAlertIcon } from 'lucide-react'
import { useState } from 'react'
import { useDeleteTaskPhoto, useTaskPhotoUrl, useUploadTaskPhoto } from '@/entities/task'
import type { Task, TaskPhoto } from '@/shared/api/generated/models'
import { FileDropzone } from '@/shared/ui/rb/FileDropzone'
import { SectionCard } from '@/shared/ui/rb/Section'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Skeleton } from '@/shared/ui/shadcn/skeleton'
import { TaskPhotoGallery } from './TaskPhotoGallery'

// Лимит бэка на отчёт (TaskPhotoController::store); тип и размер файла проверяет сама зона загрузки
const MAX_PHOTOS = 10

type TaskPhotoThumbProps = {
  task: Pick<Task, 'organization_id' | 'id'>
  photo: TaskPhoto
  action?: React.ReactNode
  // Клик по миниатюре открывает галерею набора на этом фото
  onOpen?: () => void
}

// Превью закрытого фото: файл качается по сессии, публичной ссылки у него нет
export const TaskPhotoThumb = ({ task, photo, action, onOpen }: TaskPhotoThumbProps) => {
  const { url, isError } = useTaskPhotoUrl(task.organization_id, task.id, photo.id)

  return (
    <li className="group relative aspect-square overflow-hidden rounded-2xl bg-mist">
      {url ? (
        <button type="button" aria-label="Открыть фото" onClick={onOpen} className="block size-full cursor-zoom-in outline-none focus-visible:ring-3 focus-visible:ring-ring/30">
          <img src={url} alt={`Фото ${photo.id}`} className="size-full object-cover transition-transform group-hover:scale-105" />
        </button>
      ) : isError ? (
        <span className="flex size-full flex-col items-center justify-center gap-1 text-caption text-smoke">
          <ImageOffIcon className="size-5" aria-hidden /> Недоступно
        </span>
      ) : (
        <Skeleton className="size-full rounded-none" />
      )}
      {action && <span className="absolute top-1.5 right-1.5">{action}</span>}
    </li>
  )
}

// Черновик отчёта: фото исполнителя до отправки. После отправки они переезжают в отчёт и больше не удаляются
export const TaskPhotos = ({ task }: { task: Task }) => {
  const uploadPhoto = useUploadTaskPhoto(task.organization_id, task.id)
  const deletePhoto = useDeleteTaskPhoto(task.organization_id, task.id)
  const [opened, setOpened] = useState<number | null>(null)
  const canUpload = task.allowed_actions.includes('upload_photo')
  const canDelete = task.allowed_actions.includes('delete_photo')
  const left = MAX_PHOTOS - task.draft_photos.length
  const busy = uploadPhoto.isPending || deletePhoto.isPending

  if (!canUpload && task.draft_photos.length === 0) return null

  const upload = async (photos: File[]) => {
    // По одному и по очереди: каждая загрузка увеличивает version, следующая должна уйти уже с новой
    let version = task.version
    for (const photo of photos) {
      try {
        version = (await uploadPhoto.mutateAsync({ version, photo })).version
      } catch {
        // Причину показал общий тост; остальные файлы с устаревшей версией отправлять бессмысленно
        break
      }
    }
  }

  return (
    <SectionCard title="Фото к отчёту" count={`${task.draft_photos.length}/${MAX_PHOTOS}`}>
      <div className="flex flex-col gap-3">
        {canUpload && left > 0 && (
          <FileDropzone
            kind="images"
            maxFiles={left}
            disabled={deletePhoto.isPending}
            pending={uploadPhoto.isPending}
            hint={task.requires_photo ? 'фото обязательно для сдачи' : undefined}
            onFiles={(files) => void upload(files)}
          />
        )}

        {task.draft_photos.length > 0 && (
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {task.draft_photos.map((photo) => (
              <TaskPhotoThumb
                key={photo.id}
                task={task}
                photo={photo}
                onOpen={() => setOpened(photo.id)}
                action={
                  canDelete && (
                    <Button
                      size="icon-sm"
                      variant="secondary"
                      aria-label="Удалить фото"
                      disabled={busy}
                      onClick={() => deletePhoto.mutate({ photoId: photo.id, version: task.version })}
                    >
                      <Trash2Icon />
                    </Button>
                  )
                }
              />
            ))}
          </ul>
        )}
        <TaskPhotoGallery task={task} photos={task.draft_photos} openedId={opened} onClose={() => setOpened(null)} />

        {task.requires_photo && task.draft_photos.length === 0 && (
          <p className="flex items-center gap-1.5 text-caption text-slate">
            <TriangleAlertIcon className="size-3.5" aria-hidden />
            Без загруженного фото отчёт отправить нельзя
          </p>
        )}
      </div>
    </SectionCard>
  )
}
