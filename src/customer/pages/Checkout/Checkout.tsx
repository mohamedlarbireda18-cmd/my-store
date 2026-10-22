import { useCallback, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ShoppingBag, Image as ImageIcon, Trash2 } from 'lucide-react'
import { CheckoutForm } from '../../components/CheckoutForm/CheckoutForm'
import { ThankYouModal } from '../../components/ThankYouModal/ThankYouModal'
import { useCart } from '../../context/CartContext'
import { useLanguage } from '../../../i18n/LanguageContext'
import { formatPrice } from '../../../utils/format'
import './Checkout.css'

export function Checkout() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { items, subtotal, removeItem } = useCart()
  const [orderNumber, setOrderNumber] = useState<string | null>(null)
  const [deliveryFee, setDeliveryFee] = useState(0)
  const [deliveryCalculated, setDeliveryCalculated] = useState(false)

  const handleDeliveryChange = useCallback(
    (fee: number, isCalculated: boolean) => {
      setDeliveryFee(fee)
      setDeliveryCalculated(isCalculated)
    },
    []
  )

  // Empty cart — show empty state
  if (items.length === 0 && !orderNumber) {
    return (
      <div className="c-checkout">
        <div className="c-container">
          <div className="c-checkout__empty">
            <div className="c-checkout__empty-icon">
              <ShoppingBag size={32} />
            </div>
            <h1 className="c-checkout__empty-title">
              {t('checkout.emptyTitle')}
            </h1>
            <p className="c-checkout__empty-desc">
              {t('checkout.emptyDesc')}
            </p>
            <Link to="/products" className="c-btn c-btn--primary">
              {t('common.browseProducts')}
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
          <span>{t('checkout.back')}</span>
        </button>

        <div className="c-checkout__header">
          <h1 className="c-page-title">{t('checkout.title')}</h1>
          <p className="c-page-subtitle">{t('checkout.subtitle')}</p>
        </div>

        <div className="c-checkout__layout">
          {/* Left: form */}
          <div className="c-checkout__form-col">
            <CheckoutForm
              onSuccess={(orderNum) => setOrderNumber(orderNum)}
              onDeliveryChange={handleDeliveryChange}
            />
          </div>

          {/* Right: summary */}
          <aside className="c-checkout__summary-col">
            <div className="c-checkout__summary">
              <div className="c-checkout__summary-header">
                <h2 className="c-checkout__summary-title">
                  {t('checkout.orderSummary')}
                </h2>
                <Link to="/cart" className="c-checkout__adjust">
                  {t('checkout.adjustCart')}
                </Link>
              </div>

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
                        aria-label={t('checkout.remove')}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="c-checkout__totals">
                <div className="c-checkout__total-row">
                  <span>{t('common.subtotal')}</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="c-checkout__total-row">
                  <span>{t('form.deliveryFee')}</span>
                  <span>
                    {deliveryCalculated
                      ? deliveryFee === 0
                        ? t('confirmation.free')
                        : formatPrice(deliveryFee)
                      : '—'}
                  </span>
                </div>
                <div className="c-checkout__total-row c-checkout__total-row--grand">
                  <span>{t('common.total')}</span>
                  <span>
                    {formatPrice(
                      subtotal + (deliveryCalculated ? deliveryFee : 0)
                    )}
                  </span>
                </div>
                <p className="c-checkout__total-row--hint">
                  {t('cart.deliveryNote')}
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <ThankYouModal
        isOpen={!!orderNumber}
        orderNumber={orderNumber ?? ''}
        onClose={() => {
          const confirmedOrderNumber = orderNumber
          setOrderNumber(null)

          if (confirmedOrderNumber) {
            navigate(`/order-confirmation/${confirmedOrderNumber}`)
          } else {
            navigate('/products')
          }
        }}
      />
    </div>
  )
}