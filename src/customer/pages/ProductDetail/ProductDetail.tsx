import { useMemo, useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Package,
  Check,
  AlertCircle,
  Image as ImageIcon,
} from 'lucide-react'
import { usePublicProduct } from '../../hooks/usePublicProducts'
import { OrderForm } from '../../components/OrderForm/OrderForm'
import { ThankYouModal } from '../../components/ThankYouModal/ThankYouModal'
import { formatPrice } from '../../../utils/format'
import './ProductDetail.css'

export function ProductDetail() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { data: product, isLoading } = usePublicProduct(slug)

  const [selectedVariantId, setSelectedVariantId] = useState<string>('')
  const [selectedImage, setSelectedImage] = useState<string>('')
  const [orderNumber, setOrderNumber] = useState<string | null>(null)

  // Auto-select first available variant
  useEffect(() => {
    if (product && product.variants.length > 0 && !selectedVariantId) {
      const firstInStock = product.variants.find((v) => v.stock > 0)
      setSelectedVariantId((firstInStock ?? product.variants[0]).id)
    }
  }, [product, selectedVariantId])

  // Set initial image
  useEffect(() => {
    if (product) {
      setSelectedImage(product.image_url ?? '')
    }
  }, [product])

  const selectedVariant = useMemo(() => {
    if (!product) return null
    return product.variants.find((v) => v.id === selectedVariantId) ?? null
  }, [product, selectedVariantId])

  if (isLoading) {
    return (
      <div className="c-product-detail">
        <div className="c-container">
          <div className="c-product-detail__skeleton">
            <div className="c-product-detail__skeleton-img c-skeleton" />
            <div className="c-product-detail__skeleton-line c-skeleton" />
            <div className="c-product-detail__skeleton-line c-skeleton" />
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
            <Package size={48} />
            <h2>Product not found</h2>
            <p>This product may no longer be available.</p>
            <Link to="/products" className="c-btn c-btn--primary">
              Browse products
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const variantPrice = selectedVariant?.price ?? product.min_price
  const variantStock = selectedVariant?.stock ?? 0

  const allImages = [
    product.image_url,
    ...((product.images as string[] | null) ?? []),
  ].filter(Boolean) as string[]

  return (
    <div className="c-product-detail">
      <div className="c-container">
        {/* Back */}
        <button
          className="c-product-detail__back"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={18} />
          <span>Back</span>
        </button>

        <div className="c-product-detail__layout">
          {/* Left: images + info */}
          <div className="c-product-detail__main">
            {/* Main image */}
            <div className="c-product-detail__image">
              {selectedImage ? (
                <img src={selectedImage} alt={product.name} />
              ) : (
                <div className="c-product-detail__image-placeholder">
                  <ImageIcon size={48} />
                </div>
              )}
              {product.product_type === 'PACK' && (
                <span className="c-product-detail__pack-badge">PACK</span>
              )}
            </div>

            {/* Thumbnails */}
            {allImages.length > 1 && (
              <div className="c-product-detail__thumbs">
                {allImages.map((url, i) => (
                  <button
                    key={i}
                    className={`c-product-detail__thumb ${
                      selectedImage === url
                        ? 'c-product-detail__thumb--active'
                        : ''
                    }`}
                    onClick={() => setSelectedImage(url)}
                  >
                    <img src={url} alt={`${product.name} ${i + 1}`} />
                  </button>
                ))}
              </div>
            )}

            {/* Info */}
            <div className="c-product-detail__info">
              <h1 className="c-product-detail__title">{product.name}</h1>

              <div className="c-product-detail__price-row">
                <span className="c-product-detail__price">
                  {formatPrice(variantPrice)}
                </span>
                {product.compare_price &&
                  product.compare_price > variantPrice && (
                    <span className="c-product-detail__compare">
                      {formatPrice(product.compare_price)}
                    </span>
                  )}
              </div>

              {/* Stock */}
              <div className="c-product-detail__stock">
                {variantStock > 0 ? (
                  <span className="c-product-detail__stock-in">
                    <Check size={14} />
                    In stock
                  </span>
                ) : (
                  <span className="c-product-detail__stock-out">
                    <AlertCircle size={14} />
                    Out of stock
                  </span>
                )}
              </div>

              {/* Description */}
              {product.description && (
                <div className="c-product-detail__description">
                  <h3 className="c-product-detail__section-title">
                    Description
                  </h3>
                  <p>{product.description}</p>
                </div>
              )}

              {/* Variants */}
              {product.variants.length > 1 && (
                <div className="c-product-detail__variants">
                  <h3 className="c-product-detail__section-title">
                    Choose variant
                  </h3>
                  <div className="c-product-detail__variant-list">
                    {product.variants.map((v) => {
                      const label =
                        [v.size, v.color].filter(Boolean).join(' / ') ||
                        'Default'
                      const isActive = selectedVariantId === v.id
                      const isOut = v.stock < 1

                      return (
                        <button
                          key={v.id}
                          className={`c-product-detail__variant ${
                            isActive
                              ? 'c-product-detail__variant--active'
                              : ''
                          } ${isOut ? 'c-product-detail__variant--out' : ''}`}
                          onClick={() => setSelectedVariantId(v.id)}
                          disabled={isOut}
                        >
                          <span>{label}</span>
                          <span className="c-product-detail__variant-price">
                            {formatPrice(v.price)}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: order form */}
          <div className="c-product-detail__sidebar">
            {selectedVariant ? (
              <OrderForm
                variantId={selectedVariant.id}
                unitPrice={selectedVariant.price}
                maxStock={selectedVariant.stock}
                onSuccess={(orderNum) => setOrderNumber(orderNum)}
              />
            ) : (
              <div className="c-product-detail__no-variant">
                <AlertCircle size={24} />
                <p>Select a variant to order</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <ThankYouModal
        isOpen={!!orderNumber}
        orderNumber={orderNumber ?? ''}
        onClose={() => setOrderNumber(null)}
      />
    </div>
  )
}