# Задачи и серии: перевод с моков на API

## Context

Раздел задач (`/app/:orgId/tasks`, `/tasks/:taskId`, `/task-series`, `/task-series/:seriesId`) — статичные макеты на `useDemoState` и константах. Бэк готов (`TaskController`, `TaskPhotoController`, `TaskSeriesController`, OpenAPI 0.13.0), orval уже сгенерировал функции и типы (`src/shared/api/generated/tasks`, `task-series`). Нужно: сущности `entities/task` и `entities/task-series` с ручными query-хуками, страницы разбить на блоки в `components/`, всё, чего на бэке нет, пометить `MOCK_BORDER`.

Объём согласован: список, карточка задачи, серии — всё.

## Что выяснено в бэке (влияет на UI)

- **Список** `GET tasks`: 20/стр, `due_at ASC, id ASC`, без срока в конце. Фильтры: `property_id`, `assignee_membership_id`, `status`, `visibility`, `view` (`mine|staff|today|upcoming|overdue|undated`), `series_id`. `today/upcoming` требуют `timezone`. `staff` — только owner/manager/administrator (иначе 403). **Поиска по названию нет.**
- **Имён в задаче нет**: только `author_id` (user), `assignee_membership_id`, `reviewer_membership_id`. Имена — `GET task-participants` (`membership_id, user_id, name, role`), доступен только руководящим ролям; сотруднику 403.
- **Права** приходят готовыми: `task.allowed_actions`, `series.allowed_actions`. Кнопки рисуем только по ним, роли сами не вычисляем.
- **Все мутации** требуют `version`; 409 `version_conflict` → перечитать карточку. Создание задачи/серии — `Idempotency-Key`.
- **Правка задачи**: только `title, description, assignee_membership_id, due_at+timezone` (парой). Объект, чек-лист, приёмка, фото — неизменяемы.
- **Действия**: `start`, `checklist` (`completed_indexes` целиком), `complete` (`comment?`; все пункты чек-листа + фото при `requires_photo`), `approve`, `return` (`reason`, `due_at` в будущем, `timezone`), `cancel` (`reason`).
- **Фото**: upload multipart (`version`, `photo`; JPEG/PNG/WebP ≤10 МиБ, ≤10 шт), ответ `{data, task}`; чтение — закрытый blob по сессии; удаление черновика с `version`.
- **Личная задача**: исполнитель = автор, без приёмки и проверяющего. `team` — только руководящие роли. Бронь — только руководящие, `property_id` обязан совпасть с объектом брони.
- **Серия**: `frequency` `daily|weekly(weekdays 1–7)|monthly(month_day + missing_day skip|last_day)`, `local_time`, `timezone`, `start_date ≥ сегодня`, `end_date|null`. Правка — двухшаговая: `preview` → то же тело + `preview_hash`; меняются `schedule` целиком и `template.title/description/assignee_membership_id`. `resume` требует `mode: skip|recover (+recover_from, последние 30 дней)`. Статусы: `active|paused|blocked|ended`, `generation_issue`.
- **Нет на бэке** (остаётся моком с `MOCK_BORDER` или убирается): напоминания, «Нужна помощь», «Отложить» исполнителем, «Напомнить исполнителю», правило «после выезда», окончание «после N выполнений», серия «на все объекты», поиск.

## Отклонения от макета — жёлтый бордер с причиной

Два маркера, не путать:
- **Красный** `MOCK_BORDER` (уже есть) — блок всё ещё на моках, ручки на бэке нет.
- **Жёлтый** `DEVIATION_BORDER` (новый) — блок работает на API, но ведёт себя не так, как в макете. Причина видна прямо в интерфейсе.

Новое в `src/shared/mock/`:
- `deviation-border.ts` — `export const DEVIATION_BORDER = 'border-2 border-yellow-400 border-dashed'`.
- `DeviationNote.tsx` — `<DeviationNote reason="…">{children}</DeviationNote>`: оборачивает блок в жёлтый бордер и под ним выводит подпись «Отклонение: {reason}» (жёлтая `text-caption`). Без `children` — одна плашка с причиной на месте убранного элемента. Поиск по `DeviationNote` показывает все отклонения.

Где ставим (причина — текстом в UI):

