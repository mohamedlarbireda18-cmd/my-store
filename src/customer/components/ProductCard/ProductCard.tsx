import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, Image as ImageIcon, Star } from 'lucide-react'
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

  const hasPriceRange = product.min_price !== product.max_price
  const isPack = product.product_type === 'PACK'

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // If only one variant exists, add it directly
    const activeVariants = product.variants.filter(
      (v) => v.is_active && v.stock > 0
    )

    if (activeVariants.length === 1) {
      const v = activeVariants[0]
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
    } else {
      // Multiple variants → navigate to detail to pick one
      navigate(`/products/${product.slug}`)
    }
  }

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

          <button
            type="button"
            className="c-product-card__cart-btn"
            onClick={handleAddToCart}
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