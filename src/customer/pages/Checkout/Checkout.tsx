import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ShoppingBag, Image as ImageIcon, Trash2 } from 'lucide-react'
import { CheckoutForm } from '../../components/CheckoutForm/CheckoutForm'
import { ThankYouModal } from '../../components/ThankYouModal/ThankYouModal'
import { useCart } from '../../context/CartContext'
import { formatPrice } from '../../../utils/format'
import './Checkout.css'

export function Checkout() {
  const navigate = useNavigate()
  const { items, subtotal, removeItem } = useCart()
  const [orderNumber, setOrderNumber] = useState<string | null>(null)

  // Empty cart — show empty state
  if (items.length === 0 && !orderNumber) {
    return (
      <div className="c-checkout">
        <div className="c-container">
          <div className="c-checkout__empty">
            <div className="c-checkout__empty-icon">
              <ShoppingBag size={32} />
            </div>
            <h2 className="c-checkout__empty-title">Your cart is empty</h2>
            <p className="c-checkout__empty-desc">
              Add items to your cart before checking out.
            </p>
            <Link to="/products" className="c-btn c-btn--primary">
              Browse products
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="c-checkout">
      <div className="c-container">
        {/* Back */}
        <button
          className="c-checkout__back"
          onClick={() => navigate(-1)}
          type="button"
        >
          <ArrowLeft size={18} />
          <span>Back</span>
        </button>

        <div className="c-checkout__header">
          <h1 className="c-page-title">Checkout</h1>
          <p className="c-page-subtitle">
            Complete your order below and we'll contact you to confirm.
          </p>
        </div>

        <div className="c-checkout__layout">
          {/* Left: form */}
          <div className="c-checkout__form-col">
            <CheckoutForm
              onSuccess={(orderNum) => setOrderNumber(orderNum)}
            />
          </div>

          {/* Right: summary */}
          <aside className="c-checkout__summary-col">
            <div className="c-checkout__summary">
              <h2 className="c-checkout__summary-title">
                Order summary
              </h2>

              <ul className="c-checkout__items">
                {items.map((item) => (
                  <li key={item.variant_id} className="c-checkout__item">
                    <div className="c-checkout__item-image">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.product_name} />
                      ) : (
                        <ImageIcon size={20} />
                      )}
                    </div>

                    <div className="c-checkout__item-info">
                      <div className="c-checkout__item-name">
                        {item.product_name}
                      </div>
                      {item.variant_description && (
                        <div className="c-checkout__item-variant">
                          {item.variant_description}
                        </div>
                      )}
                      <div className="c-checkout__item-meta">
                        {formatPrice(item.price)} × {item.quantity}
                      </div>
                    </div>

                    <div className="c-checkout__item-right">
                      <div className="c-checkout__item-total">
                        {formatPrice(item.price * item.quantity)}
                      </div>
                      <button
                        type="button"
                        className="c-checkout__item-remove"
                        onClick={() => removeItem(item.variant_id)}
                        aria-label="Remove"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="c-checkout__totals">
                <div className="c-checkout__total-row">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="c-checkout__total-row c-checkout__total-row--hint">
                  <span>Delivery fee calculated at checkout.</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <ThankYouModal
        isOpen={!!orderNumber}
        orderNumber={orderNumber ?? ''}
        onClose={() => {
          setOrderNumber(null)
          navigate('/products')
        }}
      />
    </div>
  )
}