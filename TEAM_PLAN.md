# План: Team (команда и приглашения) на настоящей логике

## Context

Раздел «Команда и доступ» (`/app/:orgId/settings/team`) и страница приглашения (`/invite/:token`) — статичные макеты на моках. На бэке модуль Team готов (OpenAPI 0.13.0, `TeamController`), orval-функции уже сгенерированы (`src/shared/api/generated/team/team.ts`), но хуков и сущности нет. Цель — перевести оба экрана на API по правилам проекта (блоки, query-хуки руками, RHF + zod, красный бордер на остатках моков).

Источники: `../api-rentybot-main/docs/openapi.yaml` (тег Team), `routes/session-api.php:113-121`, `app/Http/Controllers/TeamController.php`, `app/Services/TeamAccess.php`, `app/Services/PropertyAccess.php`, `docs/progress.md` (этапы 3 и 5). Инструкции `frontend/03-team.md`, на которую ссылается progress.md, на диске нет — она в другом репозитории.

## Что даёт бэк

| Ручка | Функция orval | Кто может |
|---|---|---|
| GET `organizations/{o}/members` | `listOrganizationMembers` | owner, manager; 20/стр, id ASC |
| GET `organizations/{o}/team-roles` | `getTeamRoles` | любой участник |
| POST `organizations/{o}/members/{m}` | `changeMemberRole` | роль + необязательный `property_ids` |
| POST `organizations/{o}/members/{m}/properties` | `replaceMemberProperties` | полная замена объектов |
| POST `organizations/{o}/members/{m}/remove` | `revokeMembership` | 204 |
| GET `organizations/{o}/invitations` | `listTeamInvitations` | owner — все, manager — только administrator/employee; все статусы, 20/стр, id ASC |
| POST `organizations/{o}/invitations` | `createTeamInvitation` | 201, `token` только в этом ответе |
| POST `organizations/{o}/invitations/{i}/revoke` | `revokeTeamInvitation` | 204; принятое — 409 |
| GET `team-invitations/{token}` | `previewTeamInvitation` | вход с email приглашённого |
| POST `team-invitations/{token}/accept` | `acceptTeamInvitation` | возвращает Membership |

Правила: owner управляет manager/administrator/employee, manager — только administrator/employee (`assignable_roles`). Owner не меняется и не удаляется. Статусы приглашения: pending / accepted / revoked / expired, срок 7 дней.

## Расхождения макета и бэка (главное)

1. **Роли.** В макете три (owner/manager/employee), на бэке четыре — добавить `administrator`. Подписи уже есть в `src/entities/organization/model/roles.ts` (`getRoleLabel`).
2. **Приглашение по email, не по имени и телефону.** Поля «Имя» и «Телефон» в диалоге заменить одним email.
3. **Доставки нет.** Ссылку передают вручную, токен приходит один раз. После создания показываем шаг «Скопируйте ссылку» (`${origin}/invite/${token}`) с предупреждением, что повторно её не показать. «Напомнить» убрать; «Отправить заново» = новое приглашение с теми же email/ролью/объектами (бэк сам отзывает прежние действующие) и снова шаг со ссылкой.
4. **Дополнительные права (деньги, реквизиты, выгрузки)** бэк запрещает (`permissions: prohibited`). Блок остаётся на моках с `MOCK_BORDER`, в запрос не уходит.
5. **Строка участника.** API отдаёт `id`, `role`, `user{id,name,email}`, `property_ids`. Телефон → email; «duty», «MAX не доставляет» убрать (данных нет). «Это вы» — по `user.id === currentUser.id`, а не по роли owner.
6. **Отзыв доступа.** Блок «Открытые задачи — кому передать» ручкой не покрыт (задачи получают `needs_reassignment`) — остаётся с `MOCK_BORDER`; кнопка отзыва работает по-настоящему.
7. **Матрица «Что даёт роль»** — строить из `team-roles.roles[].permissions`, не из констант. Бэк отдаёт права, которых нет в enum свагера (`instructions.*`, `guest_access.manage`) — словарь подписей с фолбэком на сырую строку, тип — `string`.
8. **Просмотр приглашения.** Нет имени пригласившего и даты отправки; объекты — только `property_ids` (названий нет, приглашённый ещё не участник) → показываем количество. «Сможете / Не увидите» — из `permissions`. 404 = чужой email или неизвестный токен; 410 = недоступно (истекло / отозвано / использовано — бэк не различает) → один экран «Приглашение недоступно» вместо двух. Ручки «Отклонить» нет — кнопка просто уводит на `/`.
9. **Ловушка с `property_ids`.** Замена полная, а `validateIds` принимает только активные объекты в доступе назначающего. У участника могут быть архивные объекты или объекты вне доступа управляющего — отправка их даст 422. Форму инициализируем пересечением `member.property_ids` с `useAllProperties`; если что-то отсекается, показываем строку «N объектов вне вашего доступа будут сняты».
10. **Сообщения бэка на английском** («User is already a member.»). Дубль email ловим до запроса — по загруженному списку участников, ошибкой под полем.
11. **Нет ручек:** «мои непринятые приглашения» (`InviteBanner` остаётся моком), выход из организации (`LeaveDialog` остаётся моком).

## Шаги

### 1. Сущность `src/entities/team`

