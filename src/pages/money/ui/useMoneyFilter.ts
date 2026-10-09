import { useSearchParams } from 'react-router'
import { useDemoState } from '@/shared/mock/state'

const SINGLE_OBJECT = 'ligovsky'

type Filterable = { propertyId: string; guest: string; number: string }

// Фильтры денег — общие для всех вкладок: объект и поиск по гостю/номеру лежат в ссылке
export const useMoneyFilter = () => {
  const [params] = useSearchParams()
  const { singleObject } = useDemoState()
  const property = params.get('property')
  const query = (params.get('q') ?? '').trim().toLowerCase()
  return <T extends Filterable>(rows: T[]) =>
    rows.filter(
      (row) =>
        (!singleObject || row.propertyId === SINGLE_OBJECT) &&
        (!property || row.propertyId === property) &&
        (!query || `${row.guest} ${row.number}`.toLowerCase().includes(query)),
    )
}
