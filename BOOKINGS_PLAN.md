# Bookings: план реализации на фронте

Источники: `../api-rentybot-main/docs/openapi.yaml` (тег Bookings), `CalendarController`, `CalendarService`, `CalendarAccess`, `PropertyAccess`, `GuestAccessService::bookingChanged`; макеты `BookingsPage`, `BookingPage`, `BookingFormSheet`, `CancelBookingDialog`.

## Что даёт бэк

### Ручки

orval уже сгенерил функции в `src/shared/api/generated/bookings`.

| Функция | Метод и путь | Особенности |
| --- | --- | --- |
| `listBookings` | `GET organizations/{org}/bookings` | 20 на страницу, сортировка только `start_date ASC, id ASC`. Фильтры: `property_id`, `status` (`confirmed \| cancelled \| all`), `from` + `to` (только парой, `to` исключительно, максимум 366 дней). Поиска и фильтра по площадке нет |
| `createBooking` | `POST organizations/{org}/bookings` | Обязателен заголовок `Idempotency-Key` (uuid). 201 на первую запись, 200 на повтор с тем же ключом и телом |
| `getBooking` | `GET organizations/{org}/bookings/{id}` | |
| `updateBooking` | `POST organizations/{org}/bookings/{id}` | Частичное изменение, обязателен `version`. `property_id` менять нельзя |
| `cancelBooking` | `POST organizations/{org}/bookings/{id}/cancel` | `version` + `reason` (до 1000 символов). Повтор по уже отменённой с актуальной версией — 200 без новой ревизии |
| `getBookingHistory` | `GET organizations/{org}/bookings/{id}/history` | Ревизии, `version ASC`, 20 на страницу |

### Модель `Booking`

- `id`, `organization_id`, `property_id`
- `start_date`, `end_date` — ночи `[start_date, end_date)`
- `timezone`, `check_in_time`, `check_out_time` — снимок с объекта при создании, дальше не меняются
- `version`
- `type` — всегда `booking`
- `status` — `confirmed | cancelled`
- `source` — только `manual`
- `guests_count`, `guest_name`, `guest_phone?`, `guest_email?`
- `total_amount_minor` — копейки, обязательна, 0 допустим
- `currency` — только `RUB`
- `notes?`

### Доступ

- owner, manager, administrator. Employee получает 403.
- Не-owner видит брони только назначенных ему объектов; чужое отдаёт 404.

### Ошибки

422 (поля):

- `property_id` — у объекта не заполнены timezone, capacity или времена заезда/выезда.
- `guests_count` — гостей больше вместимости объекта.
- `end_date` — интервал меньше 1 или больше 366 ночей.

409 с полем `code`:

- `calendar_conflict` — пересечение с подтверждённой бронью или активной блокировкой; в `conflicts[]` до 10 записей (`id`, `type`, `start_date`, `end_date`).
- `version_conflict` — запись изменилась; в `current_version` актуальная версия.
- `entry_inactive` — отменённую бронь править нельзя.
- `property_archived` — объект в архиве, создание и правка закрыты (отмена разрешена).
- `idempotency_conflict` — ключ уже использован с другими данными.

### Побочные эффекты

- Любая ревизия брони пересчитывает подготовки объекта.
- Смена дат снимает ручное разрешение выдачи секретов у гостевых привязок.
- Отмена отзывает гостевые привязки и непринятые приглашения. Возврата денег нет, восстановления брони нет.

## Расхождения макета с API

- **Статусы** `hold`, `conflict`, `living`, `done` бэк не отдаёт. «Проживает», «Завершена», «Заезд сегодня» можно вычислять на фронте из дат и `timezone`. `hold` и `conflict` убрать: пересечения бэк не допускает.
- **Номер `#1045`** отсутствует, показывать `#id`.
- **Название объекта** в брони не приходит. Брать из `useAllProperties`, причём и активные, и архивные: брони архивных объектов читаются.
- **Сумма**: в макете «можно оставить пустой, будет Нет данных». На бэке обязательна. Подсказку убрать; вводить в рублях, в копейки переводить в zod-схеме.
- **Поиск и фильтр «Площадка»**: ручек нет, убрать. Фильтр статуса сократить до трёх значений.
- **Причина отмены** в макете «для гостя», на бэке это внутренняя причина ревизии. Сообщения гостю нет.
- **Последствия отмены** (задачи отменятся, предоплата) выдуманы. Реально: даты освободятся, подготовка снимется, уборка остаётся и отменяется вручную, доступ гостя отзывается.
- **Без API**: оплаты, ответственный, условия отмены, «Написать гостю», обмен с площадками. По правилу проекта остаются с `MOCK_BORDER`.
- **`kind="block"`** в `BookingFormSheet` относится к `calendar-blocks`, это отдельный этап.