| Место | Отклонение | Причина в UI |
|---|---|---|
| `/tasks`, панель фильтров | убран поиск по названию | «Поиска нет: бэк не умеет искать задачи по названию» |
| `/tasks`, вкладки | счётчики — отдельные запросы, «Сегодня» по поясу браузера | «День считается по часовому поясу браузера, а не объекта: бэк принимает один timezone на запрос» |
| `/tasks`, строка, исполнитель | сотруднику вместо имён «Вы» / «Участник #id» | «Имена участников бэк отдаёт только руководящим ролям» |
| Форма задачи | нет шагов «Повтор» и «Напоминания» | «Повтор создаётся отдельной серией; напоминаний на бэке нет» |
| Форма задачи, шаг «Срок» | срок необязателен, пояс объекта/браузера | «Срок необязателен; время в поясе объекта, без объекта — браузера» |
| Карточка, правка | меняются только название, описание, исполнитель, срок | «Объект, чек-лист, фото и приёмку после создания изменить нельзя» |
| Карточка, чек-лист | нет «обязательных» пунктов — обязательны все | «Бэк не различает обязательные пункты: для отправки нужны все» |
| Карточка, фото | только JPEG/PNG/WebP ≤10 МБ, ≤10 шт, без HEIC | «Ограничения бэка на фото» |
| Карточка, статус | нет «Запланирована»; «Возвращена» вычисляется по отчёту | «Статусов planned/returned на бэке нет» |
| Серии, правило | нет «После выезда», нет «После N выполнений», нет «Все объекты» | «Бэк поддерживает только ежедневно / по дням недели / раз в месяц, окончание — датой, один объект» |
| Серия, правка | двухшаговая (предпросмотр → применить), с даты `effective_from` | «Изменения применяются к будущим выполнениям с выбранной даты» |
| Серия, возобновление | выбор skip / recover | «Бэк требует решить, что делать с пропущенными периодами» |
| Серии, сотрудник | страница открыта, видны его личные серии | «Бэк отдаёт сотруднику его личные серии» |

Остаются красными (`MOCK_BORDER`, ручек нет): «Напоминания», «Нужна помощь», «Отложить», «Напомнить исполнителю».

## Шаги (чек-лист)

План сохраняется в корне проекта: `E:\kvarta\TASKS_PLAN.md`. После каждого сделанного шага — `[ ]` → `[x]` в этом файле.

- [x] 0. Сохранить план в `TASKS_PLAN.md` в корне
- [x] 1. `DEVIATION_BORDER` + `DeviationNote` в `src/shared/mock/`
- [x] 2. `entities/task`: `conflict.ts`, `status.ts`, `due.ts`
- [x] 3. `entities/task`: `task.queries.ts` (ключи, списки, счётчики, карточка, история, участники)
- [x] 4. `entities/task`: мутации (create, update, действия, фото) + `people.ts` + `schemas.ts` + `index.ts`
- [x] 5. `/tasks`: `TasksHeader`, `TasksTabs`, `TasksFilter`
- [x] 6. `/tasks`: `TasksList`, `TaskRow`, сборка `TasksPage`, `paths.ts`, `PAGES_WITHOUT_DEMO_TOOLS`
- [x] 7. `TaskFormSheet` на rhf+zod и `createTask`
- [x] 8. Карточка: `TaskHeader`, `TaskSidebar`, состояния загрузки/404
- [x] 9. Карточка: `TaskActions`, `TaskChecklist`, `CompleteTaskDialog`, `CancelTaskDialog`
- [x] 10. Карточка: `TaskPhotos` (загрузка, превью, удаление)
- [x] 11. Карточка: `ReviewTaskDialog`, `TaskReturnedNote`, `TaskEditSheet`
- [x] 12. Карточка: `TaskHistory`; красные бордеры на блоках без ручек
- [x] 13. `entities/task-series`: `rule.ts`, `conflict.ts`, `schemas.ts`, `blocked` в `status-presets`
- [x] 14. `entities/task-series`: `task-series.queries.ts` + `index.ts`
- [x] 15. `/task-series`: `SeriesListHeader`, `SeriesList`, `SeriesCard`
- [x] 16. Серия: `SeriesForm`, `SeriesRuleFields`, `SeriesPreviewAside`, создание
- [x] 17. Серия: правка через preview → apply (`SeriesScopeDialog`)
- [x] 18. Серия: `SeriesHeader` (pause/end), `ResumeSeriesDialog`, `SeriesIssueNote`
- [x] 19. Серия: `SeriesTasks`, `SeriesHistory`
- [ ] 20. `tsc` + `lint`, проверка в браузере по разделу «Проверка», сверка жёлтых/красных бордеров

