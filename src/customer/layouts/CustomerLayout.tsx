import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from '../components/Sidebar/Sidebar'
import { Topbar } from '../components/Topbar/Topbar'
import { CartDrawer } from '../components/CartDrawer/CartDrawer'
import '../styles/customer.css'
import './CustomerLayout.css'

export function CustomerLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="customer-app">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="c-layout__main">
        <Topbar onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="c-layout__content">
          <Outlet />
        </main>
      </div>

      <CartDrawer />
    </div>
  )
}