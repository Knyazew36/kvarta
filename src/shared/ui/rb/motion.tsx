import { type HTMLMotionProps, motion, type Variants } from 'motion/react'

import { cn } from '@/shared/lib/utils'
import { EASE } from './motion-presets'

const revealVariants: Variants = {
  hidden: { opacity: 0, y: 14, filter: 'blur(8px)' },
  shown: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.8, ease: EASE } },
}

type RevealProps = HTMLMotionProps<'div'> & { delay?: number }

// Появление блока: проявляется из лёгкого размытия и чуть поднимается. Размытие вместо большого сдвига — спокойнее и дороже
export const Reveal = ({ delay = 0, children, ...props }: RevealProps) => (
  <motion.div
    initial={{ opacity: 0, y: 14, filter: 'blur(8px)' }}
    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
    transition={{ duration: 0.8, ease: EASE, delay }}
    {...props}
  >
    {children}
  </motion.div>
)

type RevealGroupProps = HTMLMotionProps<'div'> & { delay?: number; stagger?: number; as?: 'div' | 'ul' | 'ol' }

// Группа с волной: дети RevealItem появляются по очереди. Шаг маленький — волна читается как одно движение
export const RevealGroup = ({ delay = 0, stagger = 0.07, as = 'div', className, children, ...props }: RevealGroupProps) => {
  const Component = motion[as] as typeof motion.div
  return (
    <Component
      initial="hidden"
      animate="shown"
      variants={{ hidden: {}, shown: { transition: { delayChildren: delay, staggerChildren: stagger } } }}
      className={className}
      {...props}
    >
      {children}
    </Component>
  )
}

export const RevealItem = ({ as = 'div', className, children, ...props }: HTMLMotionProps<'div'> & { as?: 'div' | 'li' }) => {
  const Component = motion[as] as typeof motion.div
  return (
    <Component variants={revealVariants} className={className} {...props}>
      {children}
    </Component>
  )
}

type SplitHeadlineProps = {
  // Перенос строки задаётся символом «\n»: строки заголовка выбраны явно, а не шириной контейнера
  text: string
  as?: 'h1' | 'h2'
  delay?: number
  // Класс отдельной строки — например, акцентный цвет второй строки
  lineClassName?: (line: number) => string | undefined
  className?: string
}

// Заголовок поднимается по словам из-под линии строки — главный момент экрана, поэтому он один и не повторяется ниже.
// Скринридер читает целую фразу из aria-label, а не набор отдельных слов
export const SplitHeadline = ({ text, as = 'h1', delay = 0, lineClassName, className }: SplitHeadlineProps) => {
  const Tag = as
  const lines = text.split('\n').map((line) => line.split(' '))
  // Сквозной номер первого слова строки: волна идёт через все строки, а не начинается заново
  const offsets = lines.map((_, line) => lines.slice(0, line).reduce((sum, words) => sum + words.length, 0))
  return (
    <Tag aria-label={text.replace(/\n/g, ' ')} className={className}>
      {lines.map((words, line) => (
        <span key={line} aria-hidden className={cn(lines.length > 1 && 'block', lineClassName?.(line))}>
          {words.map((word, index) => (
            // Отрицательный нижний отступ с паддингом оставляет место выносным элементам («у», «д»), иначе маска их режет
            <span key={`${word}-${index}`} className="-mb-[0.14em] inline-block overflow-hidden pb-[0.14em] align-top">
              <motion.span
                className="inline-block"
                initial={{ y: '110%' }}
                animate={{ y: 0 }}
                transition={{ duration: 0.9, ease: EASE, delay: delay + (offsets[line] + index) * 0.06 }}
              >
                {word}
                {index < words.length - 1 && ' '}
              </motion.span>
            </span>
          ))}
        </span>
      ))}
    </Tag>
  )
}

// Обёртка для блока, чья высота меняется: соседи сдвигаются плавно, а не прыгают
export const SmoothHeight = ({ className, children }: { className?: string; children: React.ReactNode }) => (
  <motion.div layout transition={{ layout: { duration: 0.45, ease: EASE } }} className={cn(className)}>
    {children}
  </motion.div>
)
