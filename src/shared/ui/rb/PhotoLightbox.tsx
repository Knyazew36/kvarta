import { ChevronLeftIcon, ChevronRightIcon, XIcon, ZoomInIcon, ZoomOutIcon } from 'lucide-react'
import Lightbox from 'yet-another-react-lightbox'
import Counter from 'yet-another-react-lightbox/plugins/counter'
import Thumbnails from 'yet-another-react-lightbox/plugins/thumbnails'
import Zoom from 'yet-another-react-lightbox/plugins/zoom'
import 'yet-another-react-lightbox/styles.css'
import 'yet-another-react-lightbox/plugins/counter.css'
import 'yet-another-react-lightbox/plugins/thumbnails.css'

type PhotoLightboxProps = {
  slides: { src: string; alt?: string }[]
  // Какое фото открыто; null — галерея закрыта
  index: number | null
  onClose: () => void
}

// Переменные библиотеки под токены проекта: плотный тёмный фон (фото должно читаться в обеих темах),
// круглые кнопки и скруглённые миниатюры, как в остальном интерфейсе
const STYLES = {
  root: {
    '--yarl__color_backdrop': 'rgb(10 10 10 / 0.92)',
    '--yarl__color_button': 'rgb(255 255 255 / 0.85)',
    '--yarl__color_button_active': '#fff',
    '--yarl__color_button_disabled': 'rgb(255 255 255 / 0.25)',
    '--yarl__button_background_color': 'rgb(255 255 255 / 0.1)',
    '--yarl__button_filter': 'none',
    '--yarl__button_padding': '10px',
    '--yarl__button_margin': '4px',
    '--yarl__icon_size': '20px',
    '--yarl__toolbar_padding': '12px',
    '--yarl__counter_filter': 'none',
    '--yarl__thumbnails_container_background_color': 'transparent',
    '--yarl__thumbnails_container_padding': '12px',
    '--yarl__thumbnails_thumbnail_background': 'rgb(255 255 255 / 0.08)',
    '--yarl__thumbnails_thumbnail_border_color': 'transparent',
    '--yarl__thumbnails_thumbnail_active_border_color': '#fff',
    '--yarl__thumbnails_thumbnail_border_radius': '14px',
    '--yarl__thumbnails_thumbnail_padding': '0px',
    '--yarl__thumbnails_thumbnail_gap': '8px',
  },
  button: { borderRadius: '9999px' },
  navigationPrev: { marginLeft: '12px' },
  navigationNext: { marginRight: '12px' },
} as const

const LABELS = {
  Previous: 'Предыдущее фото',
  Next: 'Следующее фото',
  Close: 'Закрыть',
  'Zoom in': 'Увеличить',
  'Zoom out': 'Уменьшить',
  Lightbox: 'Галерея фото',
  'Photo gallery': 'Галерея фото',
  '{index} of {total}': '{index} из {total}',
}

// Галерея фото поверх страницы: листание стрелками и свайпом, зум колесом, щипком и двойным кликом.
// Единственное место, где настраивается библиотека: страницы передают только ссылки на фото
export const PhotoLightbox = ({ slides, index, onClose }: PhotoLightboxProps) => {
  const single = slides.length < 2

  return (
    <Lightbox
      open={index !== null && slides.length > 0}
      close={onClose}
      index={index ?? 0}
      slides={slides}
      // Полоса миниатюр нужна только для выбора между несколькими фото
      plugins={single ? [Zoom] : [Zoom, Counter, Thumbnails]}
      carousel={{ finite: single, imageFit: 'contain', padding: '16px' }}
      controller={{ closeOnBackdropClick: true }}
      zoom={{ maxZoomPixelRatio: 3, scrollToZoom: true }}
      thumbnails={{ width: 72, height: 72, border: 2, imageFit: 'cover', vignette: false }}
      counter={{ container: { className: 'mono-label', style: { top: 'unset', bottom: 0, left: '50%', transform: 'translateX(-50%)' } } }}
      labels={LABELS}
      styles={STYLES}
      render={{
        iconPrev: () => <ChevronLeftIcon className="size-5" aria-hidden />,
        iconNext: () => <ChevronRightIcon className="size-5" aria-hidden />,
        iconClose: () => <XIcon className="size-5" aria-hidden />,
        iconZoomIn: () => <ZoomInIcon className="size-5" aria-hidden />,
        iconZoomOut: () => <ZoomOutIcon className="size-5" aria-hidden />,
        // При одном фото листать нечего
        ...(single ? { buttonPrev: () => null, buttonNext: () => null } : {}),
      }}
    />
  )
}
