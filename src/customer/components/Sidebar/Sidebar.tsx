import { useRef } from 'react'
import { NavLink, Link } from 'react-router-dom'
import {
  Home,
  Package,
  LayoutGrid,
  X,
  ShoppingBag,
  Phone,
  Mail,
  Headphones,
  HelpCircle,
} from 'lucide-react'
import { usePublicCategories } from '../../hooks/usePublicCategories'
import { useCart } from '../../context/CartContext'
import { useAccessibleDialog } from '../../hooks/useAccessibleDialog'
import { useStoreSettings } from '../../../hooks/useStoreSettings'
import { useLanguage } from '../../../i18n/LanguageContext'
import { LanguageSwitcher } from '../LanguageSwitcher/LanguageSwitcher'
import './Sidebar.css'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { t } = useLanguage()
  const { itemCount } = useCart()
  const { data: categories = [] } = usePublicCategories()
  const { data: settings } = useStoreSettings()
  const sidebarRef = useRef<HTMLElement>(null)

  useAccessibleDialog(isOpen, onClose, sidebarRef)

  const navItems = [
    { to: '/', label: t('nav.home'), icon: Home, end: true },
    { to: '/products', label: t('nav.products'), icon: Package },
    { to: '/categories', label: t('nav.categories'), icon: LayoutGrid },
    { to: '/help', label: t('nav.help'), icon: HelpCircle },
  ]

  const handleLinkClick = () => {
    if (window.innerWidth < 1024) onClose()
  }

  return (
    <>
      {isOpen && (
        <div
          className="c-sidebar__backdrop"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        id="site-sidebar"
        ref={sidebarRef}
        className={`c-sidebar ${isOpen ? 'c-sidebar--open' : ''}`}
        role={isOpen ? 'dialog' : undefined}
        aria-modal={isOpen ? true : undefined}
        aria-label="DzairTech"
        tabIndex={-1}
      >
        <div className="c-sidebar__brand">
          <Link
            to="/"
            className="c-sidebar__brand-link"
            onClick={handleLinkClick}
            aria-label="DzairTech"
          >
            <img src="/logo.png" alt="DzairTech" />
          </Link>
          <button
            type="button"
            className="c-sidebar__close"
            onClick={onClose}
            aria-label={t('nav.closeMenu')}
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <div className="c-sidebar__scroll">
          <nav
            className="c-sidebar__nav"
            aria-label={t('a11y.mainNavigation')}
          >
            {navItems.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={handleLinkClick}
                className={({ isActive }) =>
                  `c-sidebar__link ${isActive ? 'c-sidebar__link--active' : ''}`
                }
              >
                <Icon size={18} className="c-sidebar__link-icon" aria-hidden="true" />
                <span className="c-sidebar__link-label">{label}</span>
              </NavLink>
            ))}

            <NavLink
              to="/cart"
              onClick={handleLinkClick}
              className={({ isActive }) =>
                `c-sidebar__link ${isActive ? 'c-sidebar__link--active' : ''}`
              }
            >
              <ShoppingBag
                size={18}
                className="c-sidebar__link-icon"
                aria-hidden="true"
              />
              <span className="c-sidebar__link-label">{t('nav.cart')}</span>
              {itemCount > 0 && (
                <span className="c-sidebar__link-badge" aria-hidden="true">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </NavLink>
          </nav>

          {categories.length > 0 && (
            <nav
              className="c-sidebar__categories"
              aria-label={t('a11y.categoryNavigation')}
            >
              <h2 className="c-sidebar__section-title">
                {t('home.shopByCategory')}
              </h2>
              <ul>
                {categories.map((category) => (
                  <li key={category.id}>
                    <Link
                      to={`/products?category=${category.slug}`}
                      onClick={handleLinkClick}
                    >
                      <span>{category.name}</span>
                      <span className="c-sidebar__category-count">
                        {category.product_count}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          {(settings?.store_phone || settings?.store_email) && (
            <div className="c-sidebar__support">
              <Headphones size={18} aria-hidden="true" />
              <div>
                <h2>{t('home.support')}</h2>
                <p>{t('home.supportDesc')}</p>
                {settings.store_phone && (
                  <a href={`tel:${settings.store_phone}`}>
                    <Phone size={13} aria-hidden="true" />
                    {settings.store_phone}
                  </a>
                )}
                {settings.store_email && (
                  <a href={`mailto:${settings.store_email}`}>
                    <Mail size={13} aria-hidden="true" />
                    {settings.store_email}
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="c-sidebar__footer">
          <LanguageSwitcher variant="menu" />
        </div>
      </aside>
    </>
  )
}
