import { useCurrentOrganization } from '@/entities/organization'
import { cn } from '@/shared/lib/utils'
import { MOCK_BORDER } from '@/shared/mock/mock-border'
import { MOCK_PROPERTY } from '../model/mock'
import { BookingsTab } from './components/BookingsTab'

// Вкладка ещё на моках: показывает макетный объект, а не открытый. Суммы видит только владелец
const PropertyBookingsPage = () => {
  const { role } = useCurrentOrganization()

  return (
    <div className={cn('rounded-card p-2', MOCK_BORDER)}>
      <BookingsTab property={MOCK_PROPERTY} canSeeMoney={role === 'owner'} />
    </div>
  )
}

export default PropertyBookingsPage