## Этап 1. Сущности

### `src/entities/task/`
- `api/task.queries.ts` — по образцу `src/entities/booking/api/booking.queries.ts`:
  - `taskKeys`: `all`, `lists(orgId)`, `list(orgId, filters)`, `count(orgId, filters)`, `detail`, `history`, `participants(orgId, propertyId?)`, `photo(orgId, taskId, photoId)`.
  - `useTasks(orgId, filters)` — `useInfiniteQuery` (порядок бэка уже нужный; образец — `entities/notification/api/notification.queries.ts`), `getNextPageParam` по `meta.current_page < meta.last_page`.
  - `useTasksCount(orgId, filters)` — первая страница, `select: meta.total`; для счётчиков вкладок.
  - `useTask`, `useTaskHistory` (обход всех страниц, как `bookingHistoryQueryOptions`), `useTaskParticipants(orgId, propertyId?, {enabled})` (обход страниц).
  - `useTaskPhoto` — blob → `URL.createObjectURL`, `staleTime: Infinity`, `gcTime` с `revokeObjectURL` при размонтировании компонента-превью.
  - Мутации: `useCreateTask` (idempotency через `useRef`, как `useCreateBooking`), `useUpdateTask`, `useTaskAction(orgId, taskId, action)` для `start|checklist|complete|approve|return|cancel`, `useUploadTaskPhoto`, `useDeleteTaskPhoto`. Общий `useTaskSaved`: `setQueryData(detail)`, инвалидация `lists`, `history`; на `version_conflict`/`task_state_conflict` — инвалидация `detail`. `meta: { inlineFieldErrors, getErrorMessage: getTaskErrorText, successMessage }`. Чек-лист — без `successMessage` (частое действие).
- `model/conflict.ts` — `getTaskConflict`, `getTaskErrorText` (русские тексты по `TaskConflictCode`), по образцу `booking/model/conflict.ts`.
- `model/status.ts` — `getTaskDisplayStatus(task)` → ключ `TASK_STATUS` из `shared/ui/rb/status-presets.ts`: `cancelled`; `completed→accepted`; `in_review→review`; `is_overdue→overdue`; `in_progress` + `current_report?.decision==='returned'` → `returned`; `in_progress`; `open→todo`.
- `model/due.ts` — `toDueAt(date, time, timezone)` → ISO с секундами и `Z` (смещение пояса через `Intl.DateTimeFormat`, `date-fns-tz` в проекте нет); `formatDue(due_at, timezone)`; `getBrowserTimezone()`.
- `model/people.ts` — `usePersonNames(orgId)`: карта `membership_id→name` и `user_id→name` из `task-participants` (enabled только при `!isEmployee(role)`); фолбэк: свой id → «Вы», иначе «Участник #id».
- `model/schemas.ts` — zod: `taskSchema` (create), `taskEditSchema` + `getTaskChanges` (только изменённое, срок парой), `cancelTaskSchema`, `returnTaskSchema`, `completeTaskSchema`.
- `index.ts`.

### `src/entities/task-series/`
- `api/task-series.queries.ts`: `taskSeriesKeys`; `useTaskSeriesList(orgId, status)` (обход страниц), `useTaskSeriesItem`, `useTaskSeriesHistory`; мутации `useCreateTaskSeries` (idempotency), `usePreviewTaskSeries` (без тоста успеха), `useApplyTaskSeries`, `usePauseTaskSeries`, `useResumeTaskSeries`, `useEndTaskSeries`. После apply/resume инвалидировать и `taskKeys.lists`.
- `model/conflict.ts` — тексты по `TaskSeriesConflictCode`; `preview_conflict` → «запросите предпросмотр заново».
- `model/rule.ts` — `describeSchedule(schedule)` («По пятницам, 10:00», «Ежемесячно, 12 числа, 11:00»), `nextOccurrences(schedule, limit)` (перенос логики из текущего `TaskSeriesItemPage`, с учётом `missing_day`), `currentSegment(series)` (последний `from ≤ сегодня`, иначе первый).
- `model/schemas.ts` — `seriesSchema` (template + schedule, условные `weekdays`/`month_day`), `seriesChangeSchema`, `resumeSeriesSchema`.
- В `status-presets.ts` добавить `blocked` в `SeriesStatus`/`SERIES_STATUS`.

