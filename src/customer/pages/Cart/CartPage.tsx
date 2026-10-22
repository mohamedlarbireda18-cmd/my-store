import { Link } from 'react-router-dom'
import { ArrowRight, ShoppingBag, Trash2 } from 'lucide-react'
import { useCart } from '../../context/CartContext'
import { QuantityControl } from '../../components/QuantityControl/QuantityControl'
import { useLanguage } from '../../../i18n/LanguageContext'
import { formatPrice } from '../../../utils/format'
import './CartPage.css'

export function CartPage() {
  const { t } = useLanguage()
  const { items, subtotal, itemCount, updateQuantity, removeItem } = useCart()

  return (
    <div className="c-cart-page">
      <div className="c-container">
        <div className="c-cart-page__header">
          <h1 className="c-page-title">
            {t('cart.pageTitle')} {itemCount > 0 && `(${itemCount})`}
          </h1>
          <p className="c-page-subtitle">
            {items.length === 0
              ? t('cart.pageEmptySubtitle')
              : t('cart.pageReviewSubtitle')}
          </p>
        </div>

        {items.length === 0 ? (
          <div className="c-cart-page__empty">
            <div className="c-cart-page__empty-icon">
              <ShoppingBag size={36} />
            </div>
            <h3 className="c-cart-page__empty-title">
              {t('cart.emptyTitle')}
            </h3>
            <p className="c-cart-page__empty-desc">{t('cart.emptyDesc')}</p>
            <Link to="/products" className="c-btn c-btn--primary c-btn--lg">
              {t('common.browseProducts')}
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
                    aria-label={item.product_name}
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
                      {formatPrice(item.price)}
                    </div>
                    <div className="c-cart-page__item-quantity">
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

                  <div className="c-cart-page__item-right">
                    <div
                      className="c-cart-page__item-total"
                      aria-label={t('common.total')}
                    >
                      {formatPrice(item.price * item.quantity)}
                    </div>
                    <button
                      type="button"
                      className="c-cart-page__item-remove"
                      onClick={() => removeItem(item.variant_id)}
                      aria-label={t('common.removeItem')}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <aside className="c-cart-page__summary">
              <h2 className="c-cart-page__summary-title">
                {t('cart.summary')}
              </h2>

              <div className="c-cart-page__summary-row">
                <span>
                  {t('cart.subtotalItems', { count: itemCount })}
                </span>
                <span>{formatPrice(subtotal)}</span>
              </div>

              <div className="c-cart-page__summary-row c-cart-page__summary-row--muted">
                <span>{t('cart.deliveryNote')}</span>
              </div>

              <div className="c-cart-page__summary-total">
                <span>{t('common.total')}</span>
                <span>{formatPrice(subtotal)}</span>
              </div>

              <Link
                to="/checkout"
                className="c-btn c-btn--primary c-btn--lg c-btn--block c-cart-page__checkout"
              >
                {t('cart.checkout')}
                <ArrowRight size={18} />
              </Link>

              <Link
                to="/products"
                className="c-btn c-btn--ghost c-btn--block"
              >
                {t('cart.continueShopping')}
              </Link>
            </aside>
          </div>
        )}
      </div>
    </div>
  )
}