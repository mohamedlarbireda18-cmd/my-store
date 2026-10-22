import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Banknote,
  ClipboardList,
  Headphones,
  Mail,
  MapPin,
  PackageCheck,
  Phone,
  Truck,
} from 'lucide-react'
import { Breadcrumbs } from '../../components/Breadcrumbs/Breadcrumbs'
import { useStoreSettings } from '../../../hooks/useStoreSettings'
import { useLanguage } from '../../../i18n/LanguageContext'
import './Help.css'

export function Help() {
  const { t } = useLanguage()
  const { data: settings } = useStoreSettings()

  const hasContact =
    !!settings?.store_phone ||
    !!settings?.store_email ||
    !!settings?.store_address

  const breadcrumbItems = [
    { label: t('breadcrumb.home'), to: '/' },
    { label: t('breadcrumb.help') },
  ]

  return (
    <div className="c-help">
      <div className="c-container">
        <Breadcrumbs items={breadcrumbItems} />

        <header className="c-help__header">
          <span className="c-section-eyebrow">{t('help.eyebrow')}</span>
          <h1 className="c-help__title">{t('help.title')}</h1>
          <p className="c-help__subtitle">{t('help.subtitle')}</p>
        </header>

        <div className="c-help__layout">
          <div className="c-help__main">
            <section
              className="c-help__section"
              id="order"
              aria-labelledby="help-order"
            >
              <div className="c-help__section-icon">
                <ClipboardList size={20} aria-hidden="true" />
              </div>
              <div className="c-help__section-copy">
                <h2 id="help-order">{t('help.orderTitle')}</h2>
                <p>{t('help.orderDesc')}</p>
                <ol className="c-help__steps">
                  <li>
                    <span>01</span>
                    {t('help.orderStep1')}
                  </li>
                  <li>
                    <span>02</span>
                    {t('help.orderStep2')}
                  </li>
                  <li>
                    <span>03</span>
                    {t('help.orderStep3')}
                  </li>
                </ol>
              </div>
            </section>

            <section
              className="c-help__section"
              id="delivery"
              aria-labelledby="help-delivery"
            >
              <div className="c-help__section-icon">
                <Truck size={20} aria-hidden="true" />
              </div>
              <div className="c-help__section-copy">
                <h2 id="help-delivery">{t('help.deliveryTitle')}</h2>
                <p>{t('help.deliveryDesc')}</p>
                <p className="c-help__callout">{t('help.deliveryNote')}</p>
              </div>
            </section>

            <section
              className="c-help__section"
              id="payment"
              aria-labelledby="help-payment"
            >
              <div className="c-help__section-icon">
                <Banknote size={20} aria-hidden="true" />
              </div>
              <div className="c-help__section-copy">
                <h2 id="help-payment">{t('help.paymentTitle')}</h2>
                <p>{t('help.paymentDesc')}</p>
              </div>
            </section>

            <section
              className="c-help__section"
              id="after"
              aria-labelledby="help-after"
            >
              <div className="c-help__section-icon">
                <PackageCheck size={20} aria-hidden="true" />
              </div>
              <div className="c-help__section-copy">
                <h2 id="help-after">{t('help.afterTitle')}</h2>
                <p>{t('help.afterDesc')}</p>
              </div>
            </section>

            <div className="c-help__note">
              <strong>{t('help.noteTitle')}</strong>
              <p>{t('help.noteDesc')}</p>
            </div>
          </div>

          <aside className="c-help__contact" id="contact">
            <div className="c-help__contact-icon">
              <Headphones size={24} aria-hidden="true" />
            </div>
            <h2>{t('help.contactTitle')}</h2>
            <p>{hasContact ? t('help.contactDesc') : t('help.contactEmpty')}</p>

            {hasContact && (
              <ul className="c-help__contact-list">
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
            )}

            <Link
              to="/products"
              className="c-btn c-btn--primary c-help__contact-action"
            >
              {t('help.startShopping')}
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </aside>
        </div>
      </div>
    </div>
  )
}