## Этап 2. Список `/tasks`

`src/pages/tasks/TasksPage.tsx` → тонкая страница + `components/`:
- `TasksHeader.tsx` — заголовок, сводка (счётчики today/overdue/in_review из `useTasksCount`), кнопки «Создать задачу» / «Серии». Строка «время объектов …» → пояс браузера.
- `TasksTabs.tsx` — `ResponsiveTabs`; вкладка = набор параметров запроса: `today {view,timezone}`, `my {view:'mine'}`, `upcoming`, `overdue`, `review {status:'in_review'}`, `team {view:'staff'}`. Сотруднику — без `review` и `team`. Счётчик на вкладку — `useTasksCount`.
- `TasksFilter.tsx` — `PropertyFilter` (`?object`) + фильтр исполнителя (`?assignee`, только руководящим, опции из `useTaskParticipants`). Поиск убрать — на бэке его нет.
- `TasksList.tsx` — `useTasks`, loading/error/empty через `StateView` (как `BookingsList`), «Показать ещё» = `fetchNextPage`.
- `TaskRow.tsx` — строка из текущей вёрстки на типе `Task`: время/дата в `task.timezone`, `property_context.name`, `бронь #id`, чек-лист `done/total`, иконки `requires_photo` / `series_id`, статус через `getTaskDisplayStatus`; «Проверить» при `allowed_actions.includes('approve')`.
- `paths.ts`: `to.task`/`to.taskSeriesItem` принимают `number | string`.
- `LayoutRoot.tsx`: добавить `ROUTES.TASKS`, `ROUTES.TASK`, `ROUTES.TASK_SERIES`, `ROUTES.TASK_SERIES_ITEM` в `PAGES_WITHOUT_DEMO_TOOLS`.

### Форма создания — `src/widgets/task-actions/TaskFormSheet.tsx`
- react-hook-form + `zodResolver(taskSchema)`, шаги остаются, переход «Далее» через `trigger()` полей шага. Шапка Sheet не скроллится (скролл только в `SheetBody`).
- Шаги: «Что сделать» (название, описание, объект из `useAllProperties`, чек-лист — `useFieldArray`), «Кому» (личная/командная; исполнитель из `useTaskParticipants(propertyId)`; сотруднику — только личная себе), «Срок» (дата+время необязательны, пояс = пояс объекта или браузера), «Фото и приёмка» (`requires_photo`, `requires_review`, проверяющий; для личной приёмка скрыта), «Проверьте».
- Шаги «Повтор» и «Напоминания» убрать: напоминаний на бэке нет, серия создаётся на своей странице — на шаге «Проверьте» ссылка «Нужен повтор? Создать серию».
- Пропсы: `trigger`, `propertyId?: number`, `bookingId?: number`. Прежние `me`/`personal` убрать (берём из `useCurrentOrganization`).
- После успеха — закрыть, `reset`, перейти в карточку.

## Этап 3. Карточка `/tasks/:taskId`

`src/pages/task/TaskPage.tsx` + `components/`:
- `TaskHeader.tsx` — `RecordHeader`, факты, кнопки по `allowed_actions`.
- `TaskActions.tsx` — `start` → «Начать»; `complete` → `CompleteTaskDialog`; `approve`/`return` → `ReviewTaskDialog`; `update` → `TaskEditSheet`; `cancel` → `CancelTaskDialog`.
- `TaskChecklist.tsx` — `shared/ui/rb/Checklist`, клик шлёт полный `completed_indexes` (`useTaskAction('checklist')`), `readOnly` без `checklist` в `allowed_actions`.
- `TaskPhotos.tsx` — `draft_photos` + фото `current_report.photos`; превью через `useTaskPhoto`; загрузка по одному файлу последовательно (каждая меняет `version`), удаление черновика.
- `TaskReturnedNote.tsx` — из `current_report` при `decision==='returned'`.
- `TaskHistory.tsx` — `useTaskHistory` → `HistoryFeed`; текст по `TaskRevisionAction`, `reason`, имя по `actor_id`.
- `TaskSidebar.tsx` — «Где» (`property_context`, ссылка на бронь только руководящим), «Люди», «Серия» (ссылка, если не сотрудник).
- `TaskEditSheet.tsx`, `CancelTaskDialog.tsx`, `CompleteTaskDialog.tsx` — по образцу `pages/booking/components/BookingEditSheet.tsx` и `CancelBookingDialog.tsx`.
- `widgets/task-actions/ReviewTaskDialog.tsx` — на rhf+zod: accept → `approve`; return → `reason`, дата+время → `due_at`, `timezone`.
- 404 → «Задача не найдена» (`skipErrorToast`, как у брони).
- Остаются моком с `MOCK_BORDER`: блок «Напоминания», `HelpRequestDialog`, `PostponeTaskDialog`, «Напомнить исполнителю».

