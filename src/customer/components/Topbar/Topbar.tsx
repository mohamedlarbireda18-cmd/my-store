import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, Search, ShoppingBag, X } from 'lucide-react'
import { useCart } from '../../context/CartContext'
import { useLanguage } from '../../../i18n/LanguageContext'
import { LanguageSwitcher } from '../LanguageSwitcher/LanguageSwitcher'
import './Topbar.css'

interface TopbarProps {
  onMenuClick: () => void
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { itemCount, openDrawer } = useCart()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const location = useLocation()
  const [query, setQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10)
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (!isSearchOpen) return
    const timer = window.setTimeout(() => searchInputRef.current?.focus(), 0)
    return () => window.clearTimeout(timer)
  }, [isSearchOpen])

  useEffect(() => {
    if (location.pathname !== '/products') {
      setQuery('')
      setIsSearchOpen(false)
    }
  }, [location.pathname])

  const handleSearch = (event: FormEvent) => {
    event.preventDefault()
    const trimmed = query.trim()
    navigate(trimmed ? `/products?q=${encodeURIComponent(trimmed)}` : '/products')
    setIsSearchOpen(false)
  }

  const handleClear = () => {
    setQuery('')
    searchInputRef.current?.focus()
  }

  return (
    <header
      className={`c-topbar ${isSearchOpen ? 'c-topbar--searching' : ''} ${
        isScrolled ? 'c-topbar--scrolled' : ''
      }`}
    >
      <button
        type="button"
        className="c-topbar__menu-btn"
        onClick={onMenuClick}
        aria-label={t('nav.openMenu')}
        aria-controls="site-sidebar"
      >
        <Menu size={22} aria-hidden="true" />
      </button>

      <Link to="/" className="c-topbar__mobile-brand" aria-label="DzairTech">
        <img src="/logo.png" alt="" />
      </Link>

      <form
        id="site-search"
        className="c-topbar__search"
        role="search"
        aria-label={t('a11y.searchForm')}
        onSubmit={handleSearch}
      >
        <Search
          size={17}
          className="c-topbar__search-icon"
          aria-hidden="true"
        />
        <input
          ref={searchInputRef}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('nav.searchPlaceholder')}
          aria-label={t('products.searchLabel')}
          autoComplete="off"
        />
        {query && (
          <button
            type="button"
            className="c-topbar__search-clear"
            onClick={handleClear}
            aria-label={t('nav.clearSearch')}
          >
            <X size={15} aria-hidden="true" />
          </button>
        )}
        <button type="submit" className="c-topbar__search-submit">
          {t('nav.searchSubmit')}
        </button>
      </form>

      <div className="c-topbar__actions">
        <button
          type="button"
          className="c-topbar__icon-btn c-topbar__search-toggle"
          onClick={() => setIsSearchOpen((open) => !open)}
          aria-label={isSearchOpen ? t('nav.closeSearch') : t('nav.search')}
          aria-expanded={isSearchOpen}
          aria-controls="site-search"
        >
          {isSearchOpen ? (
            <X size={20} aria-hidden="true" />
          ) : (
            <Search size={20} aria-hidden="true" />
          )}
        </button>

        <LanguageSwitcher />

        <button
          type="button"
          className="c-topbar__icon-btn c-topbar__icon-btn--cart"
          onClick={openDrawer}
          aria-label={
            itemCount > 0
              ? t('nav.openCartWithCount', { count: itemCount })
              : t('nav.openCart')
          }
        >
          <ShoppingBag size={20} aria-hidden="true" />
          {itemCount > 0 && (
            <span className="c-topbar__cart-badge" aria-hidden="true">
              {itemCount > 99 ? '99+' : itemCount}
            </span>
          )}
        </button>
      </div>
    </header>
  )
}
