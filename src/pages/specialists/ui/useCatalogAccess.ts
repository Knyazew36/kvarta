import { useSearchParams } from 'react-router'
import type { CatalogAccess } from '@/shared/ui/rb/status-presets'

const ACCESS_VALUES: CatalogAccess[] = ['open', 'stale', 'closed', 'pending']

// Допуск — свойство пользователя, а не экрана: в макете переключается ссылкой ?access=
export const useCatalogAccess = () => {
  const [params] = useSearchParams()
  const value = params.get('access') as CatalogAccess | null
  const access = value && ACCESS_VALUES.includes(value) ? value : 'open'
  // При сбое обмена каталог открыт по последним данным (CAT-04); закрыт — только closed и pending
  return { access, isOpen: access === 'open' || access === 'stale' }
}
