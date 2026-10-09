import { Link } from 'react-router-dom'
import { ArrowRight, ShoppingBag, Trash2 } from 'lucide-react'
import { useCart } from '../../context/CartContext'
import { formatPrice } from '../../../utils/format'
import './CartPage.css'

export function CartPage() {
  const { items, subtotal, itemCount, removeItem } = useCart()

  return (
    <div className="c-cart-page">
      <div className="c-container">
        <div className="c-cart-page__header">
          <h1 className="c-page-title">
            Your Cart {itemCount > 0 && `(${itemCount})`}
          </h1>
          <p className="c-page-subtitle">
            {items.length === 0
              ? 'Your cart is currently empty.'
              : 'Review your items and proceed to checkout.'}
          </p>
        </div>

        {items.length === 0 ? (
          <div className="c-cart-page__empty">
            <div className="c-cart-page__empty-icon">
              <ShoppingBag size={36} />
            </div>
            <h3 className="c-cart-page__empty-title">Your cart is empty</h3>
            <p className="c-cart-page__empty-desc">
              Start shopping to add items to your cart.
            </p>
            <Link to="/products" className="c-btn c-btn--primary c-btn--lg">
              Browse products
              <ArrowRight size={18} />
            </Link>
          </div>
        ) : (
          <div className="c-cart-page__layout">
            {/* Items */}
            <div className="c-cart-page__items">
              {items.map((item) => (
                <div key={item.variant_id} className="c-cart-page__item">
                  <Link
                    to={`/products/${item.product_slug}`}
                    className="c-cart-page__item-image"
                  >
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.product_name} />
                    ) : (
                      <ShoppingBag size={20} />
                    )}
                  </Link>

                  <div className="c-cart-page__item-info">
                    <Link
                      to={`/products/${item.product_slug}`}
                      className="c-cart-page__item-name"
                    >
                      {item.product_name}
                    </Link>
                    {item.variant_description && (
                      <div className="c-cart-page__item-variant">
                        {item.variant_description}
                      </div>
                    )}
                    <div className="c-cart-page__item-meta">
                      {formatPrice(item.price)} × {item.quantity}
                    </div>
                  </div>

                  <div className="c-cart-page__item-right">
                    <div className="c-cart-page__item-total">
                      {formatPrice(item.price * item.quantity)}
                    </div>
                    <button
                      type="button"
                      className="c-cart-page__item-remove"
                      onClick={() => removeItem(item.variant_id)}
                      aria-label="Remove item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <aside className="c-cart-page__summary">
              <h2 className="c-cart-page__summary-title">Summary</h2>

              <div className="c-cart-page__summary-row">
                <span>
                  Subtotal ({itemCount} item{itemCount !== 1 ? 's' : ''})
                </span>
                <span>{formatPrice(subtotal)}</span>
              </div>

              <div className="c-cart-page__summary-row c-cart-page__summary-row--muted">
                <span>Delivery fee calculated at checkout.</span>
              </div>

              <div className="c-cart-page__summary-total">
                <span>Total</span>
                <span>{formatPrice(subtotal)}</span>
              </div>

              <Link
                to="/checkout"
                className="c-btn c-btn--primary c-btn--lg c-btn--block c-cart-page__checkout"
              >
                Checkout
                <ArrowRight size={18} />
              </Link>

              <Link
                to="/products"
                className="c-btn c-btn--ghost c-btn--block"
              >
                Continue shopping
              </Link>
            </aside>
          </div>
        )}
      </div>
    </div>
  )
}