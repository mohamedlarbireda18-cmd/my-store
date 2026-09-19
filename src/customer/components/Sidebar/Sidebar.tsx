import { NavLink } from 'react-router-dom'
import {
  Home,
  Package,
  LayoutGrid,
  ShoppingBag,
  X,
} from 'lucide-react'
import { useCart } from '../../context/CartContext'
import './Sidebar.css'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/categories', label: 'Categories', icon: LayoutGrid },
  { to: '/cart', label: 'Cart', icon: ShoppingBag, showBadge: true },
]

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { itemCount } = useCart()

  const handleLinkClick = () => {
    if (window.innerWidth < 1024) onClose()
  }

  return (
    <>
      {isOpen && (
        <div className="c-sidebar__backdrop" onClick={onClose} />
      )}

      <aside
        className={`c-sidebar ${isOpen ? 'c-sidebar--open' : ''}`}
      >
        {/* Brand */}
        <div className="c-sidebar__brand">
          <img src="/logo.png" alt="DzairTech" />
          <button
            className="c-sidebar__close"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav className="c-sidebar__nav">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end, showBadge }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={handleLinkClick}
              className={({ isActive }) =>
                `c-sidebar__link ${
                  isActive ? 'c-sidebar__link--active' : ''
                }`
              }
            >
              <Icon size={18} className="c-sidebar__link-icon" />
              <span className="c-sidebar__link-label">{label}</span>
              {showBadge && itemCount > 0 && (
                <span className="c-sidebar__link-badge">{itemCount}</span>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  )
}