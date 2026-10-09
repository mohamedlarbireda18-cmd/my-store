import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, Image as ImageIcon, Star, X } from 'lucide-react'
import type { PublicProduct } from '../../hooks/usePublicProducts'
import { useCart } from '../../context/CartContext'
import { formatPrice } from '../../../utils/format'
import './ProductCard.css'

interface ProductCardProps {
  product: PublicProduct
}

export function ProductCard({ product }: ProductCardProps) {
  const navigate = useNavigate()
  const { addItem } = useCart()
  const [pickerOpen, setPickerOpen] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)

  const hasPriceRange = product.min_price !== product.max_price
  const isPack = product.product_type === 'PACK'

  const activeVariants = product.variants.filter(
    (v) => v.is_active && v.stock > 0
  )

  const addVariantToCart = (variantId: string) => {
    const v = product.variants.find((vv) => vv.id === variantId)
    if (!v) return

    const variantDescription =
      [v.size, v.color].filter(Boolean).join(' / ') || 'Default'

    addItem({
      variant_id: v.id,
      product_id: product.id,
      product_name: product.name,
      product_slug: product.slug,
      variant_description: variantDescription,
      price: v.price,
      image_url: product.image_url,
      max_stock: v.stock,
    })

    setPickerOpen(false)
  }

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (activeVariants.length === 0) {
      // Out of stock — go to detail for context
      navigate(`/products/${product.slug}`)
      return
    }

    if (activeVariants.length === 1) {
      // Only one variant → add directly
      addVariantToCart(activeVariants[0].id)
    } else {
      // Multiple variants → open picker
      setPickerOpen(true)
    }
  }

  // Close picker on outside click
  useEffect(() => {
    if (!pickerOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false)
      }
    }

    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 0)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [pickerOpen])

  return (
    <Link to={`/products/${product.slug}`} className="c-product-card">
      <div className="c-product-card__image">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} loading="lazy" />
        ) : (
          <div className="c-product-card__image-placeholder">
            <ImageIcon size={32} />
          </div>
        )}

        <div className="c-product-card__badges">
          {isPack && (
            <span className="c-product-card__badge c-product-card__badge--pack">
              PACK
            </span>
          )}
        </div>
      </div>

      <div className="c-product-card__body">
        <h3 className="c-product-card__name">{product.name}</h3>

        <div className="c-product-card__rating">
          <Star size={12} className="c-product-card__rating-star" />
          <span className="c-product-card__rating-value">4.8</span>
          <span className="c-product-card__rating-count">(124)</span>
        </div>

        <div className="c-product-card__bottom">
          <div className="c-product-card__price">
            <span className="c-product-card__price-current">
              {formatPrice(product.min_price)}
            </span>
            {hasPriceRange && (
              <span className="c-product-card__price-more">+</span>
            )}
          </div>

          <div
            className="c-product-card__cart-wrap"
            ref={pickerRef}
          >
            <button
              type="button"
              className="c-product-card__cart-btn"
              onClick={handleAddToCart}
              aria-label="Add to cart"
            >
              <ShoppingCart size={14} />
              <span>Add to cart</span>
            </button>

            {pickerOpen && (
              <div className="c-product-card__variant-picker">
                <div className="c-product-card__variant-picker-header">
                  <span>Choose variant</span>
                  <button
                    type="button"
                    className="c-product-card__variant-picker-close"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setPickerOpen(false)
                    }}
                    aria-label="Close"
                  >
                    <X size={14} />
                  </button>
                </div>

                <ul className="c-product-card__variant-list">
                  {activeVariants.map((v) => {
                    const label =
                      [v.size, v.color].filter(Boolean).join(' / ') ||
                      'Default'

                    return (
                      <li key={v.id}>
                        <button
                          type="button"
                          className="c-product-card__variant-option"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            addVariantToCart(v.id)
                          }}
                        >
                          <span className="c-product-card__variant-label">
                            {label}
                          </span>
                          <span className="c-product-card__variant-price">
                            {formatPrice(v.price)}
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}