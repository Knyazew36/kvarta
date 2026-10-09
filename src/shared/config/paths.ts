// Шаблоны маршрутов для роутера (§8 структуры фронта)
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  INVITE: '/invite/:token',
  WORKSPACES: '/workspaces',
  ORG_NEW: '/org/new',
  ONBOARDING: '/app/:orgId/onboarding',
  UI: '/ui',
  PAGES: '/pages',
  UX: '/ux',

  APP: '/app/:orgId',
  TODAY: '/app/:orgId/today',
  CALENDAR: '/app/:orgId/calendar',
  BOOKINGS: '/app/:orgId/bookings',
  BOOKING: '/app/:orgId/bookings/:bookingId/:tab?',
  REQUEST: '/app/:orgId/requests/:requestId',
  TASKS: '/app/:orgId/tasks',
  TASK: '/app/:orgId/tasks/:taskId',
  TASK_SERIES: '/app/:orgId/task-series',
  TASK_SERIES_ITEM: '/app/:orgId/task-series/:seriesId',
  PROPERTIES: '/app/:orgId/properties',
  PROPERTY: '/app/:orgId/properties/:propertyId/:tab?',
  MONEY: '/app/:orgId/money/:tab?',
  NOTIFICATIONS: '/app/:orgId/notifications',
  SETTINGS: '/app/:orgId/settings/:section?',
  HELP: '/app/:orgId/help',
  SPECIALISTS: '/app/:orgId/specialists',
  SPECIALIST: '/app/:orgId/specialists/:specialistId',
  SPECIALIST_FAVORITES: '/app/:orgId/specialist-favorites',
  SPECIALIST_REQUESTS: '/app/:orgId/specialist-requests',
  PROFILE: '/app/:orgId/profile/:tab?',

  HOST: '/host/:ownerSlug',
  HOST_PROPERTY: '/host/:ownerSlug/properties/:propertySlug',
  HOST_CHECKOUT: '/host/:ownerSlug/checkout',
  GUEST_REQUEST: '/guest/requests/:requestId',
  GUEST_BOOKINGS: '/guest/bookings',
  GUEST_BOOKING: '/guest/bookings/:bookingId',
  GUEST_INSTRUCTIONS: '/guest/bookings/:bookingId/instructions',

  // Кабинет специалиста: свои права, без организации и без поиска по каталогу (CAT-06)
  SPECIALIST_PROFILE: '/specialist/profile',
  SPECIALIST_INBOX: '/specialist/requests',
  SPECIALIST_REVIEWS: '/specialist/reviews',
} as const

// Организация по умолчанию для статичных макетов
export const DEMO_ORG_ID = 'org-volna'
export const DEMO_OWNER_SLUG = 'anna-volkova'

// Готовые ссылки: собирать путь в одном месте, а не конкатенацией по страницам
export const to = {
  today: (orgId = DEMO_ORG_ID) => `/app/${orgId}/today`,
  calendar: (orgId = DEMO_ORG_ID) => `/app/${orgId}/calendar`,
  bookings: (orgId = DEMO_ORG_ID) => `/app/${orgId}/bookings`,
  booking: (bookingId: string, tab = 'overview', orgId = DEMO_ORG_ID) =>
    `/app/${orgId}/bookings/${bookingId}/${tab}`,
  request: (requestId: string, orgId = DEMO_ORG_ID) => `/app/${orgId}/requests/${requestId}`,
  tasks: (orgId = DEMO_ORG_ID) => `/app/${orgId}/tasks`,
  task: (taskId: string, orgId = DEMO_ORG_ID) => `/app/${orgId}/tasks/${taskId}`,
  taskSeries: (orgId = DEMO_ORG_ID) => `/app/${orgId}/task-series`,
  taskSeriesItem: (seriesId: string, orgId = DEMO_ORG_ID) => `/app/${orgId}/task-series/${seriesId}`,
  properties: (orgId = DEMO_ORG_ID) => `/app/${orgId}/properties`,
  property: (propertyId: string, tab = 'info', orgId = DEMO_ORG_ID) =>
    `/app/${orgId}/properties/${propertyId}/${tab}`,
  money: (orgId = DEMO_ORG_ID) => `/app/${orgId}/money`,
  moneyTab: (tab: string, orgId = DEMO_ORG_ID) => `/app/${orgId}/money/${tab}`,
  notifications: (orgId = DEMO_ORG_ID) => `/app/${orgId}/notifications`,
  settings: (section = 'team', orgId = DEMO_ORG_ID) => `/app/${orgId}/settings/${section}`,
  help: (orgId = DEMO_ORG_ID) => `/app/${orgId}/help`,
  specialists: (orgId = DEMO_ORG_ID) => `/app/${orgId}/specialists`,
  specialist: (specialistId: string, orgId = DEMO_ORG_ID) => `/app/${orgId}/specialists/${specialistId}`,
  specialistFavorites: (orgId = DEMO_ORG_ID) => `/app/${orgId}/specialist-favorites`,
  specialistRequests: (orgId = DEMO_ORG_ID) => `/app/${orgId}/specialist-requests`,
  // Без вкладки — корень профиля: так пункт меню остаётся активным на любой вкладке
  profile: (tab?: string, orgId = DEMO_ORG_ID) => `/app/${orgId}/profile${tab ? `/${tab}` : ''}`,
  onboarding: (orgId = DEMO_ORG_ID) => `/app/${orgId}/onboarding`,
  host: (ownerSlug = DEMO_OWNER_SLUG) => `/host/${ownerSlug}`,
  hostProperty: (propertySlug: string, ownerSlug = DEMO_OWNER_SLUG) =>
    `/host/${ownerSlug}/properties/${propertySlug}`,
  hostCheckout: (ownerSlug = DEMO_OWNER_SLUG) => `/host/${ownerSlug}/checkout`,
  guestRequest: (requestId: string) => `/guest/requests/${requestId}`,
  guestBookings: () => '/guest/bookings',
  guestBooking: (bookingId: string) => `/guest/bookings/${bookingId}`,
  guestInstructions: (bookingId: string) => `/guest/bookings/${bookingId}/instructions`,
  specialistProfile: () => '/specialist/profile',
  specialistInbox: () => '/specialist/requests',
  specialistReviews: () => '/specialist/reviews',
}
