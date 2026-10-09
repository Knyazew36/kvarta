# Rentybot фронт: план реализации и стилизации (итерация 1)

## Context

`docs-rentybot/docs/06-frontend-structure.md` описывает контуры, навигацию, экраны, маршруты (§8), общие компоненты/состояния (§9) и порядок макетов (§10). `DESIGN (7).md` задаёт визуальный язык: brutalist-editorial, холст `#e5e5e5`, белые карточки, чёрные блоки, mint `#d1ffca` / voltage `#fff100` только акцентом, без теней, крупные радиусы, condensed uppercase display.

Проект `E:\kvarta` — шаблон Vite + React 19 + Tailwind v4 + shadcn (base-ui) + react-router 7. Токены дизайна **уже заведены** в `src/global.css` (Oswald вместо SuisseIntlCond, Inter, JetBrains Mono; утилиты `display-heading`, `section-heading`, `mono-label`), `button/card/badge` уже перекрашены. Страницы — заглушки.

Решения пользователя: **только статичная вёрстка** (без API-слоя, данные-моки рядом со страницей), **этапы 1–5 из §10**, **светлая и тёмная тема на всех экранах**.

Цель итерации: кликабельные статичные макеты рабочего кабинета, кабинета сотрудника и гостевого пути на desktop + mobile, со всеми обязательными состояниями (пусто / ошибка / нет прав / вариант по ролям).

---

## Статус

| Фаза | Состояние |
| --- | --- |
| 0 — фундамент | ✅ токены, тёмная тема, общие компоненты `shared/ui/rb`, демо-стор и `DemoSwitcher`, реестр экранов, `/pages` |
| 1 — оболочка и «Сегодня» | ✅ `AppShell` (sidebar, topbar, mobile nav), `TodayPage` со всеми вариантами |
| 2 — календарь, брони, карточка брони | ✅ календарь, список броней, карточка брони (3 сценария), прямая заявка, формы и диалоги |
| 3 — задачи и серии | ✅ список задач, карточка задачи (6 сценариев), серии и редактор серии, пошаговое создание, приёмка/возврат |
| 4 — объекты и первый вход | ✅ список объектов, карточка объекта (9 вкладок), вход, приглашение, выбор организации, первые шаги |
| 5 — гостевой путь | ⬜ следующая |

**Отступления от плана (решения по ходу):**
- Визуальный язык сменился на Sana-стиль из текущего `DESIGN (7).md`: белый холст, frost-карточки, ink-акцент, lime только точечно, мягкие тени `shadow-card`/`shadow-control` разрешены. Образец идиомы — `TodayPage`. Правила §1 ниже про Oswald/mint/voltage/«без теней» устарели.
- Слоя `entities/*` и общих моков нет: данные — константой прямо в файле страницы/виджета.
- Календарь на mobile — лента по дням (`Agenda`), а не сетка; календарь одного объекта через `react-day-picker` не делался.
- Режим «День» в календаре — список «что с каждым объектом в выбранную дату», не почасовая шкала.
- Мобильная ширина фазы 2 вживую не проверена (браузер не дал изменить размер окна) — проверить вручную на 390px.
- Фаза 3: создание задачи на mobile — `Sheet side="bottom"`, а не `Drawer` (один компонент формы на обе ширины). Подборки задач — `?tab=` в query (путь `/tasks/:taskId` занят карточкой), `ResponsiveTabs` получил `onValueChange`. В демо-стор добавлен `me` (кто «я» по роли) — от него зависят «Мои» и права на приёмку.
- Фаза 3 вживую в браузере (1440/390, тёмная тема) не проверена — `tsc -b` и `oxlint` по новым файлам чистые.
- Фаза 4: вкладки объекта — отдельные файлы `pages/property/ui/*Tab.tsx`, у каждой свои моки. Календарь и брони объекта не переиспользуют компоненты фазы 2 (они не вынесены из страниц): свой месячный календарь одного объекта и список с теми же записями. Экраны входа (`/login`, `/invite/:token`, `/workspaces`, `/app/:orgId/onboarding`) — в оболочке `widgets/entry-shell`, без меню кабинета; онбординг вынесен из `AppShell` намеренно. Состояния входа и приглашения — через `?state=` (error = неверный код / истекло, denied = блокировка / отозвано). Новые пресеты `LISTING_STATUS`, `PUBLIC_STATUS`, `OPERATION_STATUS`. Проверено в браузере на 1440 и 390 (через iframe — окно не сужается), тёмная тема.

