import { useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { X, ShoppingBag, Trash2, ArrowRight } from 'lucide-react'
import { useCart } from '../../context/CartContext'
import { useAccessibleDialog } from '../../hooks/useAccessibleDialog'
import { useLanguage } from '../../../i18n/LanguageContext'
import { formatPrice } from '../../../utils/format'
import { QuantityControl } from '../QuantityControl/QuantityControl'
import './CartDrawer.css'

export function CartDrawer() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const {
    items,
    subtotal,
    itemCount,
    updateQuantity,
    removeItem,
    isDrawerOpen,
    closeDrawer,
  } = useCart()
  const drawerRef = useRef<HTMLElement>(null)

  useAccessibleDialog(isDrawerOpen, closeDrawer, drawerRef)

  const handleCheckout = () => {
    closeDrawer()
    navigate('/checkout')
  }

  const handleViewCart = () => {
    closeDrawer()
    navigate('/cart')
  }

  return (
    <>
      {isDrawerOpen && (
        <div
          className="c-drawer__backdrop"
          onClick={closeDrawer}
          aria-hidden="true"
        />
      )}

      <aside
        ref={drawerRef}
        className={`c-drawer ${isDrawerOpen ? 'c-drawer--open' : ''}`}
        role={isDrawerOpen ? 'dialog' : undefined}
        aria-modal={isDrawerOpen ? true : undefined}
        aria-labelledby="cart-drawer-title"
        aria-hidden={!isDrawerOpen}
        tabIndex={-1}
      >
        <div className="c-drawer__header">
          <div className="c-drawer__title" id="cart-drawer-title">
            <ShoppingBag size={18} aria-hidden="true" />
            <span>
              {t('cart.title')} {itemCount > 0 && `(${itemCount})`}
            </span>
          </div>
          <button
            type="button"
            className="c-drawer__close"
            onClick={closeDrawer}
            aria-label={t('common.close')}
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <div className="c-drawer__body">
          {items.length === 0 ? (
            <div className="c-drawer__empty">
              <div className="c-drawer__empty-icon">
                <ShoppingBag size={32} aria-hidden="true" />
              </div>
              <h3 className="c-drawer__empty-title">
                {t('cart.emptyTitle')}
              </h3>
              <p className="c-drawer__empty-desc">{t('cart.emptyDesc')}</p>
              <button
                type="button"
                className="c-btn c-btn--primary"
                onClick={() => {
                  closeDrawer()
                  navigate('/products')
                }}
              >
                {t('common.browseProducts')}
              </button>
            </div>
          ) : (
            <ul className="c-drawer__list">
              {items.map((item) => (
                <li key={item.variant_id} className="c-drawer__item">
                  <Link
                    to={`/products/${item.product_slug}`}
                    className="c-drawer__item-image"
                    onClick={closeDrawer}
                  >
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.product_name} />
                    ) : (
                      <ShoppingBag size={18} aria-hidden="true" />
                    )}
                  </Link>

                  <div className="c-drawer__item-info">
                    <Link
                      to={`/products/${item.product_slug}`}
                      className="c-drawer__item-name"
                      onClick={closeDrawer}
                    >
                      {item.product_name}
                    </Link>
                    {item.variant_description && (
                      <div className="c-drawer__item-variant">
                        {item.variant_description}
                      </div>
                    )}
                    <div className="c-drawer__item-price">
                      {formatPrice(item.price)}
                    </div>
                    <div className="c-drawer__item-quantity">
                      <QuantityControl
                        value={item.quantity}
                        max={item.max_stock}
                        onChange={(quantity) =>
                          updateQuantity(item.variant_id, quantity)
                        }
                        label={item.product_name}
                        compact
                      />
                    </div>
                  </div>

                  <div className="c-drawer__item-right">
                    <div className="c-drawer__item-total">
                      {formatPrice(item.price * item.quantity)}
                    </div>
                    <button
                      type="button"
                      className="c-drawer__item-remove"
                      onClick={() => removeItem(item.variant_id)}
                      aria-label={t('common.removeItem')}
                    >
                      <Trash2 size={14} aria-hidden="true" />
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
              <span>{t('common.subtotal')}</span>
              <span className="c-drawer__subtotal-value">
                {formatPrice(subtotal)}
              </span>
            </div>
            <p className="c-drawer__note">{t('cart.deliveryNote')}</p>
            <div className="c-drawer__actions">
              <button
                type="button"
                className="c-btn c-btn--primary c-btn--block"
                onClick={handleCheckout}
              >
                {t('cart.checkout')}
                <ArrowRight size={16} aria-hidden="true" />
              </button>
              <button
                type="button"
                className="c-btn c-btn--outline c-btn--block"
                onClick={handleViewCart}
              >
                {t('cart.viewCart')}
              </button>
              <button
                type="button"
                className="c-btn c-btn--ghost c-btn--block"
                onClick={closeDrawer}
              >
                {t('cart.continueShopping')}
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  )
}
