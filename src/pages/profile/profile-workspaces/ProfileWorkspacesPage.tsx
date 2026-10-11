import { HelpCard } from './components/HelpCard'
import { OrganizationList } from './components/OrganizationList'
import { OtherCabinets } from './components/OtherCabinets'

const ProfileWorkspacesPage = () => (
  <div className="grid items-start gap-4 lg:grid-cols-[1fr_380px]">
    <div className="flex flex-col gap-4">
      <OrganizationList />
      <OtherCabinets />
    </div>

    <div className="flex flex-col gap-4 lg:sticky lg:top-24">
      <HelpCard />
    </div>
  </div>
)

export default ProfileWorkspacesPage