---

## 1. Адаптация DESIGN.md к рабочему кабинету

DESIGN.md — лендинговый стиль. Для плотного SaaS-интерфейса правила:

| Элемент | Правило |
| --- | --- |
| Холст | `bg-canvas` всегда; контент только на `bg-paper` карточках `rounded-card` (32px), вложенные — `rounded-3xl` (24px) |
| Глубина | Без теней вообще. Разделение = контраст поверхностей canvas → paper → mist → carbon. Оверлеи (popover, dialog, dropdown) — `ring-1 ring-ash`, без shadow |
| Заголовок страницы | `display-heading text-heading-lg` (48px Oswald, uppercase) на desktop; на mobile — `section-heading text-heading-sm` (правило «Cond не мельче 48px») |
| Заголовок карточки | `section-heading text-subheading-lg` (20px, 450, uppercase) |
| Мета-данные | `mono-label text-smoke`: номера броней, даты, часовой пояс, «обмен 12:04», ID |
| Тело | 16px/500 body, вторичный текст `text-slate`, 14px для списков |
| Кнопки | существующие варианты: primary чёрная `rounded-lg`, outline 1.5px slate `rounded-sm`, ghost, link |
| Навигация | Sidebar — белая «плавающая» панель `rounded-card` с отступом 16px от краёв окна; пункты `rounded-pill`, активный — чёрный фон/белый текст, hover — `bg-mist` |
| Акцент «Требует внимания» | Inverted card (`variant="inverted"`, чёрный) — единственная драматическая зона на «Сегодня» |
| Гостевые страницы | Ближе к оригиналу DESIGN.md: hero с именем владельца `text-display` (80px desktop / 48px mobile), top-arc карточки (`rounded-t-arc`), nav-pill сверху |

**Семантика статусов** (§9: статус не кодируется только цветом → всегда иконка lucide + текст):

| Тон | Фон / текст | Примеры |
| --- | --- | --- |
| `success` | mint / black | Подтверждена, Готово, Поступление подтверждено |
| `attention` | voltage / black | Ждёт проверки, Удержание, Заявлен перевод |
| `danger` | `destructive/10` / destructive | Конфликт, Просрочено, Ошибка доступа |
| `neutral` | mist / slate | Черновик, Нет данных, Без срока |
| `inverse` | carbon / paper | Заезд сегодня, Активная |
| `outline` | border carbon | Источник: Авито / Суточно / Прямая |

Добавить в `@theme` `--color-success: #d1ffca`, `--color-attention: #fff100` как алиасы mint/voltage для читаемости.

---

## 2. Фаза 0 — фундамент ✅

