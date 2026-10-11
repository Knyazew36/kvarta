import { cn } from '@/shared/lib/utils'
import { MOCK_BORDER } from '@/shared/mock/mock-border'
import { MOCK_PROPERTY } from '../model/mock'
import { InstructionsTab } from './components/InstructionsTab'

// Вкладка ещё на моках: показывает макетный объект, а не открытый
const PropertyInstructionsPage = () => (
  <div className={cn('rounded-card p-2', MOCK_BORDER)}>
    <InstructionsTab property={MOCK_PROPERTY} />
  </div>
)

export default PropertyInstructionsPage
