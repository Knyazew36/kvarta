import { BrushCleaningIcon, CameraIcon, DropletsIcon, HammerIcon, type LucideIcon, PlugZapIcon, ShirtIcon, WashingMachineIcon } from 'lucide-react'

// Один справочник категорий и услуг для фильтров каталога и формы профиля специалиста:
// иначе специалист отметит услугу, которую поиск не знает (спека 11, «Данные»). Состав пилота открыт
export type ServiceCategory = {
  value: string
  label: string
  icon: LucideIcon
  services: { value: string; label: string }[]
}

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    value: 'cleaning',
    label: 'Уборка',
    icon: BrushCleaningIcon,
    services: [
      { value: 'turnover', label: 'Между заездами' },
      { value: 'deep', label: 'Генеральная' },
      { value: 'linen-change', label: 'Смена белья' },
      { value: 'after-repair', label: 'После ремонта' },
    ],
  },
  {
    value: 'plumbing',
    label: 'Сантехника',
    icon: DropletsIcon,
    services: [
      { value: 'leaks', label: 'Протечки' },
      { value: 'faucets', label: 'Замена смесителей' },
      { value: 'clogs', label: 'Засоры' },
      { value: 'boiler', label: 'Водонагреватели' },
    ],
  },
  {
    value: 'electric',
    label: 'Электрика',
    icon: PlugZapIcon,
    services: [
      { value: 'sockets', label: 'Розетки и выключатели' },
      { value: 'lighting', label: 'Освещение' },
      { value: 'panel', label: 'Электрощиток' },
    ],
  },
  {
    value: 'repair',
    label: 'Мелкий ремонт',
    icon: HammerIcon,
    services: [
      { value: 'furniture', label: 'Сборка и ремонт мебели' },
      { value: 'locks', label: 'Двери и замки' },
      { value: 'mounting', label: 'Полки и карнизы' },
    ],
  },
  {
    value: 'appliances',
    label: 'Ремонт техники',
    icon: WashingMachineIcon,
    services: [
      { value: 'washers', label: 'Стиральные машины' },
      { value: 'fridges', label: 'Холодильники' },
      { value: 'stoves', label: 'Плиты и духовки' },
    ],
  },
  {
    value: 'linen',
    label: 'Бельё',
    icon: ShirtIcon,
    services: [
      { value: 'laundry', label: 'Стирка' },
      { value: 'ironing', label: 'Глажка' },
      { value: 'rental', label: 'Прокат комплектов' },
    ],
  },
  {
    value: 'photo',
    label: 'Фотосъёмка',
    icon: CameraIcon,
    services: [
      { value: 'interior', label: 'Интерьерная съёмка' },
      { value: 'video', label: 'Видеообзор' },
    ],
  },
]

export const CATEGORY_BY_VALUE = Object.fromEntries(SERVICE_CATEGORIES.map((category) => [category.value, category])) as Record<string, ServiceCategory>

export const SERVICE_LABEL = Object.fromEntries(
  SERVICE_CATEGORIES.flatMap((category) => category.services.map((service) => [service.value, service.label])),
) as Record<string, string>

// Пилот — один город (регион ещё не выбран, в макете — Петербург)
export const PILOT_CITY = 'Санкт-Петербург'

export const PILOT_DISTRICTS = [
  { value: 'central', label: 'Центральный' },
  { value: 'admiralty', label: 'Адмиралтейский' },
  { value: 'petrogradsky', label: 'Петроградский' },
  { value: 'primorsky', label: 'Приморский' },
  { value: 'frunzensky', label: 'Фрунзенский' },
  { value: 'moskovsky', label: 'Московский' },
  { value: 'kurortny', label: 'Курортный' },
]

export const DISTRICT_LABEL = Object.fromEntries(PILOT_DISTRICTS.map((district) => [district.value, district.label])) as Record<string, string>
