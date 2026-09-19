import { Link } from 'react-router-dom'
import { Heart, ShoppingCart, Image as ImageIcon, Star } from 'lucide-react'
import type { PublicProduct } from '../../hooks/usePublicProducts'
import { formatPrice } from '../../../utils/format'
import './ProductCard.css'

interface ProductCardProps {
  product: PublicProduct
}

export function ProductCard({ product }: ProductCardProps) {
  const hasPriceRange = product.min_price !== product.max_price
  const isPack = product.product_type === 'PACK'

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

        {/* Top-right badges */}
        <div className="c-product-card__badges">
          {isPack && (
            <span className="c-product-card__badge c-product-card__badge--pack">
              PACK
            </span>
          )}
        </div>

        {/* Favorite button (visual only for now) */}
        <button
          type="button"
          className="c-product-card__fav"
          onClick={(e) => {
            e.preventDefault()
          }}
          aria-label="Add to favorites"
        >
          <Heart size={16} />
        </button>
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

          <button
            type="button"
            className="c-product-card__cart-btn"
            onClick={(e) => {
              e.preventDefault()
              // Navigate to product page to pick variant
              window.location.href = `/products/${product.slug}`
            }}
            aria-label="Add to cart"
          >
            <ShoppingCart size={14} />
            <span>Add to cart</span>
          </button>
        </div>
      </div>
    </Link>
  )
}