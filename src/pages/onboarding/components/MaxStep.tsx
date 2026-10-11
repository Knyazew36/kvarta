import { ExternalLinkIcon } from 'lucide-react'

import { DEMO_TZ } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { MOCK_BORDER } from '@/shared/mock/mock-border'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { CopyButton } from '@/shared/ui/shadcn/animate-ui/components/buttons/copy'

// Мок: код привязки бота не приходит с бэка
const BOT_CODE = '/start volna-4821'

export const MaxStep = ({ onDone }: { onDone: () => void }) => (
  <div className={cn('flex flex-col gap-5 rounded-3xl p-3', MOCK_BORDER)}>
    <ol className="text-body-sm flex flex-col gap-3">
      <li className="flex items-start gap-3">
        <span className="mono-label text-smoke mt-0.5">01</span>
        <span className="flex flex-1 flex-col gap-2">
          Откройте бота Rentybot в MAX
          <Button variant="outline" size="sm" className="bg-canvas self-start">
            <ExternalLinkIcon /> Открыть MAX
          </Button>
        </span>
      </li>
      <li className="flex items-start gap-3">
        <span className="mono-label text-smoke mt-0.5">02</span>
        <span className="flex flex-1 flex-col gap-2">
          Отправьте боту команду — она связывает чат с вашей организацией
          <span className="bg-background flex w-fit items-center gap-2 rounded-2xl p-1 pl-4">
            <span className="text-body-sm font-mono">{BOT_CODE}</span>
            <CopyButton content={BOT_CODE} size="sm" variant="ghost" className="rounded-xl" aria-label="Скопировать команду" />
          </span>
        </span>
      </li>
    </ol>
    <div className="bg-background flex flex-wrap items-center justify-between gap-3 rounded-3xl p-4">
      <span className="text-body-sm text-slate inline-flex items-center gap-2">
        <span className="bg-foreground size-2 animate-pulse rounded-full" aria-hidden />
        Ждём сообщение от бота · код действует до 10:40 {DEMO_TZ}
      </span>
      {/* В макете подтверждение имитируется кнопкой: в продукте оно приходит от бота само */}
      <Button size="sm" variant="ghost" onClick={onDone}>
        Я отправил
      </Button>
    </div>
  </div>
)
