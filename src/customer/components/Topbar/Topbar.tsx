import { Menu, ShoppingBag } from 'lucide-react'
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

  return (
    <header className="c-topbar">
      <button
        type="button"
        className="c-topbar__menu-btn"
        onClick={onMenuClick}
        aria-label={t('nav.openMenu')}
        aria-controls="site-sidebar"
      >
        <Menu size={22} aria-hidden="true" />
      </button>

      {/* Mobile brand logo */}
      <a href="/" className="c-topbar__mobile-brand" aria-label="DzairTech">
        <img src="/logo.png" alt="" />
      </a>

      <div className="c-topbar__actions">
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