## План

### 1. Сущность `src/entities/booking`

`api/booking.queries.ts`:

- `bookingKeys`: `all`, `list(orgId, filters)`, `detail`, `history`.
- `useBookings` — infinite, по образцу `useNotifications`.
- `useBooking` — `skipErrorToast`, 404 показывает страница.
- `useBookingHistory`.
- `useCreateBooking` — `Idempotency-Key` через `useRef`, по образцу `useCreateProperty`.
- `useUpdateBooking`, `useCancelBooking` — кладут ответ в `detail`, сбрасывают `list` и `history`. При 409 `version_conflict` инвалидируют `detail`.
- Мета мутаций: `inlineFieldErrors` + `successMessage`.

`model/schemas.ts`:

- `bookingSchema` (создание), `bookingEditSchema`, `cancelBookingSchema`.
- В схемах: `trim`, пустое в `null`, рубли в копейки, диапазон дат в `start_date` / `end_date`.

`model/status.ts` — вычисляемый статус для показа.

`model/conflict.ts` — разбор 409 (`code`, `conflicts`, `current_version`) в текст.

### 2. Список `src/pages/bookings`

- Блоки в `components/`: `BookingsHeader`, `BookingsFilter` (статус + `PropertyFilter`, значения в URL), `BookingsList` (таблица, карточки, «Показать ещё»), `BookingRow`.
- Роль employee: `denied` без запроса, через `isEmployee`.
- Счётчик записей из `meta.total`.

### 3. Форма создания

`BookingFormSheet` переписать на RHF + zod:

- Объект из `useAllProperties`.
- Подсказка времени заезда/выезда и максимум гостей — из выбранного объекта.
- Предупреждение, если объект не настроен, со ссылкой на его карточку.
- 422 под полями; 409 `calendar_conflict` алертом со списком пересечений.

Дополнительно:

- Блокировку вынести в отдельный `BlockFormSheet`, оставить на моках с красным бордером.
- Виджет используют ещё моковые `CalendarPage`, `TodayPage`, `property/ui/BookingsTab`: там строковый `propertyId`, его передачу убрать.

### 4. Карточка `src/pages/booking`

- `BookingHeader` — факты из API, объект ссылкой; действия «Изменить» и «Отменить» только для `confirmed` и неархивного объекта.
- `BookingGuestTab` — гость, контакты, даты, сумма, заметки.
- `BookingEditSheet` — та же форма без объекта, шлёт `version`.
- `CancelBookingDialog` — RHF, обязательная причина, реальные последствия.
- `BookingHistoryTab` — ревизии, дифф соседних снимков, причина отмены. `actor_id` — id пользователя; имя брать из `organizations/{org}/members`, сначала сверить, что ручка отдаёт `user_id`.
- Вкладка «Оплаты» и карточки обзора без данных — `MOCK_BORDER`.

### 5. Вкладки на смежных ручках (отдельным заходом)

- **Подготовка**: у `listPreparations` нет фильтра по `booking_id`. Запрашивать по `property_id` + `arrival_from` / `arrival_to` и искать по `booking_id` на клиенте.
- **Инструкции и доступ гостя**: `instruction-preview`, `guest-invitations`, `guest-grants`, `guest-access/history`. Это сущность `guest-access`, по объёму сравнима со всем остальным.

### 6. Обвязка

- `BOOKINGS` и `BOOKING` перенести из `mockAppRoutes` в `appRoutes`, добавить в `PAGES_WITHOUT_DEMO_TOOLS`.
- `to.booking` принимает числовой id и `orgId` без дефолта `DEMO_ORG_ID`.
- Гостевые страницы (`guest/bookings`) не трогаем: другая роль и другие ручки.

## Порядок

1 → 2 → 3 → 4 → 6. Этап 5 — после календаря.

## Открытые вопросы

1. Вычисляемые статусы («Проживает», «Завершена») делать на фронте или показывать только `confirmed` / `cancelled`? Рекомендация: вычислять.
2. Этап 5 делать сразу или после календаря? Рекомендация: после — этапы 1–4 и 6 закрывают весь тег Bookings.
