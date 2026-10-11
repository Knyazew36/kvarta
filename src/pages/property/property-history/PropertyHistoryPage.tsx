import { cn } from '@/shared/lib/utils'
import { MOCK_BORDER } from '@/shared/mock/mock-border'
import { HistoryFeed } from '@/shared/ui/rb/HistoryFeed'
import { SectionCard } from '@/shared/ui/rb/Section'
import { MOCK_HISTORY } from '../model/mock'

// Истории объекта на бэке нет
const PropertyHistoryPage = () => (
  <SectionCard title="История" count={MOCK_HISTORY.length} className={cn('shadow-card', MOCK_BORDER)}>
    <HistoryFeed entries={MOCK_HISTORY} />
  </SectionCard>
)

export default PropertyHistoryPage
