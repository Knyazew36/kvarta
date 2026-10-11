import { useCurrentOrganization } from '@/entities/organization'
import { cn } from '@/shared/lib/utils'
import { MOCK_BORDER } from '@/shared/mock/mock-border'
import { StateView } from '@/shared/ui/rb/StateView'
import { MOCK_PROPERTY } from '../model/mock'
import { DirectTab } from './components/DirectTab'

// Вкладка ещё на моках: показывает макетный объект, а не открытый.
// Прямое бронирование — про деньги и публикацию, это зона владельца: остальным вкладку не показывает и LayoutProperty
const PropertyDirectPage = () => {
  const { role } = useCurrentOrganization()

  if (role !== 'owner') {
    return <StateView state="denied" denied={{ title: 'Раздел недоступен', description: 'Прямое бронирование настраивает владелец организации.' }} />
  }

  return (
    <div className={cn('rounded-card p-2', MOCK_BORDER)}>
      <DirectTab property={MOCK_PROPERTY} canPublish />
    </div>
  )
}

export default PropertyDirectPage
