import { Menu, ShoppingBag } from 'lucide-react'
import { useCart } from '../../context/CartContext'
import './Topbar.css'

interface TopbarProps {
  onMenuClick: () => void
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { itemCount, openDrawer } = useCart()

  return (
    <header className="c-topbar">
      <button
        className="c-topbar__menu-btn"
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        <Menu size={22} />
      </button>

      <div className="c-topbar__spacer" />

      <div className="c-topbar__actions">
        <button
          className="c-topbar__icon-btn c-topbar__icon-btn--cart"
          onClick={openDrawer}
          aria-label="Open cart"
        >
          <ShoppingBag size={20} />
          {itemCount > 0 && (
            <span className="c-topbar__cart-badge">{itemCount}</span>
          )}
        </button>
      </div>
    </header>
  )
}