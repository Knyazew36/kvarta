import { lazy, Suspense, useState } from 'react'
import { useTaskPhotoUrls } from '@/entities/task'
import type { Task, TaskPhoto } from '@/shared/api/generated/models'

// Библиотека галереи и её стили качаются по первому клику на миниатюру, а не вместе со страницей задачи
const PhotoLightbox = lazy(() => import('@/shared/ui/rb/PhotoLightbox').then((module) => ({ default: module.PhotoLightbox })))

type TaskPhotoGalleryProps = {
  task: Pick<Task, 'organization_id' | 'id'>
  // Набор, который листается: черновик отчёта или фото отправленного отчёта
  photos: TaskPhoto[]
  // id фото, по миниатюре которого кликнули; null — галерея закрыта
  openedId: number | null
  onClose: () => void
}

// Галерея набора фото задачи. Файлы закрытые и качаются по сессии, поэтому ссылки собираются здесь,
// а не в миниатюрах: пока галерея закрыта, лишних ссылок в памяти нет
export const TaskPhotoGallery = ({ task, photos, openedId, onClose }: TaskPhotoGalleryProps) => {
  // После первого открытия галерея остаётся в дереве: иначе закрытие обрывало бы её анимацию
  const [wasOpened, setWasOpened] = useState(false)
  if (openedId !== null && !wasOpened) setWasOpened(true)

  const urls = useTaskPhotoUrls(
    task.organization_id,
    task.id,
    photos.map((photo) => photo.id),
    { enabled: openedId !== null },
  )

  // Недоступное фото (404) в галерею не попадает — индекс считаем уже по показанным
  const shown = photos.flatMap((photo, index) => {
    const src = urls[index]
    return src ? [{ id: photo.id, src, alt: `Фото ${photo.id}` }] : []
  })
  const index = openedId === null ? -1 : shown.findIndex((slide) => slide.id === openedId)

  if (!wasOpened) return null

  return (
    <Suspense fallback={null}>
      <PhotoLightbox slides={shown} index={index >= 0 ? index : null} onClose={onClose} />
    </Suspense>
  )
}
