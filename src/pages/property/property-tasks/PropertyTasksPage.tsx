import { cn } from '@/shared/lib/utils'
import { MOCK_BORDER } from '@/shared/mock/mock-border'
import { MOCK_PROPERTY } from '../model/mock'
import { TasksTab } from './components/TasksTab'

// Вкладка ещё на моках: показывает макетный объект, а не открытый
const PropertyTasksPage = () => (
  <div className={cn('rounded-card p-2', MOCK_BORDER)}>
    <TasksTab property={MOCK_PROPERTY} />
  </div>
)

export default PropertyTasksPage
