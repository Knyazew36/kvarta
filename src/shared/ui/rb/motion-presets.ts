// Одна кривая на весь продукт: быстрый старт, долгое мягкое торможение — движение «оседает», а не пружинит
export const EASE = [0.22, 1, 0.36, 1] as const

// Плавная смена содержимого на месте (шаги формы): старое уходит вверх и гаснет, новое приходит снизу
export const swapTransition = {
  initial: { opacity: 0, y: 10, filter: 'blur(6px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.45, ease: EASE } },
  exit: { opacity: 0, y: -8, filter: 'blur(6px)', transition: { duration: 0.25, ease: EASE } },
}
