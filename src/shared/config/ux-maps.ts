import type { DemoRole } from '@/shared/mock/state'
import { DEMO_ORG_ID, ROUTES, to } from './paths'

export type UxRole = 'guest' | 'owner' | 'manager' | 'employee' | 'specialist'

export type UxBranch = { label: string; href: string }

export type UxStep = {
  title: string
  href: string
  // Что человек делает на шаге — одной фразой, чтобы карта читалась без открытия экрана
  note: string
  branches?: UxBranch[]
  // Экран свёрстан, но маршрут ещё не подключён
  soon?: boolean
}

export type UxJourney = {
  id: string
  title: string
  goal: string
  steps: UxStep[]
}

export type UxRoleMap = {
  role: UxRole
  label: string
  who: string
  // Где живёт роль: оболочка и точка входа
  entry: string
  // Роль кабинета подставляется в ссылки как ?role=, у гостя и специалиста своих ролей в демо нет
  demoRole?: DemoRole
  sees: string[]
  hidden: string[]
  journeys: UxJourney[]
}

const o = DEMO_ORG_ID

// Карты путей по ролям: кто, откуда приходит, какие экраны проходит. Для просмотра макетов глазами, не для прав в продукте
export const UX_MAPS: UxRoleMap[] = [
  {
    role: 'guest',
    label: 'Гость',
    who: 'Снимает жильё у конкретного владельца. Без входа в кабинет, прежде всего с телефона или из MAX.',
    entry: 'Ссылка владельца /host/:ownerSlug — общего поиска жилья нет',
    sees: ['Страница владельца и его объекты', 'Оформление и заявка', 'Только свои брони', 'Инструкции по условиям'],
    hidden: ['Кабинет организации', 'Чужие брони по пересланной ссылке', 'Код доступа до оплаты и срока'],
    journeys: [
      {
        id: 'guest-book',
        title: 'Прямое бронирование',
        goal: 'Выбрать объект, оформить, перевести предоплату',
        steps: [
          {
            title: 'Страница владельца',
            href: to.host(),
            note: 'Видит объекты владельца, выбирает даты и гостей',
            branches: [{ label: 'нет объектов', href: `${to.host()}?state=empty` }],
          },
          {
            title: 'Объект',
            href: to.hostProperty('ligovsky'),
            note: 'Фото, правила, цена; проверяет доступность',
            branches: [{ label: 'даты заняты', href: `${to.hostProperty('ligovsky')}?from=2026-10-10&to=2026-10-13&guests=2` }],
          },
          {
            title: 'Расчёт и оформление',
            href: `${to.hostCheckout()}?property=ligovsky&from=2026-10-15&to=2026-10-18&guests=2`,
            note: 'Состав цены, условия отмены, контакт; соглашается',
            branches: [
              { label: 'новые условия', href: `${to.hostCheckout()}?property=ligovsky&from=2026-10-15&to=2026-10-18&guests=2&state=error` },
              { label: 'даты заняли', href: `${to.hostCheckout()}?property=ligovsky&from=2026-10-15&to=2026-10-18&guests=2&state=denied` },
            ],
          },
          {
            title: 'Удержание и реквизиты',
            href: to.guestRequest('r-201'),
            note: 'Срок удержания, реквизиты СБП; переводит и жмёт «Я перевёл»',
            branches: [
              { label: 'удержание истекло', href: `${to.guestRequest('r-201')}?step=expired` },
              { label: 'конфликт дат', href: `${to.guestRequest('r-201')}?step=conflict` },
            ],
          },
          {
            title: 'Заявление о переводе',
            href: `${to.guestRequest('r-201')}?step=claim`,
            note: 'Сумма, время, необязательный чек',
          },
          {
            title: 'Проверка владельцем',
            href: `${to.guestRequest('r-201')}?step=review`,
            note: 'Ждёт ручной проверки перевода',
          },
        ],
      },
      {
        id: 'guest-stay',
        title: 'После брони',
        goal: 'Найти свою бронь, получить инструкции, заехать',
        steps: [
          {
            title: 'Мои бронирования',
            href: to.guestBookings(),
            note: 'Ближайшие и прошедшие, только свои',
            branches: [
              { label: 'пусто', href: `${to.guestBookings()}?state=empty` },
              { label: 'чужая ссылка', href: `${to.guestBookings()}?state=denied` },
            ],
          },
          {
            title: 'Моя бронь',
            href: to.guestBooking('gb-1'),
            note: 'Даты, оплаты, остаток, залог; изменение или отмена',
            branches: [{ label: 'завершена', href: to.guestBooking('gb-0') }],
          },
          {
            title: 'Инструкции',
            href: to.guestInstructions('gb-1'),
            note: 'Как добраться и войти; код открывается по нажатию',
            branches: [
              { label: 'рано по времени', href: `${to.guestInstructions('gb-1')}?state=denied` },
              { label: 'до оплаты', href: `${to.guestInstructions('gb-1')}?state=error` },
            ],
          },
        ],
      },
    ],
  },
  {
    role: 'owner',
    label: 'Владелец',
    who: 'Хозяин организации и объектов. Все права: деньги, команда, страница, реквизиты.',
    entry: 'Вход → выбор организации → «Сегодня» (новый — «Первые шаги»)',
    demoRole: 'owner',
    sees: ['Все разделы кабинета', 'Деньги', 'Команда и доступ', 'Моя страница и реквизиты', 'Выгрузки'],
    hidden: [],
    journeys: [
      {
        id: 'owner-start',
        title: 'Первый запуск',
        goal: 'Завести организацию, объект и подключить площадку',
        steps: [
          { title: 'Вход', href: ROUTES.LOGIN, note: 'Код по телефону' },
          // { title: 'Выбор организации', href: ROUTES.WORKSPACES, note: 'Своя или создать новую' },
          { title: 'Создание организации', href: ROUTES.ORG_NEW, note: 'Название' },
          { title: 'Первые шаги', href: to.onboarding(o), note: 'Объект, площадка, MAX, первая задача' },
          { title: 'Объекты', href: to.properties(o), note: 'Список и создание объекта' },
          {
            title: 'Привязка объявления',
            href: to.property('moika', 'listings', o),
            note: 'Ссылка сохранена → доступ подтверждён',
            branches: [{ label: 'сбой доступа', href: to.property('ligovsky', 'listings', o) }],
          },
          { title: 'Подготовка объекта', href: to.property('neva', 'prep', o), note: 'После импорта: что заполнить' },
          { title: 'Площадки', href: to.settings('channels', o), note: 'Состояние подключений' },
        ],
      },
      {
        id: 'owner-day',
        title: 'Рабочий день',
        goal: 'Понять, что требует внимания, и разобрать брони',
        steps: [
          { title: 'Сегодня', href: to.today(o), note: 'Заезды, выезды, «требует внимания»' },
          { title: 'Календарь', href: to.calendar(o), note: 'Шахматка по объектам' },
          { title: 'Брони', href: to.bookings(o), note: 'Список с фильтрами и конфликтами' },
          {
            title: 'Карточка брони',
            href: to.booking('b-1044', 'overview', o),
            note: 'Гость, оплаты, задачи, история',
            branches: [
              { label: 'конфликт', href: to.booking('b-1042', 'overview', o) },
              { label: 'неизвестная оплата', href: to.booking('b-1050', 'payments', o) },
            ],
          },
          { title: 'Уведомления', href: to.notifications(o), note: 'Лента событий' },
        ],
      },
      {
        id: 'owner-direct',
        title: 'Прямые брони и деньги',
        goal: 'Опубликовать объект, принять заявку и подтвердить перевод',
        steps: [
          { title: 'Моя страница', href: to.settings('page', o), note: 'Витрина владельца для гостей' },
          { title: 'Реквизиты', href: to.settings('requisites', o), note: 'Куда гость переводит предоплату' },
          { title: 'Публикация объекта', href: to.property('moika', 'direct', o), note: 'Обязательные поля и условия' },
          { title: 'Инструкции объекта', href: to.property('ligovsky', 'instructions', o), note: 'Что и когда видит гость' },
          { title: 'Прямая заявка', href: to.request('r-201', o), note: 'Удержание, заявление о переводе' },
          {
            title: 'Деньги: на проверке',
            href: to.moneyTab('review', o),
            note: 'Подтвердить или отклонить перевод',
            branches: [
              { label: 'залоги', href: to.moneyTab('deposits', o) },
              { label: 'возвраты', href: to.moneyTab('refunds', o) },
            ],
          },
        ],
      },
      {
        id: 'owner-team',
        title: 'Команда и подготовка',
        goal: 'Пригласить людей и поставить уборку после выезда',
        steps: [
          { title: 'Команда', href: to.settings('team', o), note: 'Приглашения, роли, объекты' },
          { title: 'Серии задач', href: to.taskSeries(o), note: 'Повторяющиеся задачи' },
          { title: 'Серия «после выезда»', href: to.taskSeriesItem('s-3', o), note: 'Привязка к выездам' },
          { title: 'Задачи на проверке', href: `${to.tasks(o)}?tab=review`, note: 'Что сдали сотрудники' },
          { title: 'Приёмка задачи', href: to.task('t-305', o), note: 'Принять или вернуть на доработку' },
        ],
      },
      {
        id: 'owner-specialists',
        title: 'Поиск специалиста',
        goal: 'Найти мастера в каталоге и запросить контакты',
        steps: [
          { title: 'Каталог', href: to.specialists(o), note: 'Допуск, город, категория', soon: true },
          { title: 'Профиль специалиста', href: to.specialist('sp-1', o), note: 'Услуги, отзывы, связь', soon: true },
          { title: 'Избранное', href: to.specialistFavorites(o), note: 'Сохранённые', soon: true },
          { title: 'Мои обращения', href: to.specialistRequests(o), note: 'Ожидание, разрешение, отказ', soon: true },
        ],
      },
    ],
  },
  {
    role: 'manager',
    label: 'Управляющий',
    who: 'Ведёт объекты по поручению владельца. Брони, задачи, команда задач — без денег и настроек организации.',
    entry: 'Приглашение → вход → «Сегодня»',
    demoRole: 'manager',
    sees: ['Сегодня, календарь, брони', 'Задачи и серии', 'Объекты', 'Площадки и уведомления'],
    hidden: ['Деньги', 'Команда и доступ', 'Моя страница', 'Реквизиты', 'Выгрузки'],
    journeys: [
      {
        id: 'manager-join',
        title: 'Подключение',
        goal: 'Принять приглашение и попасть в организацию',
        steps: [
          {
            title: 'Приглашение',
            href: '/invite/vl-48a1',
            note: 'Организация, роль, объекты',
            branches: [
              { label: 'истекло', href: '/invite/vl-48a1?state=error' },
              { label: 'отозвано', href: '/invite/vl-48a1?state=denied' },
            ],
          },
          { title: 'Вход', href: ROUTES.LOGIN, note: 'Код по телефону' },
          // { title: 'Выбор организации', href: ROUTES.WORKSPACES, note: 'Где он управляющий' },
          { title: 'Сегодня', href: to.today(o), note: 'Без денежных блоков' },
        ],
      },
      {
        id: 'manager-day',
        title: 'Рабочий день',
        goal: 'Разобрать брони и заявки',
        steps: [
          { title: 'Сегодня', href: to.today(o), note: 'Что требует внимания' },
          { title: 'Календарь', href: to.calendar(o), note: 'Шахматка' },
          { title: 'Брони', href: to.bookings(o), note: 'Список' },
          { title: 'Карточка брони', href: to.booking('b-1044', 'overview', o), note: 'Без подтверждения денег' },
          { title: 'Прямая заявка', href: to.request('r-201', o), note: 'Видит статус, деньги подтверждает владелец' },
        ],
      },
      {
        id: 'manager-tasks',
        title: 'Задачи команды',
        goal: 'Раздать работу и принять результат',
        steps: [
          { title: 'Задачи', href: to.tasks(o), note: 'Все задачи организации' },
          { title: 'Задачи сотрудников', href: `${to.tasks(o)}?tab=team`, note: 'Кто чем занят' },
          { title: 'Приёмка', href: to.task('t-305', o), note: 'Принять или вернуть' },
          { title: 'Просроченная', href: to.task('t-303', o), note: 'Переназначить или перенести' },
          { title: 'Серии задач', href: to.taskSeries(o), note: 'Регулярная подготовка' },
        ],
      },
      {
        id: 'manager-limits',
        title: 'Границы прав',
        goal: 'Что управляющему закрыто',
        steps: [
          { title: 'Объекты', href: to.properties(o), note: 'Видит только свои объекты' },
          { title: 'Площадки', href: to.settings('channels', o), note: 'Доступно' },
          { title: 'Выгрузки', href: to.settings('export', o), note: 'Нет права — понятный отказ' },
          { title: 'Профиль: кабинеты', href: to.profile('workspaces', o), note: 'Организации и роли' },
        ],
      },
    ],
  },
  {
    role: 'employee',
    label: 'Сотрудник',
    who: 'Исполнитель: уборка, заселение, мелкий ремонт. Видит только свою работу, с телефона.',
    entry: 'Приглашение → вход → «Мои задачи»',
    demoRole: 'employee',
    sees: ['Мои задачи', 'Уведомления', 'Профиль и помощь', 'Личные задачи'],
    hidden: ['Сегодня, календарь, брони', 'Объекты', 'Деньги', 'Настройки', 'Чужие задачи'],
    journeys: [
      {
        id: 'employee-join',
        title: 'Подключение',
        goal: 'Принять приглашение и увидеть свои задачи',
        steps: [
          { title: 'Приглашение', href: '/invite/vl-48a1', note: 'Кто зовёт и на какие объекты' },
          { title: 'Вход', href: ROUTES.LOGIN, note: 'Код по телефону' },
          {
            title: 'Мои задачи',
            href: to.tasks(o),
            note: 'Стартовая страница сотрудника',
            branches: [{ label: 'пусто', href: `${to.tasks(o)}?state=empty` }],
          },
        ],
      },
      {
        id: 'employee-shift',
        title: 'Смена',
        goal: 'Выполнить задачу и сдать отчёт',
        steps: [
          { title: 'Мои задачи', href: to.tasks(o), note: 'Что на сегодня' },
          { title: 'Задача с фото', href: to.task('t-301', o), note: 'Чек-лист, обязательные фото, сдать' },
          { title: 'Возврат на доработку', href: to.task('t-306', o), note: 'Что исправить' },
          { title: 'Личная задача', href: to.task('t-304', o), note: 'Без объекта, для себя' },
          { title: 'Уведомления', href: to.notifications(o), note: 'Новые и изменённые задачи' },
        ],
      },
      {
        id: 'employee-limits',
        title: 'Границы прав и помощь',
        goal: 'Что видно и куда идти за помощью',
        steps: [
          { title: 'Чужая задача', href: to.task('t-303', o), note: 'Отказ без содержимого' },
          { title: 'Профиль и помощь', href: to.profile('workspaces', o), note: 'Организации, MAX' },
          { title: 'Помощь', href: to.help(o), note: 'Ответы и связь с владельцем' },
        ],
      },
    ],
  },
  {
    role: 'specialist',
    label: 'Специалист',
    who: 'Мастер из каталога: уборка, сантехника, фото. Свой кабинет, работает независимо от организаций.',
    entry: 'Профиль → «Кабинет специалиста»',
    sees: ['Мой профиль специалиста', 'Обращения ко мне', 'Мои отзывы'],
    hidden: ['Поиск по каталогу', 'Кабинет организаций заявителей'],
    journeys: [
      {
        id: 'specialist-cabinet',
        title: 'Кабинет специалиста',
        goal: 'Заполнить профиль и ответить на обращения',
        steps: [
          { title: 'Мой профиль', href: to.specialistProfile(), note: 'Категории, регион, режим контактов', soon: true },
          { title: 'Обращения', href: to.specialistInbox(), note: 'Согласие на контакты или отказ', soon: true },
          { title: 'Отзывы', href: to.specialistReviews(), note: 'Ответы на отзывы', soon: true },
        ],
      },
    ],
  },
]