- `api/team.queries.ts`
  - `teamKeys`: `all`, `members(orgId)`, `roles(orgId)`, `invitations(orgId)`, `invitationPreview(token)`.
  - `teamMembersQueryOptions` / `useTeamMembers` и `teamInvitationsQueryOptions` / `useTeamInvitations` — обход всех страниц, как `allPropertiesQueryOptions` в `src/entities/property/api/property.queries.ts` (id ASC и все статусы: действующие приглашения иначе окажутся на последних страницах).
  - `teamRolesQueryOptions` / `useTeamRoles`.
  - `useUpdateMember(orgId)` — `changeMemberRole` с `role` + `property_ids` одним запросом; `meta: { inlineFieldErrors: true, successMessage: 'Доступ изменён' }`; инвалидирует `members` и `invitations` (смена роли отзывает приглашения участника).
  - `useRemoveMember(orgId)` — `successMessage: 'Доступ отозван'`, инвалидирует `members` и `invitations`.
  - `useCreateInvitation(orgId)` — `inlineFieldErrors`, без `successMessage` (успех — шаг со ссылкой); инвалидирует `invitations`.
  - `useRevokeInvitation(orgId)` — `successMessage: 'Приглашение отозвано'`.
  - `invitationPreviewQueryOptions(token)` / `useInvitationPreview` — `meta: { skipErrorToast: true }`, 404/410 рисует страница.
  - `useAcceptInvitation(token)` — `successMessage: 'Вы в команде'`; инвалидирует `organizationKeys.all`.
  - `replaceMemberProperties` не используем: `changeMemberRole` покрывает оба случая.
- `model/schemas.ts` — `invitationSchema` (email: trim, toLowerCase, email, max 255; role; property_ids: number[]) и `memberAccessSchema` (role, property_ids).
- `model/permissions.ts` — подписи прав и группировка для матрицы и предпросмотра.
- `model/invitations.ts` — `INVITATION_STATUS_META` для `StatusFromMeta`.
- `index.ts` — экспорт наружу.

### 2. Настройки → вложенные страницы (как профиль)

По образцу `src/pages/profile/LayoutProfile.tsx` + `profile-*`:

- `src/pages/settings/LayoutSettings.tsx` — шапка и вкладки из нынешнего `SettingsPage.tsx`, `<Outlet />`. Название организации — из `useCurrentOrganization`, вместо «Волна».
- `src/pages/settings/settings-team/SettingsTeamPage.tsx` + `components/`:
  - `TeamMembers.tsx`, `MemberRow.tsx`
  - `TeamInvitations.tsx`, `InvitationRow.tsx`
  - `RoleMatrix.tsx`
  - `InviteDialog.tsx` (форма → шаг со ссылкой), `InviteLinkStep.tsx`
  - `MemberAccessDialog.tsx`, `RevokeAccessDialog.tsx` — переезжают из `src/widgets/settings-actions/` (нужны только этой странице)
  - `RoleRadio.tsx`, `PropertyChecklist.tsx` — общие поля двух диалогов, через `Controller`
  - `ExtraRightsMock.tsx`, `ReassignTasksMock.tsx` — с `MOCK_BORDER`
- Остальные пять секций (`ui/*Section.tsx`) остаются моками, подключаются дочерними маршрутами как есть.
- Доступ к странице: `team-roles.permissions` содержит `team.view`, иначе `StateView state="denied"`. Кнопки строки — по `assignable_roles.includes(member.role)`; «Пригласить» — если `assignable_roles` не пуст.
- Состояния: `StateView` loading / error / empty, как в `src/pages/notifications/components/NotificationsList.tsx`.

### 3. Страница приглашения

- `src/pages/invite/InvitePage.tsx` + `components/` (`InviteHeader`, `InviteRights`, `InviteProperties`, `InviteActions`, `InviteUnavailable`).
- `useInvitationPreview(token)`; 404 → «Приглашение не найдено или выписано на другую почту» + текущий email из `useCurrentUser` и кнопка выхода (`useLogout` из `src/features/logout`); 410 → «Приглашение недоступно».
- Принятие: успех → `navigate('/app/${organization_id}')`. 409 (уже участник) → туда же. 410 → перечитать превью.

### 4. Маршруты и навигация

- `src/app/router/routes.ts`: `ROUTES.SETTINGS` → `LayoutSettings` с `children`; `InvitePage` переносим из `mockPrivateRoutes` в `privateRoutes`. Настройки целиком остаются в `mockAppRoutes` (пять секций из шести — моки), с комментарием, что `team` уже на API.
- `src/shared/layouts/layout-root/LayoutRoot.tsx`: в `PAGES_WITHOUT_DEMO_TOOLS` добавить `ROUTES.INVITE` и `/app/:orgId/settings/team`.
- `src/widgets/app-shell/nav.ts`: пункт «Команда» — `roles: ['owner', 'manager']` (бэк пускает управляющего).

### 5. Вне объёма

`InviteBanner`, `LeaveDialog`, доп. права, передача задач при отзыве, доставка приглашений — ждут ручек на бэке, остаются с красным бордером.

## Проверка

1. `npx tsc --noEmit` и `npx oxlint`.
2. В браузере (dev, код входа 111111), два аккаунта:
   - owner: список участников, матрица ролей, приглашение employee с объектами → ссылка скопирована → в списке «Ждёт ответа»;
   - второй аккаунт с тем же email: `/invite/:token` без входа → логин → возврат на приглашение (через `state.from`, `src/entities/auth/model/auth-flow.ts`) → превью → «Принять» → кабинет организации;
   - owner: новый участник в списке, смена роли и объектов, отзыв доступа;
   - отзыв приглашения → по ссылке экран «недоступно» (410); чужой email → 404-экран;
   - повторное приглашение того же email — прежнее становится «Отозвано»; email участника — ошибка под полем;
   - manager: не видит кнопок у owner и manager, в ролях только administrator/employee; employee — «Раздел недоступен».
3. Поиск `MOCK_BORDER` — остались только блоки из п. 5.
