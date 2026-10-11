import { cn } from '@/shared/lib/utils'
import { MOCK_BORDER } from '@/shared/mock/mock-border'
import { MOCK_PROPERTY } from '../model/mock'
import { CalendarTab } from './components/CalendarTab'

// Вкладка ещё на моках: показывает макетный объект, а не открытый
const PropertyCalendarPage = () => (
  <div className={cn('rounded-card p-2', MOCK_BORDER)}>
    <CalendarTab property={MOCK_PROPERTY} />
  </div>
)

export default PropertyCalendarPage