## Этап 4. Серии

- `src/pages/task-series/TaskSeriesPage.tsx` + `components/SeriesHeader.tsx`, `SeriesList.tsx`, `SeriesCard.tsx`: название/исполнитель из `currentSegment`, правило `describeSchedule`, ближайшие даты `nextOccurrences`, статус + `generation_issue`. Сотруднику страница открыта (бэк отдаёт его личные серии), `denied` убрать.
- `src/pages/task-series/TaskSeriesItemPage.tsx` + `components/`:
  - `SeriesForm.tsx` — rhf+zod. Режим **new**: всё редактируемо (шаблон как у задачи + расписание), submit → `createTaskSeries` → redirect на карточку. Режим **edit**: редактируемы название, описание, исполнитель, расписание, `effective_from`; объект/видимость/чек-лист/фото/приёмка — `disabled` с пояснением.
  - `SeriesRuleFields.tsx` — частота (`daily|weekly|monthly`, без «после выезда»), дни недели (`ToggleGroup`), число месяца + `missing_day`, время, пояс (`TimezoneSelect`), начало, окончание (`никогда|до даты`, без «после N»).
  - `SeriesPreviewAside.tsx` — «Ближайшие даты» из `nextOccurrences` по значениям формы (`useWatch`).
  - `SeriesHeader.tsx` — `RecordHeader`, действия по `allowed_actions`: pause, end (подтверждение), resume → `ResumeSeriesDialog` (skip / recover + дата).
  - `SeriesIssueNote.tsx` — баннер для `blocked` по `generation_issue`.
  - `SeriesTasks.tsx` — выполнения серии: `useTasks({seriesId})`, переиспользует `TaskRow`.
  - `SeriesHistory.tsx` — `useTaskSeriesHistory` → `HistoryFeed`.
- `widgets/task-actions/SeriesScopeDialog.tsx` → диалог подтверждения изменения: «Сохранить» вызывает `preview`, диалог показывает `updates / cancellations / creations / preserved` и `generation_issue`; «Применить» шлёт то же тело + `preview_hash`. `preview_conflict` → повторный preview.

## Вне объёма

`pages/property/property-tasks`, `TodayPage`, `CalendarPage`, `BookingMockTabs`, `PrepTab` используют свои моки задач — не трогаем (кроме правки под новую сигнатуру `to.task`, если сломается типизация).

## Проверка

1. `npx tsc --noEmit` и `npm run lint` — без ошибок после каждого этапа.
2. Dev-сервер + бэк `../api-rentybot`, вход кодом `111111`, в браузере (Claude in Chrome):
   - `/tasks`: вкладки меняют запрос (`view`/`status` в Network), счётчики = `meta.total`, фильтры объекта/исполнителя, «Показать ещё».
   - Создать личную и командную задачу (с чек-листом, фото, приёмкой) → появляется в списке и открывается.
   - Карточка: начать → отметить чек-лист → загрузить фото → отправить → принять / вернуть с новым сроком → отменить. История пополняется.
   - Вторая вкладка: устаревшая версия → понятный тост и свежая карточка.
   - Серия: создать weekly → выполнения в списке задач; изменить правило → предпросмотр → применить; пауза → возобновление skip/recover; завершение.
   - Под сотрудником: нет вкладок «На проверке»/«Сотрудников», нет запроса `task-participants`, только личные задачи.
3. `grep MOCK_BORDER src/pages/task* src/widgets/task-actions` — остались только блоки без ручек на бэке.
