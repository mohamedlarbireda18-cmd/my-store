import { useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  ArrowUp,
  Banknote,
  Headphones,
  Mail,
  MapPin,
  Phone,
  Truck,
} from 'lucide-react'
import { useStoreSettings } from '../../../hooks/useStoreSettings'
import { useLanguage } from '../../../i18n/LanguageContext'
import { useScrollReveal } from '../../hooks/useScrollReveal'
import './Footer.css'

export function Footer() {
  const { t } = useLanguage()
  const { data: settings } = useStoreSettings()
  const footerRef = useRef<HTMLElement>(null)
  const year = new Date().getFullYear()

  useScrollReveal(footerRef)

  const hasContact =
    !!settings?.store_phone ||
    !!settings?.store_email ||
    !!settings?.store_address

  return (
    <footer className="c-footer" ref={footerRef}>
      <div className="c-footer__cta-outer">
        <div className="c-container">
          <div className="c-footer__cta" data-reveal>
            <span className="c-footer__cta-grid" aria-hidden="true" />
            <div className="c-footer__cta-copy">
              <span className="c-footer__eyebrow">
                {t('footer.ctaEyebrow')}
              </span>
              <h2 className="c-footer__cta-title">
                {t('footer.ctaTitle')}
              </h2>
              <p className="c-footer__cta-desc">{t('footer.ctaDesc')}</p>
            </div>
            <div className="c-footer__cta-actions">
              <Link to="/products" className="c-btn c-btn--primary">
                {t('footer.ctaPrimary')}
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <Link
                to="/categories"
                className="c-btn c-footer__cta-secondary"
              >
                {t('footer.ctaSecondary')}
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="c-footer__main">
        <div className="c-container">
          <div
            className={`c-footer__top ${
              hasContact ? 'c-footer__top--with-contact' : ''
            }`}
          >
            <div className="c-footer__brand">
              <Link to="/" className="c-footer__logo" aria-label="DzairTech">
                <img src="/logo.png" alt="" />
              </Link>
              <p className="c-footer__tagline">{t('footer.tagline')}</p>
              <span className="c-footer__delivery-note">
                <Banknote size={15} aria-hidden="true" />
                {t('footer.deliveryNote')}
              </span>
            </div>

            <nav className="c-footer__nav" aria-label={t('footer.navigation')}>
              <h2>{t('footer.shopTitle')}</h2>
              <ul>
                <li>
                  <Link to="/products">{t('nav.products')}</Link>
                </li>
                <li>
                  <Link to="/categories">{t('nav.categories')}</Link>
                </li>
                <li>
                  <Link to="/#new-arrivals">
                    {t('footer.newArrivals')}
                  </Link>
                </li>
                <li>
                  <Link to="/products?deals=1">{t('footer.deals')}</Link>
                </li>
              </ul>
            </nav>

            <nav
              className="c-footer__nav"
              aria-label={t('footer.supportTitle')}
            >
              <h2>{t('footer.supportTitle')}</h2>
              <ul>
                <li>
                  <Link to="/help">{t('footer.helpCenter')}</Link>
                </li>
                <li>
                  <Link to="/help#delivery">
                    {t('footer.deliveryPayment')}
                  </Link>
                </li>
                <li>
                  <Link to="/help#contact">
                    {t('footer.contactSupport')}
                  </Link>
                </li>
                <li>
                  <Link to="/cart">{t('nav.cart')}</Link>
                </li>
              </ul>
            </nav>

            {hasContact && (
              <div className="c-footer__contact">
                <h2>{t('footer.contactTitle')}</h2>
                <ul>
                  {settings?.store_phone && (
                    <li>
                      <Phone size={15} aria-hidden="true" />
                      <a href={`tel:${settings.store_phone}`}>
                        {settings.store_phone}
                      </a>
                    </li>
                  )}
                  {settings?.store_email && (
                    <li>
                      <Mail size={15} aria-hidden="true" />
                      <a href={`mailto:${settings.store_email}`}>
                        {settings.store_email}
                      </a>
                    </li>
                  )}
                  {settings?.store_address && (
                    <li>
                      <MapPin size={15} aria-hidden="true" />
                      <span>{settings.store_address}</span>
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>

          <div className="c-footer__services">
            <div className="c-footer__service">
              <span className="c-footer__service-icon">
                <Truck size={18} aria-hidden="true" />
              </span>
              <div>
                <h3>{t('footer.deliveryFeatureTitle')}</h3>
                <p>{t('footer.deliveryFeatureDesc')}</p>
              </div>
            </div>
            <div className="c-footer__service">
              <span className="c-footer__service-icon">
                <Banknote size={18} aria-hidden="true" />
              </span>
              <div>
                <h3>{t('footer.paymentFeatureTitle')}</h3>
                <p>{t('footer.paymentFeatureDesc')}</p>
              </div>
            </div>
            <div className="c-footer__service">
              <span className="c-footer__service-icon">
                <Headphones size={18} aria-hidden="true" />
              </span>
              <div>
                <h3>{t('footer.supportFeatureTitle')}</h3>
                <p>{t('footer.supportFeatureDesc')}</p>
              </div>
            </div>
          </div>

          <div className="c-footer__bottom">
            <p>{t('footer.rights', { year })}</p>
            <div className="c-footer__bottom-meta">
              <span>
                <Banknote size={13} aria-hidden="true" />
                {t('footer.paymentNote')}
              </span>
              <button
                type="button"
                className="c-footer__top-link"
                onClick={() =>
                  window.scrollTo({
                    top: 0,
                    behavior: window.matchMedia(
                      '(prefers-reduced-motion: reduce)'
                    ).matches
                      ? 'auto'
                      : 'smooth',
                  })
                }
              >
                {t('footer.backToTop')}
                <ArrowUp size={14} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