const paramsOf = (href: string) => new URLSearchParams(href.split('?')[1] ?? '')
const pathOf = (href: string) => href.split('?')[0]

// Ссылка шага с ролью кабинета: иначе демо открыло бы экран глазами последней выбранной роли
export const stepHref = (map: UxRoleMap, href: string) => {
  if (!map.demoRole) return href
  const params = paramsOf(href)
  params.set('role', map.demoRole)
  return `${pathOf(href)}?${params}`
}

export type UxPosition = { map: UxRoleMap; journey: UxJourney; index: number }

// Насколько шаг совпадает с открытым экраном: путь обязателен, каждый совпавший query-параметр шага добавляет точность.
// Так «Заявка ?step=claim» побеждает «Заявку ?step=hold», а шаг без параметров остаётся запасным вариантом
const score = (href: string, pathname: string, search: URLSearchParams) => {
  if (pathOf(href) !== pathname) return -1
  let points = 0
  for (const [key, value] of paramsOf(href)) {
    if (search.get(key) !== value) return -1
    points += 1
  }
  return points
}

// Где мы на картах: сначала в выбранной роли, потом в остальных — общие экраны кабинета не перескакивают на чужую роль
export const locate = (pathname: string, search: URLSearchParams, preferred: UxRole, preferredJourney?: string): UxPosition | null => {
  const ordered = [...UX_MAPS].sort((a, b) => Number(b.role === preferred) - Number(a.role === preferred))
  for (const map of ordered) {
    let best: UxPosition | null = null
    let bestScore = -1
    const journeys = [...map.journeys].sort((a, b) => Number(b.id === preferredJourney) - Number(a.id === preferredJourney))
    for (const journey of journeys) {
      journey.steps.forEach((step, index) => {
        const points = score(step.href, pathname, search)
        if (points > bestScore) {
          best = { map, journey, index }
          bestScore = points
        }
      })
    }
    if (best) return best
  }
  return null
}

export const uxMapOf = (role: UxRole) => UX_MAPS.find((map) => map.role === role) ?? UX_MAPS[0]
