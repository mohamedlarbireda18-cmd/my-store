import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, Search, ShoppingBag, X } from 'lucide-react'
import { useCart } from '../../context/CartContext'
import './Topbar.css'

interface TopbarProps {
  onMenuClick: () => void
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const navigate = useNavigate()
  const { itemCount, openDrawer } = useCart()
  const [search, setSearch] = useState('')
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false)

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (search.trim()) {
      navigate(`/products?q=${encodeURIComponent(search.trim())}`)
      setSearch('')
      setIsMobileSearchOpen(false)
    }
  }

  return (
    <header className="c-topbar">
      <button
        className="c-topbar__menu-btn"
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        <Menu size={22} />
      </button>

      {/* Desktop search */}
      <form className="c-topbar__search" onSubmit={handleSearchSubmit}>
        <Search size={16} className="c-topbar__search-icon" />
        <input
          type="text"
          placeholder="Search for products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="c-topbar__search-input"
        />
      </form>

      {/* Actions */}
      <div className="c-topbar__actions">
        {/* Mobile search toggle */}
        <button
          className="c-topbar__icon-btn c-topbar__icon-btn--search"
          onClick={() => setIsMobileSearchOpen(true)}
          aria-label="Search"
        >
          <Search size={20} />
        </button>

        {/* Cart */}
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

      {/* Mobile search overlay */}
      {isMobileSearchOpen && (
        <form className="c-topbar__mobile-search" onSubmit={handleSearchSubmit}>
          <Search size={18} className="c-topbar__mobile-search-icon" />
          <input
            type="text"
            placeholder="Search for products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
            className="c-topbar__mobile-search-input"
          />
          <button
            type="button"
            className="c-topbar__mobile-search-close"
            onClick={() => {
              setIsMobileSearchOpen(false)
              setSearch('')
            }}
            aria-label="Close search"
          >
            <X size={20} />
          </button>
        </form>
      )}
    </header>
  )
}