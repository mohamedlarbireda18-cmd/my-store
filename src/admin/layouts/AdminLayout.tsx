import { useState } from 'react'
import { Sidebar } from '../components/Sidebar/Sidebar'
import { Header } from '../components/Header/Header'
import './AdminLayout.css'

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="admin-app">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="admin-main">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="admin-content">{children}</main>
      </div>
    </div>
  )
}