import { cn } from '@/shared/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/shadcn/avatar'

type PersonAvatarProps = {
  name: string
  src?: string
  size?: 'xs' | 'sm' | 'default' | 'lg' | 'xl'
  // inverse — для карточек на чёрном; accent — выделить текущего пользователя mint-кружком
  tone?: 'default' | 'inverse' | 'accent'
  className?: string
}

const SIZE: Record<NonNullable<PersonAvatarProps['size']>, string> = {
  xs: 'size-6 text-[10px]',
  sm: 'size-8 text-caption',
  default: 'size-10 text-body-sm',
  lg: 'size-12 text-body',
  xl: 'size-20 text-heading-sm',
}

// Силуэт рисуется цветом текста подложки, поэтому подходит всем тонам и обеим темам
const DefaultAvatar = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="size-full opacity-40" aria-hidden>
    <circle cx="12" cy="9.5" r="4" />
    <path d="M4 22c0-4.4 3.6-7 8-7s8 2.6 8 7z" />
  </svg>
)

// Без фото — один силуэт по умолчанию на монохромной подложке: цветом людей не различаем, акцент только у «я»
export const PersonAvatar = ({ name, src, size = 'default', tone = 'default', className }: PersonAvatarProps) => (
  <Avatar className={cn(SIZE[size], className)} title={name}>
    {src && <AvatarImage src={src} alt={name} />}
    <AvatarFallback
      className={cn(
        'overflow-hidden',
        tone === 'default' && 'bg-mist text-foreground',
        tone === 'inverse' && 'bg-background/15 text-background',
        tone === 'accent' && 'bg-success text-foreground',
      )}
    >
      <DefaultAvatar />
    </AvatarFallback>
  </Avatar>
)

// Человек с ролью/подписью рядом — исполнитель, проверяющий, ответственный
export const PersonLine = ({
  name,
  caption,
  size = 'sm',
  className,
}: {
  name: string
  caption?: React.ReactNode
  size?: PersonAvatarProps['size']
  className?: string
}) => (
  <span className={cn('inline-flex min-w-0 items-center gap-2', className)}>
    <PersonAvatar name={name} size={size} />
    <span className="flex min-w-0 flex-col">
      <span className="truncate text-body-sm font-medium">{name}</span>
      {caption && <span className="mono-label truncate text-smoke">{caption}</span>}
    </span>
  </span>
)

// Имя в строке текста — подсказки, факты, мета-строки: аватар не должен ломать высоту строки
export const PersonName = ({
  name,
  tone,
  className,
}: {
  name: string
  tone?: PersonAvatarProps['tone']
  className?: string
}) => (
  <span className={cn('inline-flex min-w-0 items-center gap-1.5 align-middle', className)}>
    <PersonAvatar name={name} size="xs" tone={tone} className="size-5 text-[9px]" />
    <span className="truncate">{name}</span>
  </span>
)
