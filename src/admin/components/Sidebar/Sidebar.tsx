import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Tags,
  Truck,
  Settings,
  LogOut,
  X,
} from 'lucide-react'
import { useAdminAuth } from '../../auth/AdminAuthContext'
import './Sidebar.css'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/admin/categories', label: 'Categories', icon: Tags },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/delivery', label: 'Delivery', icon: Truck },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
]

// Helper: get initials from email (e.g. "admin@mystore.com" → "AD")
function getInitials(email: string | null): string {
  if (!email) return 'AD'
  const name = email.split('@')[0]
  const parts = name.split(/[._-]/).filter(Boolean)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {

  const { logout, adminEmail } = useAdminAuth()

  const handleLinkClick = () => {
    if (window.innerWidth < 1024) onClose()
  }

  const handleLogout = async () => {
    await logout()
  }

  return (
    <>
      {isOpen && <div className="sidebar__backdrop" onClick={onClose} />}

      <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}>
        {/* Brand */}
       <div className="sidebar__brand">
  <img
    src="/logo.png"
    alt="DzairTech"
    className="sidebar__logo-img"
  />
  <button className="sidebar__close" onClick={onClose} aria-label="Close menu">
    <X size={18} />
  </button>
</div>

        {/* Nav */}
        <nav className="sidebar__nav">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={handleLinkClick}
              className={({ isActive }) =>
                `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
              }
            >
              <Icon className="sidebar__link-icon" size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Admin profile */}
        <div className="sidebar__footer">
          <div className="sidebar__profile">
            <div className="sidebar__avatar">{getInitials(adminEmail)}</div>
            <div className="sidebar__profile-info">
              <span className="sidebar__profile-name">Admin</span>
              <span className="sidebar__profile-email" title={adminEmail || ''}>
                {adminEmail || '—'}
              </span>
            </div>
          </div>
          <button className="sidebar__logout" onClick={handleLogout}>
            <LogOut size={16} />
            <span>Log out</span>
          </button>
        </div>
      </aside>
    </>
  )
}