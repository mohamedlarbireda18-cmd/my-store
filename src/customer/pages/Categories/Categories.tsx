import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, LayoutGrid } from 'lucide-react'
import { usePublicCategories } from '../../hooks/usePublicCategories'
import { usePublicProducts } from '../../hooks/usePublicProducts'
import { useLanguage } from '../../../i18n/LanguageContext'
import './Categories.css'

export function Categories() {
  const { t } = useLanguage()
  const { data: categories = [], isLoading } = usePublicCategories()
  const { data: products = [] } = usePublicProducts()

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

  return (
    <div className="c-categories">
      <div className="c-container">
        <div className="c-categories__header">
          <span className="c-section-eyebrow">
            {t('categories.eyebrow')}
          </span>
          <h1 className="c-page-title">{t('categories.title')}</h1>
          <p className="c-page-subtitle">{t('categories.subtitle')}</p>
        </div>

        {isLoading ? (
          <div className="c-categories__grid">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="c-categories__skeleton c-skeleton"
              />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="c-categories__empty">
            <div className="c-categories__empty-icon">
              <LayoutGrid size={28} aria-hidden="true" />
            </div>
            <h2 className="c-categories__empty-title">
              {t('categories.emptyTitle')}
            </h2>
            <p className="c-categories__empty-desc">
              {t('categories.emptyDesc')}
            </p>
          </div>
        ) : (
          <div className="c-categories__grid">
            {categories.map((category) => {
              const image = categoryImages.get(category.slug)

              return (
                <Link
                  key={category.id}
                  to={`/products?category=${category.slug}`}
                  className="c-categories__card"
                >
                  <div className="c-categories__card-image">
                    {image ? (
                      <img
                        src={image}
                        alt=""
                        loading="lazy"
                        className="c-categories__card-img"
                      />
                    ) : (
                      <LayoutGrid size={36} aria-hidden="true" />
                    )}
                  </div>
                  <div className="c-categories__card-body">
                    <div>
                      <h2 className="c-categories__card-name">
                        {category.name}
                      </h2>
                      <p className="c-categories__card-count">
                        {category.product_count}{' '}
                        {t('products.countUnit', {
                          count: category.product_count,
                        })}
                      </p>
                    </div>
                    <span className="c-categories__card-arrow">
                      <ArrowRight size={17} aria-hidden="true" />
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
