import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  Package,
  Check,
  AlertCircle,
  Image as ImageIcon,
  Heart,
  ShoppingBag,
  Truck,
  ShieldCheck,
  ArrowDown,
} from 'lucide-react'
import { usePublicProduct, usePublicProducts } from '../../hooks/usePublicProducts'
import { OrderForm } from '../../components/OrderForm/OrderForm'
import { ThankYouModal } from '../../components/ThankYouModal/ThankYouModal'
import { Breadcrumbs } from '../../components/Breadcrumbs/Breadcrumbs'
import { ProductGrid } from '../../components/ProductGrid/ProductGrid'
import { QuantityControl } from '../../components/QuantityControl/QuantityControl'
import { useCart } from '../../context/CartContext'
import { useFavorites } from '../../context/FavoritesContext'
import { useLanguage } from '../../../i18n/LanguageContext'
import { formatPrice } from '../../../utils/format'
import './ProductDetail.css'

export function ProductDetail() {
  const { slug } = useParams<{ slug: string }>()
  const { t } = useLanguage()
  const { data: product, isLoading } = usePublicProduct(slug)
  const { data: products = [] } = usePublicProducts()
  const { addItem } = useCart()
  const { isFavorite, toggleFavorite } = useFavorites()

  const [selectedVariantId, setSelectedVariantId] = useState('')
  const [selectedImage, setSelectedImage] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [orderNumber, setOrderNumber] = useState<string | null>(null)

  useEffect(() => {
    if (product && product.variants.length > 0 && !selectedVariantId) {
      const firstInStock = product.variants.find((variant) => variant.stock > 0)
      setSelectedVariantId((firstInStock ?? product.variants[0]).id)
    }
  }, [product, selectedVariantId])

  useEffect(() => {
    if (product) {
      setSelectedImage(product.image_url ?? '')
    }
  }, [product])

  useEffect(() => {
    setQuantity(1)
  }, [selectedVariantId])

  const selectedVariant = useMemo(() => {
    if (!product) return null
    return (
      product.variants.find((variant) => variant.id === selectedVariantId) ??
      null
    )
  }, [product, selectedVariantId])

  const relatedProducts = useMemo(() => {
    if (!product) return []

    const sameCategory = products.filter(
      (item) =>
        item.id !== product.id &&
        item.category?.slug === product.category?.slug
    )
    const others = products.filter(
      (item) =>
        item.id !== product.id &&
        item.category?.slug !== product.category?.slug
    )

    return [...sameCategory, ...others].slice(0, 4)
  }, [products, product])

  if (isLoading) {
    return (
      <div className="c-product-detail">
        <div className="c-container">
          <div className="c-product-detail__skeleton">
            <div className="c-product-detail__skeleton-img c-skeleton" />
            <div className="c-product-detail__skeleton-info">
              <div className="c-product-detail__skeleton-line c-skeleton" />
              <div className="c-product-detail__skeleton-line c-skeleton" />
              <div className="c-product-detail__skeleton-line c-skeleton" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="c-product-detail">
        <div className="c-container">
          <div className="c-product-detail__not-found">
            <Package size={48} aria-hidden="true" />
            <h1>{t('product.notFoundTitle')}</h1>
            <p>{t('product.notFoundDesc')}</p>
            <Link to="/products" className="c-btn c-btn--primary">
              {t('product.browseProducts')}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const variantPrice = selectedVariant?.price ?? product.min_price
  const variantStock = selectedVariant?.stock ?? 0
  const discountPercent =
    product.compare_price && product.compare_price > variantPrice
      ? Math.round((1 - variantPrice / product.compare_price) * 100)
      : 0

  const allImages = [
    product.image_url,
    ...((product.images as string[] | null) ?? []),
  ].filter(Boolean) as string[]

  const variantLabel = selectedVariant
    ? [selectedVariant.size, selectedVariant.color]
        .filter(Boolean)
        .join(' / ') || t('common.defaultVariant')
    : ''

  const favorite = isFavorite(product.id)

  const handleAddToCart = () => {
    if (!selectedVariant || variantStock < 1) return

    addItem(
      {
        variant_id: selectedVariant.id,
        product_id: product.id,
        product_name: product.name,
        product_slug: product.slug,
        variant_description: variantLabel,
        price: selectedVariant.price,
        image_url: product.image_url,
        max_stock: selectedVariant.stock,
      },
      quantity
    )
  }

  const breadcrumbItems = [
    { label: t('breadcrumb.home'), to: '/' },
    { label: t('breadcrumb.products'), to: '/products' },
    ...(product.category
      ? [
          {
            label: product.category.name,
            to: `/products?category=${product.category.slug}`,
          },
        ]
      : []),
    { label: product.name },
  ]

  return (
    <div className="c-product-detail">
      <div className="c-container">
        <Breadcrumbs items={breadcrumbItems} />

        <div className="c-product-detail__layout">
          <div className="c-product-detail__main">
            <div className="c-product-detail__gallery">
              <div className="c-product-detail__image">
                {selectedImage ? (
                  <img src={selectedImage} alt={product.name} />
                ) : (
                  <div className="c-product-detail__image-placeholder">
                    <ImageIcon size={48} aria-hidden="true" />
                  </div>
                )}
                {product.product_type === 'PACK' && (
                  <span className="c-product-detail__pack-badge">
                    {t('product.pack')}
                  </span>
                )}
                {discountPercent > 0 && (
                  <span className="c-product-detail__discount-badge">
                    -{discountPercent}%
                  </span>
                )}
              </div>

              {allImages.length > 1 && (
                <div className="c-product-detail__thumbs">
                  {allImages.map((url, index) => (
                    <button
                      type="button"
                      key={`${url}-${index}`}
                      className={`c-product-detail__thumb ${
                        selectedImage === url
                          ? 'c-product-detail__thumb--active'
                          : ''
                      }`}
                      onClick={() => setSelectedImage(url)}
                      aria-label={`${product.name} ${index + 1}`}
                      aria-pressed={selectedImage === url}
                    >
                      <img src={url} alt="" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="c-product-detail__info">
              {product.category && (
                <Link
                  to={`/products?category=${product.category.slug}`}
                  className="c-product-detail__category"
                >
                  {product.category.name}
                </Link>
              )}

              <div className="c-product-detail__heading-row">
                <h1 className="c-product-detail__title">{product.name}</h1>
                <button
                  type="button"
                  className={`c-product-detail__favorite ${
                    favorite ? 'c-product-detail__favorite--active' : ''
                  }`}
                  onClick={() => toggleFavorite(product.id)}
                  aria-label={
                    favorite
                      ? t('common.removeFavorite')
                      : t('common.addFavorite')
                  }
                  aria-pressed={favorite}
                >
                  <Heart
                    size={20}
                    fill={favorite ? 'currentColor' : 'none'}
                    aria-hidden="true"
                  />
                </button>
              </div>

              <div className="c-product-detail__price-row">
                <span className="c-product-detail__price">
                  {formatPrice(variantPrice)}
                </span>
                {discountPercent > 0 && product.compare_price && (
                  <span className="c-product-detail__compare">
                    {formatPrice(product.compare_price)}
                  </span>
                )}
                {discountPercent > 0 && (
                  <span className="c-product-detail__save">
                    {t('product.savePercent', { percent: discountPercent })}
                  </span>
                )}
              </div>

              <div className="c-product-detail__stock">
                {variantStock > 0 ? (
                  <span className="c-product-detail__stock-in">
                    <Check size={14} aria-hidden="true" />
                    {t('common.inStock')}
                  </span>
                ) : (
                  <span className="c-product-detail__stock-out">
                    <AlertCircle size={14} aria-hidden="true" />
                    {t('common.outOfStock')}
                  </span>
                )}
              </div>

              {product.variants.length > 1 && (
                <div className="c-product-detail__variants">
                  <h2 className="c-product-detail__section-title">
                    {t('product.chooseVariant')}
                  </h2>
                  <div
                    className="c-product-detail__variant-list"
                    role="group"
                    aria-label={t('product.chooseVariant')}
                  >
                    {product.variants.map((variant) => {
                      const label =
                        [variant.size, variant.color]
                          .filter(Boolean)
                          .join(' / ') || t('common.defaultVariant')
                      const isActive = selectedVariantId === variant.id
                      const isOut = variant.stock < 1

                      return (
                        <button
                          type="button"
                          key={variant.id}
                          aria-pressed={isActive}
                          className={`c-product-detail__variant ${
                            isActive
                              ? 'c-product-detail__variant--active'
                              : ''
                          } ${isOut ? 'c-product-detail__variant--out' : ''}`}
                          onClick={() => setSelectedVariantId(variant.id)}
                          disabled={isOut}
                        >
                          <span>{label}</span>
                          <span className="c-product-detail__variant-price">
                            {formatPrice(variant.price)}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="c-product-detail__purchase">
                <div className="c-product-detail__quantity-row">
                  <span className="c-product-detail__quantity-label">
                    {t('common.quantity')}
                  </span>
                  <QuantityControl
                    value={quantity}
                    max={Math.max(1, variantStock)}
                    onChange={setQuantity}
                    label={product.name}
                  />
                </div>
                <button
                  type="button"
                  className="c-btn c-btn--primary c-btn--lg c-product-detail__add"
                  onClick={handleAddToCart}
                  disabled={!selectedVariant || variantStock < 1}
                >
                  <ShoppingBag size={18} aria-hidden="true" />
                  {variantStock > 0
                    ? t('product.addToCart')
                    : t('common.outOfStock')}
                </button>
                {variantStock > 0 && (
                  <a
                    href="#direct-order"
                    className="c-product-detail__direct-link"
                  >
                    {t('order.title')}
                    <ArrowDown size={14} aria-hidden="true" />
                  </a>
                )}
              </div>

              <div className="c-product-detail__assurances">
                <div className="c-product-detail__assurance">
                  <Truck size={17} aria-hidden="true" />
                  <span>{t('product.deliveryInfo')}</span>
                </div>
                <div className="c-product-detail__assurance">
                  <ShieldCheck size={17} aria-hidden="true" />
                  <span>{t('product.codInfo')}</span>
                </div>
              </div>

              {product.description && (
                <div className="c-product-detail__description">
                  <h2 className="c-product-detail__section-title">
                    {t('product.description')}
                  </h2>
                  <p>{product.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {selectedVariant ? (
          <section
            className="c-product-detail__order"
            id="direct-order"
            aria-labelledby="direct-order-title"
          >
            <div className="c-product-detail__order-summary">
              <span className="c-product-detail__order-eyebrow">
                {t('product.directOrder')}
              </span>
              <h2
                className="c-product-detail__order-title"
                id="direct-order-title"
              >
                {t('product.selection')}
              </h2>

              <div className="c-product-detail__order-product">
                {product.image_url ? (
                  <img src={product.image_url} alt="" />
                ) : (
                  <span
                    className="c-product-detail__order-thumb-placeholder"
                    aria-hidden="true"
                  >
                    <ImageIcon size={20} />
                  </span>
                )}
                <div>
                  <span className="c-product-detail__order-name">
                    {product.name}
                  </span>
                  <span className="c-product-detail__order-variant">
                    {variantLabel}
                  </span>
                </div>
              </div>

              <dl className="c-product-detail__order-meta">
                <div>
                  <dt>{t('common.quantity')}</dt>
                  <dd>{quantity}</dd>
                </div>
                <div>
                  <dt>{t('product.itemsTotal')}</dt>
                  <dd>{formatPrice(variantPrice * quantity)}</dd>
                </div>
              </dl>

              <div className="c-product-detail__order-assurances">
                <div className="c-product-detail__order-assurance">
                  <Truck size={16} aria-hidden="true" />
                  <span>{t('product.deliveryInfo')}</span>
                </div>
                <div className="c-product-detail__order-assurance">
                  <ShieldCheck size={16} aria-hidden="true" />
                  <span>{t('product.codInfo')}</span>
                </div>
              </div>
            </div>

            <div className="c-product-detail__order-form">
              <OrderForm
                variantId={selectedVariant.id}
                unitPrice={selectedVariant.price}
                maxStock={selectedVariant.stock}
                quantity={quantity}
                onQuantityChange={setQuantity}
                onSuccess={(orderNum) => setOrderNumber(orderNum)}
              />
            </div>
          </section>
        ) : (
          <div className="c-product-detail__no-variant">
            <AlertCircle size={24} aria-hidden="true" />
            <p>{t('product.selectVariantPrompt')}</p>
          </div>
        )}

        {relatedProducts.length > 0 && (
          <section
            className="c-product-detail__related"
            aria-labelledby="related-products"
          >
            <div className="c-section-heading">
              <div className="c-section-heading__copy">
                <span className="c-section-eyebrow">
                  {t('product.relatedSub')}
                </span>
                <h2 className="c-section-title" id="related-products">
                  {t('product.related')}
                </h2>
              </div>
              <Link to="/products" className="c-section-heading__link">
                {t('common.viewAll')}
              </Link>
            </div>
            <ProductGrid products={relatedProducts} skeletonCount={4} />
          </section>
        )}
      </div>

      <ThankYouModal
        isOpen={!!orderNumber}
        orderNumber={orderNumber ?? ''}
        onClose={() => setOrderNumber(null)}
      />
    </div>
  )
}
