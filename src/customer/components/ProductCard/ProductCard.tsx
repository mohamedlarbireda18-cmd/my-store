import { useState, useRef, useEffect, useId } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, Image as ImageIcon, X } from 'lucide-react'
import type { PublicProduct } from '../../hooks/usePublicProducts'
import { useCart } from '../../context/CartContext'
import { useLanguage } from '../../../i18n/LanguageContext'
import { formatPrice } from '../../../utils/format'
import './ProductCard.css'

interface ProductCardProps {
  product: PublicProduct
}

export function ProductCard({ product }: ProductCardProps) {
  const navigate = useNavigate()
  const { addItem } = useCart()
  const { t } = useLanguage()
  const [pickerOpen, setPickerOpen] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)
  const cartButtonRef = useRef<HTMLButtonElement>(null)
  const pickerCloseRef = useRef<HTMLButtonElement>(null)
  const pickerId = useId()

  const hasPriceRange = product.min_price !== product.max_price
  const isPack = product.product_type === 'PACK'
  const comparePrice =
    product.compare_price && product.compare_price > product.min_price
      ? product.compare_price
      : null
  const discountPercent = comparePrice
    ? Math.round((1 - product.min_price / comparePrice) * 100)
    : 0

  const activeVariants = product.variants.filter(
    (variant) => variant.is_active && variant.stock > 0
  )
  const hasVariantChoice = activeVariants.length > 1
  const lowStock = product.total_stock > 0 && product.total_stock <= 3

  const addVariantToCart = (variantId: string) => {
    const variant = product.variants.find((item) => item.id === variantId)
    if (!variant) return

    const variantDescription =
      [variant.size, variant.color].filter(Boolean).join(' / ') ||
      t('common.defaultVariant')

    addItem({
      variant_id: variant.id,
      product_id: product.id,
      product_name: product.name,
      product_slug: product.slug,
      variant_description: variantDescription,
      price: variant.price,
      image_url: product.image_url,
      max_stock: variant.stock,
    })

    setPickerOpen(false)
  }

  const closePicker = (restoreFocus = true) => {
    setPickerOpen(false)
    if (restoreFocus) {
      window.setTimeout(() => {
        cartButtonRef.current?.focus({ preventScroll: true })
      }, 0)
    }
  }

  const handleAddToCart = (event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()

    if (pickerOpen) {
      closePicker()
      return
    }

    if (activeVariants.length === 0) {
      navigate(`/products/${product.slug}`)
      return
    }

    if (activeVariants.length === 1) {
      addVariantToCart(activeVariants[0].id)
    } else {
      setPickerOpen(true)
    }
  }

  useEffect(() => {
    if (!pickerOpen) return

    const isMobile = window.matchMedia('(max-width: 480px)').matches
    const previousOverflow = document.body.style.overflow

    if (isMobile) {
      document.body.style.overflow = 'hidden'
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node)
      ) {
        closePicker(false)
      }
    }

    const getSheetFocusable = () =>
      Array.from(
        pickerRef.current?.querySelectorAll<HTMLElement>(
          '.c-product-card__variant-picker button:not([disabled])'
        ) ?? []
      )

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closePicker()
        return
      }

      if (!isMobile || event.key !== 'Tab') return

      const focusable = getSheetFocusable()
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement

      if (event.shiftKey && (active === first || active === pickerRef.current)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }

    const timer = window.setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
      if (isMobile) {
        pickerCloseRef.current?.focus({ preventScroll: true })
      }
    }, 0)

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
      if (isMobile) {
        document.body.style.overflow = previousOverflow
      }
    }
  }, [pickerOpen])

  return (
    <article
      className={`c-product-card ${
        pickerOpen ? 'c-product-card--picker-open' : ''
      }`}
    >
      <div className="c-product-card__media">
        <Link
          to={`/products/${product.slug}`}
          className="c-product-card__image"
          aria-label={product.name}
        >
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} loading="lazy" />
          ) : (
            <div className="c-product-card__image-placeholder">
              <ImageIcon size={32} aria-hidden="true" />
            </div>
          )}

          <div className="c-product-card__badges">
            {discountPercent > 0 && (
              <span className="c-product-card__badge c-product-card__badge--sale">
                {t('product.discount', { percent: discountPercent })}
              </span>
            )}
            {isPack && (
              <span className="c-product-card__badge c-product-card__badge--pack">
                {t('product.pack')}
              </span>
            )}
          </div>
        </Link>
      </div>

      <div className="c-product-card__body">
        {product.category && (
          <Link
            to={`/products?category=${product.category.slug}`}
            className="c-product-card__category"
          >
            {product.category.name}
          </Link>
        )}

        <h3 className="c-product-card__name">
          <Link to={`/products/${product.slug}`}>{product.name}</Link>
        </h3>

        {lowStock && (
          <span className="c-product-card__stock">
            <span aria-hidden="true" />
            {t('product.stockLeft', { count: product.total_stock })}
          </span>
        )}

        <div className="c-product-card__bottom">
          <div className="c-product-card__price">
            <span className="c-product-card__price-current">
              {formatPrice(product.min_price)}
              {hasPriceRange && (
                <span className="c-product-card__price-more">+</span>
              )}
            </span>
            {comparePrice && (
              <span className="c-product-card__price-compare">
                {formatPrice(comparePrice)}
              </span>
            )}
          </div>

          <div className="c-product-card__cart-wrap" ref={pickerRef}>
            <button
              ref={cartButtonRef}
              type="button"
              className="c-product-card__cart-btn"
              onClick={handleAddToCart}
              aria-label={t('product.addToCartAriaName', {
                name: product.name,
              })}
              aria-expanded={hasVariantChoice ? pickerOpen : undefined}
              aria-haspopup={hasVariantChoice ? 'dialog' : undefined}
              aria-controls={hasVariantChoice && pickerOpen ? pickerId : undefined}
            >
              <ShoppingCart size={15} aria-hidden="true" />
              <span>{t('product.addToCart')}</span>
            </button>

            {pickerOpen && (
              <>
                <div
                  className="c-product-card__picker-backdrop"
                  onClick={() => closePicker()}
                  aria-hidden="true"
                />
                <div
                  id={pickerId}
                  className="c-product-card__variant-picker"
                  role="dialog"
                  aria-label={t('product.chooseVariant')}
                >
                  <div className="c-product-card__variant-picker-header">
                    <span>{t('product.chooseVariant')}</span>
                    <button
                      ref={pickerCloseRef}
                      type="button"
                      className="c-product-card__variant-picker-close"
                      onClick={(event) => {
                        event.preventDefault()
                        event.stopPropagation()
                        closePicker()
                      }}
                      aria-label={t('common.close')}
                    >
                      <X size={14} aria-hidden="true" />
                    </button>
                  </div>

                  <ul className="c-product-card__variant-list">
                    {activeVariants.map((variant) => {
                      const label =
                        [variant.size, variant.color]
                          .filter(Boolean)
                          .join(' / ') || t('common.defaultVariant')

                      return (
                        <li key={variant.id}>
                          <button
                            type="button"
                            className="c-product-card__variant-option"
                            onClick={(event) => {
                              event.preventDefault()
                              event.stopPropagation()
                              addVariantToCart(variant.id)
                            }}
                          >
                            <span className="c-product-card__variant-label">
                              {label}
                            </span>
                            <span className="c-product-card__variant-price">
                              {formatPrice(variant.price)}
                            </span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}