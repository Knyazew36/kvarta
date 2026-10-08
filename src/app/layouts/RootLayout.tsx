import { Outlet } from 'react-router'

const RootLayout = () => {
  return (
    <div className="min-h-screen">
      <main>
        <Outlet />
      </main>
    </div>
  )
}

export default RootLayout
