import { useNavigate } from 'react-router-dom'
import { X, ShoppingBag, Trash2, ArrowRight } from 'lucide-react'
import { useCart } from '../../context/CartContext'
import { formatPrice } from '../../../utils/format'
import './CartDrawer.css'

export function CartDrawer() {
  const navigate = useNavigate()
  const {
    items,
    subtotal,
    itemCount,
    removeItem,
    isDrawerOpen,
    closeDrawer,
  } = useCart()

  const handleCheckout = () => {
    closeDrawer()
    navigate('/checkout')
  }

  return (
    <>
      {isDrawerOpen && (
        <div className="c-drawer__backdrop" onClick={closeDrawer} />
      )}

      <aside
        className={`c-drawer ${isDrawerOpen ? 'c-drawer--open' : ''}`}
        aria-hidden={!isDrawerOpen}
      >
        <div className="c-drawer__header">
          <div className="c-drawer__title">
            <ShoppingBag size={18} />
            <span>Cart {itemCount > 0 && `(${itemCount})`}</span>
          </div>
          <button
            className="c-drawer__close"
            onClick={closeDrawer}
            aria-label="Close cart"
          >
            <X size={20} />
          </button>
        </div>

        <div className="c-drawer__body">
          {items.length === 0 ? (
            <div className="c-drawer__empty">
              <div className="c-drawer__empty-icon">
                <ShoppingBag size={32} />
              </div>
              <h3 className="c-drawer__empty-title">Your cart is empty</h3>
              <p className="c-drawer__empty-desc">
                Start shopping to add items to your cart.
              </p>
              <button
                className="c-btn c-btn--primary"
                onClick={() => {
                  closeDrawer()
                  navigate('/products')
                }}
              >
                Browse products
              </button>
            </div>
          ) : (
            <ul className="c-drawer__list">
              {items.map((item) => (
                <li key={item.variant_id} className="c-drawer__item">
                  <div className="c-drawer__item-image">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.product_name} />
                    ) : (
                      <ShoppingBag size={18} />
                    )}
                  </div>

                  <div className="c-drawer__item-info">
                    <div className="c-drawer__item-name">
                      {item.product_name}
                    </div>
                    {item.variant_description && (
                      <div className="c-drawer__item-variant">
                        {item.variant_description}
                      </div>
                    )}
                    <div className="c-drawer__item-price">
                      {formatPrice(item.price)} × {item.quantity}
                    </div>
                  </div>

                  <div className="c-drawer__item-right">
                    <div className="c-drawer__item-total">
                      {formatPrice(item.price * item.quantity)}
                    </div>
                    <button
                      className="c-drawer__item-remove"
                      onClick={() => removeItem(item.variant_id)}
                      aria-label="Remove item"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="c-drawer__footer">
            <div className="c-drawer__subtotal">
              <span>Subtotal</span>
              <span className="c-drawer__subtotal-value">
                {formatPrice(subtotal)}
              </span>
            </div>
            <p className="c-drawer__note">
              Delivery fee calculated at checkout.
            </p>
            <div className="c-drawer__actions">
              <button
                className="c-btn c-btn--primary c-btn--block"
                onClick={handleCheckout}
              >
                Checkout
                <ArrowRight size={16} />
              </button>
              <button
                className="c-btn c-btn--ghost c-btn--block"
                onClick={closeDrawer}
              >
                Continue shopping
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  )
}