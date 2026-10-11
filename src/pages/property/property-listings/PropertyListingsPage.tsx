import { cn } from '@/shared/lib/utils'
import { MOCK_BORDER } from '@/shared/mock/mock-border'
import { MOCK_PROPERTY } from '../model/mock'
import { ListingsTab } from './components/ListingsTab'

// Вкладка ещё на моках: показывает макетный объект, а не открытый
const PropertyListingsPage = () => (
  <div className={cn('rounded-card p-2', MOCK_BORDER)}>
    <ListingsTab property={MOCK_PROPERTY} />
  </div>
)

export default PropertyListingsPage
