import { LinkIcon } from 'lucide-react'

import { cn } from '@/shared/lib/utils'
import { MOCK_BORDER } from '@/shared/mock/mock-border'
import { SourceMark } from '@/shared/ui/rb/SourceTag'
import { LinkListingDialog } from '@/widgets/property-actions/LinkListingDialog'

// Мок: ручек подключения площадок на бэке нет, диалог ничего не сохраняет
// Три результата подключения различаются (§3): здесь видно, на каком сейчас площадка
export const ChannelStep = ({ propertyName }: { propertyName: string }) => (
  <div className={cn('flex flex-col gap-5 rounded-3xl p-3', MOCK_BORDER)}>
    <div className="grid gap-2 sm:grid-cols-2">
      {(['avito', 'sutochno'] as const).map((source) => (
        <LinkListingDialog
          key={source}
          property={propertyName}
          defaultSource={source}
          trigger={
            <button
              type="button"
              className="bg-background hover:bg-mist focus-visible:ring-ring/30 flex items-center gap-3 rounded-3xl p-4 text-left transition-colors outline-none focus-visible:ring-3"
            >
              <SourceMark source={source} size="md" />
              <span className="flex flex-1 flex-col">
                <span className="text-body-sm font-medium">{source === 'avito' ? 'Авито' : 'Суточно'}</span>
                <span className="text-caption text-smoke">ссылка на объявление</span>
              </span>
              <LinkIcon className="text-smoke size-4" aria-hidden />
            </button>
          }
        />
      ))}
    </div>
    <ol className="text-caption text-slate grid grid-cols-3 gap-2">
      {['Ссылка сохранена', 'Доступ подтверждён', 'Брони получены'].map((label, index) => (
        <li key={label} className="flex flex-col gap-1.5">
          <span className="bg-mist h-1 rounded-full" />
          <span>
            <span className="mono-label text-smoke">{String(index + 1).padStart(2, '0')}</span> {label}
          </span>
        </li>
      ))}
    </ol>
    <p className="text-caption text-smoke">Одной площадки достаточно. Без площадок объект работает с ручными бронями.</p>
  </div>
)
