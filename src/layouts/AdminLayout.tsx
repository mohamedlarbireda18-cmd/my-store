import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../features/auth/AdminAuthContext'

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { logout } = useAdminAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/admin/login')
  }

  const navItems = [
    { to: '/admin', label: 'Dashboard', icon: '📊' },
    { to: '/admin/products', label: 'Products', icon: '📦' },
    { to: '/admin/orders', label: 'Orders', icon: '📋' },
    { to: '/admin/categories', label: 'Categories', icon: '🏷️' },
    { to: '/admin/delivery', label: 'Delivery', icon: '🚚' },
    { to: '/admin/settings', label: 'Settings', icon: '⚙️' },
  ]

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Admin Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex space-x-4 overflow-x-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/admin'}
                className={({ isActive }) =>
                  `px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap ${
                    isActive
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`
                }
              >
                <span className="mr-2">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}