**Инструменты (обязательно):**
- Вёрстку каждой страницы/виджета делать через скилл **`/frontend-design`** (вызывать перед работой над экраном, с контекстом §1 этого плана и `DESIGN (7).md`).
- Подключить shadcn MCP: `npx shadcn@latest mcp init --client claude` (запускает пользователь через `! …` или с подтверждения), затем блоки/компоненты брать через MCP.
- Layout и sidebar кабинета — из блока **sidebar-01** (https://ui.shadcn.com/blocks/sidebar#sidebar-01): `npx shadcn@latest add sidebar-01` → приходят `ui/sidebar` + `app-sidebar`, `search-form`, `version-switcher`. Перенести в `widgets/app-shell/` (version-switcher → переключатель организации, search-form → поиск/фильтр объекта), стилизовать под §1. Существующий `animate-ui/.../radix/sidebar.tsx` не использовать.

**Изменения:**
- `index.html`: title `Rentybot`.
- Тёмная тема — везде. `ServiceProvider.tsx`: оставить `ThemeProvider attribute="class" defaultTheme="system" enableSystem`. Блок `.dark` в `global.css` (инверсия монохрома: canvas `#111`, paper `#1c1c1c`, carbon ↔ white) довести: добавить тёмные значения для success/attention/hatch; mint и voltage остаются теми же акцентами, текст на них всегда чёрный (`text-black`, не `text-foreground`). Inverted card в тёмной теме = `bg-foreground text-background` (белый блок) — уже так в `Card`.
- Правило вёрстки: только семантические токены (`bg-background/card/paper/canvas/mist`, `text-foreground/slate/smoke`), никаких хардкодов `bg-white`/`text-black` кроме текста на mint/voltage. Картинки/иллюстрации — проверять контраст в обеих темах.
- Переключатель темы: `ThemeToggler` из animate-ui (`shared/ui/shadcn/animate-ui/components/buttons/theme-toggler.tsx`) — в футере sidebar кабинета, в меню профиля на mobile, в nav-pill гостевых страниц.
- `src/global.css`: алиасы success/attention, утилита `hatch` (диагональная штриховка для блокировок/удержаний в календаре, через `repeating-linear-gradient` ash — это паттерн, не декоративный градиент), `rounded-t-arc`.
- shadcn: добавить недостающие `select`, `dropdown-menu`, `popover`, `tabs` (base), `avatar`, `checkbox`, `switch`, `radio-group`, `tooltip`, `progress`, `toggle-group` через `npx shadcn add`, затем каждую привести к правилам §1 (no shadow, радиусы, input `bg-mist h-11 rounded-lg`). Проверить существующие `input`, `textarea`, `dialog`, `sheet`, `drawer`, `table`, `calendar`, `empty`, `skeleton` на тени и цвета.
- Структура (FSD-подобная, уже начата `app/pages/shared`):
  ```
  src/widgets/app-shell/        оболочка кабинета (sidebar, topbar, mobile bottom nav)
  src/widgets/guest-shell/      оболочка гостевых страниц
  src/entities/{booking,task,property,org,guest}/
      model/types.ts            типы
      model/mock.ts             статичные данные
      ui/                       BookingStatus, TaskRow, PropertyChip ...
  src/shared/ui/rb/             общие компоненты §9
  src/shared/mock/state.ts      zustand: role, orgId, objectsCount, demoState
  ```
- **Страница-индекс `/pages`** (`pages/pages-index/PagesIndexPage.tsx`, публичный маршрут): все экраны итерации, сгруппированы по контурам (Вход и подключение / Рабочий кабинет / Сотрудник / Гость) и фазам; у каждого — название, маршрут (mono), статус готовности (StatusBadge) и ссылки на варианты (`?role`, `?objects`, `?state`). Источник — единый конфиг `shared/config/pages-registry.ts`, его же читают маршруты, чтобы список не расходился. Стиль — editorial: display-заголовок «Экраны Rentybot», сетка белых карточек на canvas. Пополняется в каждой фазе.
- **Демо-переключатель состояний** (статичная вёрстка без API): query-параметры `?role=owner|manager|employee`, `?objects=1|many`, `?state=ok|empty|error|denied|loading`. Хук `useDemoState()` в `shared/mock`. В dev — плавающая mono-панель переключения в углу (`widgets/demo-switcher`). Так каждый макет показывает все варианты из §10 «пустое, ошибка, по правам».

**Общие компоненты `src/shared/ui/rb/`** (по §9):
`PageHeader` (заголовок + mono-мета + главное действие), `StatusBadge` (тон + иконка + текст), `SourceTag`, `SyncFreshness` («Обмен с Авито · 12:04 МСК», при сбое — attention-тон и время последнего успеха), `RecordHeader`, `EventCard`, `MoneySummary` (неизвестное → «Нет данных», не 0), `Checklist`, `FileUploader` (состояние каждого файла, повтор), `HistoryFeed`, `ConsequencesPreview` (список последствий перед отменой/архивом), `StateView` (loading-скелет структуры / empty с причиной и шагом / error с актуальностью / denied без содержимого), `FilterBar` (состояние в URL через `useSearchParams`), `ResponsiveTabs` (tabs на desktop, select на mobile).

---

## 3. Фаза 1 — оболочка и «Сегодня» (§2, §4.1, §10 п.1) ✅

- `widgets/app-shell/AppShell.tsx` на основе sidebar-01 (`SidebarProvider` + `AppSidebar` + `SidebarInset`): desktop — sidebar (лого Rentybot `display-heading` 28→ использовать `section-heading`, переключатель организации, меню из §2 с группой «Настройки», «Помощь» внизу); topbar — фильтр объекта, центр уведомлений (popover-список), профиль. Mobile (`use-mobile.ts` уже есть) — bottom nav «Сегодня / Календарь / Задачи / Ещё» (белая pill-плашка, `rounded-pill`), «Ещё» — sheet со списком разделов.
- Меню собирается из конфига `widgets/app-shell/model/nav.ts` с полем `permission`; фильтрация по `role` из демо-стора. Сотрудник: «Мои задачи / Уведомления / Профиль».
- Маршруты (§8) в `shared/config/paths.ts` + `app/router/routes.ts`: `/login`, `/invite/:token`, `/workspaces`, `/app/:orgId/*` под `AppShell` как layout-route. Для статики `PrivateRoute` пускает всех (флаг `DEMO` в `env.ts`).
- `pages/today/TodayPage.tsx`: верхняя строка (дата, TZ mono, выбранные объекты); inverted-карточка «Требует внимания» (список EventCard на чёрном, mint/voltage бейджи); сетка 2 колонки: «Заезды», «Выезды»; «Мои задачи»; «На проверке»; быстрые действия (outline-кнопки). Варианты: 1 объект (без фильтра объекта), много объектов, сотрудник (только задачи + помощь), пусто, ошибка интеграции.

## 4. Фаза 2 — календарь, брони, карточка брони (§4.2, §4.3) ✅

- [x] `pages/calendar`: сетка «объекты строками × даты столбцами», закреплённые подписи (sticky left/top), режимы день/неделя/месяц (`toggle-group`). Бронь — pill `rounded-full`: подтверждённая = carbon, удержание = paper + `hatch` + dashed border, блокировка = mist + hatch, конфликт = destructive ring + иконка. Внутри — SourceTag mono. Окно подготовки между выездом и заездом — тонкая полоса mint. Над сеткой `SyncFreshness` по каждой площадке. Mobile: список по дням + календарь одного объекта (`react-day-picker`).
- [x] `pages/bookings`: таблица на paper-карточке без сеточных линий (строки, hover mist, заголовки mono-label smoke); mobile — карточки. `FilterBar`. Sheet-формы «Ручная бронь» и «Блокировка», dialog «Разбор конфликта» (две записи рядом, пересечение выделено).
- [x] `pages/booking/BookingPage.tsx` (`/bookings/:bookingId/:tab`): RecordHeader (номер mono, объект, источник, даты, гости, ответственный, главное действие), вкладки Обзор / Гость и условия / Оплаты / Подготовка / Инструкции / История. Обзор — сетка отдельных состояний (бронь, проживание, деньги, подготовка, доступ, обмен), каждое — маленькая карточка со StatusBadge. Три мок-сценария: обычная, неизвестная оплата («Нет данных»), конфликт. `pages/request` — прямая заявка (не называть удержание бронью). Dialog подтверждения денег (бронь, объект, сумма, назначение явно), dialog отмены с ConsequencesPreview.
- [x] Формы и диалоги вынесены в `widgets/booking-actions/` (`BookingFormSheet`, `ConflictDialog`, `ConfirmPaymentDialog`, `CancelBookingDialog`); «Ручная бронь» на «Сегодня» открывает ту же форму. Сценарии карточки: `b-1044` обычная, `b-1050` неизвестная оплата, `b-1042`/`b-1045` конфликт; заявка — `r-201`.

## 5. Фаза 3 — задачи и серии (§4.4) ✅

- `pages/tasks`: вкладки-списки «Мои / Сегодня / Предстоящие / Просроченные / На проверке / Сотрудников» (по роли), FilterBar.
- Создание — sheet (desktop) / drawer (mobile), пошагово: название → кому → срок+TZ → разовая/повтор → фото и приёмка → напоминания → предпросмотр (явно получатель и видимость).
- `pages/task` карточка: статус, срок, просрочка, исполнитель/проверяющий, контекст объекта/брони, Checklist, FileUploader, действия «Начать / Выполнено / Нужна помощь / Отложить»; для проверяющего «Принять / Вернуть» с комментарием и новым сроком. Сценарии: без объекта, с обязательным фото, возврат на доработку.
- `pages/task-series` список + редактор: правило повтора, TZ, начало/конец, предпросмотр ближайших дат (mono-список), dialog «Это выполнение / Будущие» со списком затронутых задач.
- [x] Сделано: `pages/tasks` (подборки по роли, FilterBar, строка с чек-листом/фото/серией), `pages/task` (сценарии `t-301` фото в работе, `t-304` без объекта, `t-305` приёмка, `t-306` возврат с новым сроком, `t-303` просрочка, `t-307` из подготовки брони; чужая задача для сотрудника — «нет прав»), `pages/task-series` (`TaskSeriesPage` карточки, `TaskSeriesItemPage` редактор `s-1…s-5` и `new`, предпросмотр дат считается из правила, sticky-блок дат). Формы и диалоги — `widgets/task-actions/` (`TaskFormSheet` 7 шагов, `ReviewTaskDialog`, `PostponeTaskDialog`, `HelpRequestDialog`, `SeriesScopeDialog`). Статусы серий — `SERIES_STATUS` в `status-presets`.

## 6. Фаза 4 — объекты и первый вход (§3, §4.5) ✅

- `pages/properties` список: карточки-сетка (название, публичность, эксплуатация, каналы SourceTag + SyncFreshness, ближайший заезд с готовностью).
- `pages/property/:tab`: ResponsiveTabs из OBJ-03 (Сведения, Календарь, Брони, Объявления, Задачи, Подготовка, Инструкции, Прямое бронирование, История). Календарь/Брони — переиспользуют компоненты фазы 2 с фильтром. «Объявления» — три состояния: ссылка сохранена / импорт успешен / ошибка доступа (разные бейджи и тексты). «Прямое бронирование» — форма + чек-лист готовности к публикации.
- Первый вход: `pages/login` (canvas + большой display-заголовок слева, белая карточка формы справа — ближе к hero DESIGN.md; способ входа нейтральный, D-04 открыт), `pages/invite`, `pages/workspaces`, `pages/onboarding` (4 шага: объект, площадка, MAX, первая задача — карточки с mono-нумерацией 01–04).

## 7. Фаза 5 — гостевой путь (§5)

- `widgets/guest-shell`: верх — nav-pill по центру (лого владельца, «Мои бронирования»), max-width 1200, mobile-first.
- `pages/host/HostPage` — hero: имя владельца `text-display`, описание, даты/гости; сетка объектов (фото `rounded-card`, mint-тег вместимости).
- `pages/host/PropertyPage` — фото, описание, правила, выбор дат, цена; sticky-кнопка снизу на mobile.
- `pages/host/CheckoutPage` — расчёт (ночи, состав цены, предоплата, остаток, залог, отмена), согласие, контакт.
- `pages/guest/RequestPage` — состояния одной страницей через `?state=`: удержание (крайний срок с TZ, реквизиты СБП + CopyButton из animate-ui, «Я перевёл»), заявление (сумма/время/вложение), проверка («Перевод проверяет владелец»), истекло, конфликт/неактуальная доступность (реквизиты скрыты).
- `pages/guest/BookingsPage`, `BookingPage`, `InstructionsPage` (закрытые инструкции — причина и следующий шаг, без кода).
- Inverted top-arc карточка для итоговой суммы / статуса — главный визуальный акцент.

---

## 8. Критичные файлы

- Изменить: `src/global.css`, `src/app/providers/ServiceProvider.tsx`, `src/app/router/routes.ts`, `src/app/router/index.tsx`, `src/shared/config/paths.ts`, `src/app/router/guards/PrivateRoute.tsx`, `index.html`, `src/shared/ui/shadcn/*` (донастройка стиля).
- Переиспользовать: `Button`/`Card variant="inverted"`/`Badge` (`src/shared/ui/shadcn`), `useIsMobile` (`shared/lib/hooks/use-mobile.ts`), `Sheet`, `Drawer`, `Dialog`, `Table`, `Calendar`, `Empty`, `Skeleton`, animate-ui `tabs`, `copy` button, `files`, `accordion`; `date-fns` (ru-локаль) для дат; `zustand` для демо-стора; утилиты `display-heading`/`section-heading`/`mono-label`.
- Удалить из маршрутов после готовности оболочки: `pages/home` (редирект `/` → `/workspaces`). `/ui` оставить как витрину компонентов, дополнить разделом `rb`.

## 9. Порядок и проверка

Фазы 0→5 последовательно; каждая фаза = набор страниц, доведённый до desktop + mobile + все `?state=` варианты.

Проверка после каждой фазы:
1. `npm run build` (tsc + vite) и `npm run lint` (oxlint) без ошибок.
2. `npm run dev`, открыть `/pages`, оттуда пройти маршруты фазы на 1440px и 390px (`resize_window`), переключая `?role`, `?objects`, `?state` и тему (светлая/тёмная); скриншоты ключевых экранов в обеих темах.
3. Чек-лист стиля: нет `shadow-*` и хардкодов `bg-white`/`#fff` вне токенов (grep), читаемость в тёмной теме, Oswald только ≥48px, mint/voltage только на мелких элементах, у каждого статуса есть иконка+текст, у дат есть TZ, неизвестные суммы = «Нет данных», клавиатурный обход форм (Tab/Enter), основные действия на mobile доступны без hover.
