import { useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Banknote,
  Headphones,
  LayoutGrid,
  Mail,
  PackageCheck,
  Phone,
  Sparkles,
  Tag,
  Truck,
} from 'lucide-react'
import { usePublicProducts } from '../../hooks/usePublicProducts'
import { usePublicCategories } from '../../hooks/usePublicCategories'
import { useScrollReveal } from '../../hooks/useScrollReveal'
import { ProductGrid } from '../../components/ProductGrid/ProductGrid'
import { AmbientParticles } from '../../components/AmbientParticles/AmbientParticles'
import { useStoreSettings } from '../../../hooks/useStoreSettings'
import { useLanguage } from '../../../i18n/LanguageContext'
import { formatPrice } from '../../../utils/format'
import './Home.css'

export function Home() {
  const { t } = useLanguage()
  const pageRef = useRef<HTMLDivElement>(null)
  const { data: products = [], isLoading: productsLoading } = usePublicProducts()
  const { data: categories = [], isLoading: categoriesLoading } =
    usePublicCategories()
  const { data: settings } = useStoreSettings()

  const categoryImages = useMemo(() => {
    const images = new Map<string, string>()

    for (const product of products) {
      if (
        product.category &&
        product.image_url &&
        !images.has(product.category.slug)
      ) {
        images.set(product.category.slug, product.image_url)
      }
    }

    return images
  }, [products])

  const newArrivals = useMemo(() => {
    const featureId = products.find(
      (product) => product.product_type === 'PACK'
    )?.id

    return products
      .filter((product) => product.id !== featureId)
      .slice(0, 8)
  }, [products])

  const deals = useMemo(
    () =>
      products
        .filter(
          (product) =>
            product.compare_price &&
            product.compare_price > product.min_price
        )
        .sort((a, b) => {
          const discountA = a.compare_price
            ? 1 - a.min_price / a.compare_price
            : 0
          const discountB = b.compare_price
            ? 1 - b.min_price / b.compare_price
            : 0
          return discountB - discountA
        })
        .slice(0, 4),
    [products]
  )

  const maxDiscount = useMemo(
    () =>
      deals.reduce((max, product) => {
        if (!product.compare_price) return max
        return Math.max(
          max,
          Math.round((1 - product.min_price / product.compare_price) * 100)
        )
      }, 0),
    [deals]
  )

  const featuredBundle = useMemo(
    () =>
      products.find(
        (product) =>
          product.product_type === 'PACK' &&
          product.compare_price &&
          product.compare_price > product.min_price
      ) ??
      products.find((product) => product.product_type === 'PACK') ??
      null,
    [products]
  )

  const featuredDiscount = featuredBundle?.compare_price
    ? Math.round(
        (1 - featuredBundle.min_price / featuredBundle.compare_price) * 100
      )
    : 0

  useScrollReveal(
    pageRef,
    `${products.length}-${categories.length}-${deals.length}`
  )

  const hasContact = !!settings?.store_phone || !!settings?.store_email

  return (
    <div className="c-home" ref={pageRef}>
      <div className="c-container">
        <section className="c-home__hero">
          <AmbientParticles className="c-home__hero-particles" count={32} />
          <div className="c-home__hero-glow" aria-hidden="true" />
          <div className="c-home__hero-grid" aria-hidden="true" />

          <div className="c-home__hero-content">
            <span className="c-home__hero-badge">
              {t('home.eyebrow')}
            </span>
            <h1 className="c-home__hero-title">
              {t('home.titlePrefix')}{' '}
              <span className="c-home__hero-title-accent">
                {t('home.titleAccent')}
              </span>
            </h1>
            <p className="c-home__hero-subtitle">{t('home.subtitle')}</p>
            <div className="c-home__hero-actions">
              <Link
                to="/products"
                className="c-btn c-btn--primary c-btn--lg c-home__hero-primary"
              >
                {t('home.shopNow')}
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <Link
                to="/categories"
                className="c-btn c-home__hero-secondary c-btn--lg"
              >
                {t('home.browseCategories')}
              </Link>
            </div>

            <div className="c-home__hero-trust">
              <div className="c-home__hero-trust-item">
                <Truck size={18} aria-hidden="true" />
                <div>
                  <div className="c-home__hero-trust-title">
                    {t('home.fastDelivery')}
                  </div>
                  <div className="c-home__hero-trust-desc">
                    {t('home.fastDeliveryDesc')}
                  </div>
                </div>
              </div>
              <div className="c-home__hero-trust-item">
                <Banknote size={18} aria-hidden="true" />
                <div>
                  <div className="c-home__hero-trust-title">
                    {t('home.securePayment')}
                  </div>
                  <div className="c-home__hero-trust-desc">
                    {t('home.securePaymentDesc')}
                  </div>
                </div>
              </div>
              <div className="c-home__hero-trust-item">
                <Headphones size={18} aria-hidden="true" />
                <div>
                  <div className="c-home__hero-trust-title">
                    {t('home.support')}
                  </div>
                  <div className="c-home__hero-trust-desc">
                    {t('home.supportDesc')}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="c-home__hero-visual">
            <span className="c-home__hero-orbit c-home__hero-orbit--outer" />
            <span className="c-home__hero-orbit c-home__hero-orbit--inner" />
            <img
              src="/hero-products.png"
              alt={t('home.heroAlt')}
              className="c-home__hero-visual-img"
            />
            <span className="c-home__hero-floating c-home__hero-floating--count">
              <PackageCheck size={15} aria-hidden="true" />
              {productsLoading
                ? '—'
                : `${products.length} ${t('home.proofProducts')}`}
            </span>
            {maxDiscount > 0 && (
              <span className="c-home__hero-floating c-home__hero-floating--deal">
                <Tag size={14} aria-hidden="true" />
                {t('home.dealTitle', { percent: maxDiscount })}
              </span>
            )}
            <span className="c-home__hero-visual-label">
              {t('home.heroVisualLabel')}
            </span>
          </div>
        </section>

        <section
          className="c-home__section"
          aria-labelledby="home-categories"
          data-reveal
        >
          <div className="c-section-heading">
            <div className="c-section-heading__copy">
              <span className="c-section-eyebrow">
                {t('home.shopByCategorySub')}
              </span>
              <h2 className="c-section-title" id="home-categories">
                {t('home.shopByCategory')}
              </h2>
            </div>
            <Link to="/categories" className="c-section-heading__link">
              {t('common.viewAll')}
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>

          {categoriesLoading ? (
            <div className="c-home__category-grid">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="c-home__category-skeleton c-skeleton"
                />
              ))}
            </div>
          ) : categories.length > 0 ? (
            <div className="c-home__category-grid">
              {categories.map((category, index) => {
                const image = categoryImages.get(category.slug)

                return (
                  <Link
                    key={category.id}
                    to={`/products?category=${category.slug}`}
                    className={`c-home__category-card ${
                      index === 0 ? 'c-home__category-card--featured' : ''
                    }`}
                  >
                    <div className="c-home__category-image">
                      {image ? (
                        <img
                          src={image}
                          alt=""
                          loading="lazy"
                          className="c-home__category-img"
                        />
                      ) : (
                        <LayoutGrid size={30} aria-hidden="true" />
                      )}
                      <span className="c-home__category-shade" />
                    </div>
                    <div className="c-home__category-copy">
                      <span className="c-home__category-name">
                        {category.name}
                      </span>
                      <span className="c-home__category-count">
                        {category.product_count}{' '}
                        {t('products.countUnit', {
                          count: category.product_count,
                        })}
                      </span>
                    </div>
                    <span className="c-home__category-arrow">
                      <ArrowRight size={15} aria-hidden="true" />
                    </span>
                  </Link>
                )
              })}
            </div>
          ) : null}
        </section>

        {featuredBundle && (
          <section
            className="c-home__feature"
            aria-labelledby="home-feature"
            data-reveal
          >
            <div className="c-home__feature-media">
              {featuredBundle.image_url ? (
                <img
                  src={featuredBundle.image_url}
                  alt={featuredBundle.name}
                  loading="lazy"
                />
              ) : (
                <div className="c-home__feature-media-placeholder">
                  <PackageCheck size={48} aria-hidden="true" />
                </div>
              )}
              <span className="c-home__feature-media-badge">
                <Sparkles size={13} aria-hidden="true" />
                {t('home.featureBadge')}
              </span>
              {featuredDiscount > 0 && (
                <span className="c-home__feature-discount">
                  -{featuredDiscount}%
                </span>
              )}
            </div>
            <div className="c-home__feature-copy">
              <span className="c-section-eyebrow">
                {t('home.featureEyebrow')}
              </span>
              <h2 className="c-home__feature-title" id="home-feature">
                {t('home.featureTitle')}
              </h2>
              <p className="c-home__feature-product">{featuredBundle.name}</p>
              <p className="c-home__feature-desc">
                {featuredBundle.description || t('home.featureDesc')}
              </p>
              <div className="c-home__feature-footer">
                <div className="c-home__feature-price">
                  <span>{formatPrice(featuredBundle.min_price)}</span>
                  {featuredBundle.compare_price &&
                    featuredBundle.compare_price > featuredBundle.min_price && (
                      <s>{formatPrice(featuredBundle.compare_price)}</s>
                    )}
                </div>
                <Link
                  to={`/products/${featuredBundle.slug}`}
                  className="c-home__feature-link"
                >
                  {t('home.featureCta')}
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </div>
            </div>
          </section>
        )}

        {deals.length > 0 && (
          <section
            className="c-home__section"
            aria-labelledby="home-deals"
            data-reveal
          >
            <div className="c-home__deal-banner">
              <AmbientParticles
                className="c-home__deal-particles"
                count={22}
              />
              <div className="c-home__deal-copy">
                <span className="c-home__deal-badge">
                  <Tag size={12} aria-hidden="true" />
                  {t('home.specialOffer')}
                </span>
                <h2 className="c-home__deal-title" id="home-deals">
                  {t('home.dealTitle', { percent: maxDiscount })}
                </h2>
                <p className="c-home__deal-desc">{t('home.dealDesc')}</p>
              </div>
              <span className="c-home__deal-watermark" aria-hidden="true">
                {maxDiscount}%
              </span>
              <Link
                to="/products?deals=1"
                className="c-btn c-btn--primary c-btn--lg c-home__deal-action"
              >
                {t('home.shopNow')}
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
            </div>

            {deals.length >= 3 && (
              <ProductGrid products={deals} skeletonCount={4} />
            )}
          </section>
        )}

        <section
          className="c-home__section"
          aria-labelledby="home-arrivals"
          id="new-arrivals"
          data-reveal
        >
          <div className="c-section-heading">
            <div className="c-section-heading__copy">
              <span className="c-section-eyebrow">
                {t('home.newArrivalsSub')}
              </span>
              <h2 className="c-section-title" id="home-arrivals">
                {t('home.newArrivals')}
              </h2>
            </div>
            <Link to="/products" className="c-section-heading__link">
              {t('common.viewAll')}
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>

          <ProductGrid products={newArrivals} isLoading={productsLoading} />
        </section>

        <section className="c-home__service-grid" data-reveal>
          <div className="c-home__standard">
            <span className="c-section-eyebrow">
              {t('home.standardEyebrow')}
            </span>
            <h2 className="c-home__standard-title">
              {t('home.standardTitle')}
            </h2>
            <p className="c-home__standard-desc">
              {t('home.standardDesc')}
            </p>
            <ol className="c-home__standard-list">
              <li>
                <span className="c-home__standard-number">01</span>
                <div>
                  <h3>{t('home.quality')}</h3>
                  <p>{t('home.qualityDesc')}</p>
                </div>
              </li>
              <li>
                <span className="c-home__standard-number">02</span>
                <div>
                  <h3>{t('home.delivery')}</h3>
                  <p>{t('home.deliveryDesc')}</p>
                </div>
              </li>
              <li>
                <span className="c-home__standard-number">03</span>
                <div>
                  <h3>{t('home.cashOnDelivery')}</h3>
                  <p>{t('home.cashOnDeliveryDesc')}</p>
                </div>
              </li>
            </ol>
          </div>

          <div className="c-home__help" id="store-help">
            <div className="c-home__help-icon">
              <Headphones size={24} aria-hidden="true" />
            </div>
            <h2 className="c-home__help-title">{t('home.helpTitle')}</h2>
            <p className="c-home__help-desc">{t('home.helpDesc')}</p>

            {hasContact ? (
              <div className="c-home__help-actions">
                {settings?.store_phone && (
                  <a
                    href={`tel:${settings.store_phone}`}
                    className="c-btn c-btn--primary"
                  >
                    <Phone size={16} aria-hidden="true" />
                    {settings.store_phone}
                  </a>
                )}
                {settings?.store_email && (
                  <a
                    href={`mailto:${settings.store_email}`}
                    className="c-btn c-btn--secondary"
                  >
                    <Mail size={16} aria-hidden="true" />
                    {t('common.email')}
                  </a>
                )}
              </div>
            ) : (
              <Link to="/products" className="c-btn c-btn--primary">
                {t('common.browseProducts')}
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            )}

            <Link to="/help" className="c-home__help-link">
              {t('footer.helpCenter')}
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
