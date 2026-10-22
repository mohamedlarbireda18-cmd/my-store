import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  CheckCircle2,
  Package,
  Truck,
  Store,
  GraduationCap,
  Phone,
  MapPin,
  Clock,
} from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { useLanguage } from '../../../i18n/LanguageContext'
import { formatPrice, formatDateTime } from '../../../utils/format'
import {
  forgetRememberedOrderPhone,
  getRememberedOrderPhone,
  rememberOrderPhone,
} from '../../utils/orderAccess'
import './OrderConfirmation.css'

interface ConfirmationItem {
  id: string
  product_name: string
  variant_description: string
  price: number
  quantity: number
}

interface ConfirmationOrder {
  order_number: string
  customer_name: string
  customer_phone: string
  address: string
  note: string | null
  delivery_mode: 'home' | 'desk' | 'university'
  delivery_fee: number
  subtotal: number
  total: number
  status: string
  created_at: string
  wilaya: { code: string; name: string } | null
  commune: { name: string } | null
  university: { name: string } | null
  items: ConfirmationItem[]
}

const PHONE_PATTERN = /^0[567][0-9]{8}$/

export function OrderConfirmation() {
  const { orderNumber } = useParams<{ orderNumber: string }>()
  const { language, t } = useLanguage()
  const [verifiedPhone, setVerifiedPhone] = useState(() =>
    orderNumber ? getRememberedOrderPhone(orderNumber) : ''
  )
  const [phoneInput, setPhoneInput] = useState('')
  const [phoneError, setPhoneError] = useState('')

  const { data: order, isLoading, error } = useQuery({
    queryKey: ['order-confirmation', orderNumber, verifiedPhone],
    queryFn: async (): Promise<ConfirmationOrder | null> => {
      if (!orderNumber || !verifiedPhone) return null

      const { data, error: rpcError } = await supabase.rpc(
        'get_order_confirmation',
        {
          p_order_number: orderNumber,
          p_phone: verifiedPhone,
        }
      )

      if (rpcError) throw rpcError
      return (data as ConfirmationOrder | null) ?? null
    },
    enabled: Boolean(orderNumber && verifiedPhone),
    retry: false,
  })

  useEffect(() => {
    if (order && orderNumber) {
      rememberOrderPhone(orderNumber, verifiedPhone)
    }
  }, [order, orderNumber, verifiedPhone])

  const handleVerifyPhone = (event: React.FormEvent) => {
    event.preventDefault()
    const normalized = phoneInput.replace(/[\s-]/g, '')

    if (!PHONE_PATTERN.test(normalized)) {
      setPhoneError(t('form.errors.invalidPhone'))
      return
    }

    setPhoneError('')
    setVerifiedPhone(normalized)
  }

  const handleTryAnotherPhone = () => {
    if (orderNumber) forgetRememberedOrderPhone(orderNumber)
    setPhoneInput('')
    setPhoneError('')
    setVerifiedPhone('')
  }

  if (!orderNumber) {
    return (
      <div className="c-order-confirm">
        <div className="c-container">
          <div className="c-order-confirm__not-found">
            <Package size={48} />
            <h1>{t('confirmation.notFoundTitle')}</h1>
            <Link to="/products" className="c-btn c-btn--primary">
              {t('confirmation.continueShopping')}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!verifiedPhone) {
    return (
      <div className="c-order-confirm">
        <div className="c-container">
          <div className="c-order-confirm__verify">
            <div className="c-order-confirm__verify-icon">
              <Phone size={32} />
            </div>
            <h1>{t('confirmation.verifyTitle')}</h1>
            <p>{t('confirmation.verifyDesc')}</p>
            <div className="c-order-confirm__verify-order">
              {t('confirmation.orderNumber')}:{' '}
              <strong>{orderNumber}</strong>
            </div>
            <form
              className="c-order-confirm__verify-form"
              onSubmit={handleVerifyPhone}
            >
              <label htmlFor="confirmation-phone">{t('form.phone')}</label>
              <input
                id="confirmation-phone"
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder={t('form.phonePlaceholder')}
                value={phoneInput}
                onChange={(event) => setPhoneInput(event.target.value)}
                maxLength={20}
                aria-invalid={Boolean(phoneError)}
                aria-describedby={
                  phoneError ? 'confirmation-phone-error' : undefined
                }
              />
              {phoneError && (
                <p id="confirmation-phone-error" role="alert">
                  {phoneError}
                </p>
              )}
              <button
                type="submit"
                className="c-btn c-btn--primary c-btn--lg c-btn--block"
              >
                {t('confirmation.verifyButton')}
              </button>
            </form>
            <Link to="/products" className="c-order-confirm__verify-link">
              {t('confirmation.continueShopping')}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="c-order-confirm">
        <div className="c-container">
          <div className="c-order-confirm__skeleton c-skeleton" />
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="c-order-confirm">
        <div className="c-container">
          <div className="c-order-confirm__not-found">
            <Package size={48} />
            <h1>{t('confirmation.notFoundTitle')}</h1>
            <p>
              {t('confirmation.notFoundDesc', {
                orderNumber: orderNumber ?? '',
              })}
            </p>
            <div className="c-order-confirm__not-found-actions">
              <button
                type="button"
                className="c-btn c-btn--secondary"
                onClick={handleTryAnotherPhone}
              >
                {t('confirmation.tryAnotherPhone')}
              </button>
              <Link to="/products" className="c-btn c-btn--primary">
                {t('confirmation.continueShopping')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const deliveryLabel =
    order.delivery_mode === 'home'
      ? t('confirmation.deliveryHome')
      : order.delivery_mode === 'desk'
      ? t('confirmation.deliveryDesk')
      : t('confirmation.deliveryUniversity')

  const DeliveryIcon =
    order.delivery_mode === 'home'
      ? Truck
      : order.delivery_mode === 'desk'
      ? Store
      : GraduationCap

  return (
    <div className="c-order-confirm">
      <div className="c-container">
        {/* Success hero */}
        <div className="c-order-confirm__hero">
          <div className="c-order-confirm__hero-icon">
            <CheckCircle2 size={56} />
          </div>
          <h1 className="c-order-confirm__hero-title">
            {t('confirmation.thankyouTitle')}
          </h1>
          <p className="c-order-confirm__hero-desc">
            {t('confirmation.thankyouDesc')}
          </p>

          <div className="c-order-confirm__order-number">
            <span className="c-order-confirm__order-number-label">
              {t('confirmation.orderNumber')}
            </span>
            <span className="c-order-confirm__order-number-value">
              {order.order_number}
            </span>
          </div>

          <p className="c-order-confirm__hero-note">
            {t('confirmation.note')}
          </p>
        </div>

        {/* Details grid */}
        <div className="c-order-confirm__grid">
          {/* Items card */}
          <div className="c-order-confirm__card">
            <h2 className="c-order-confirm__card-title">
              {t('confirmation.items', {
                count: order.items.length,
              })}
            </h2>
            <ul className="c-order-confirm__items">
              {order.items.map((item) => (
                <li key={item.id} className="c-order-confirm__item">
                  <div className="c-order-confirm__item-info">
                    <div className="c-order-confirm__item-name">
                      {item.product_name}
                    </div>
                    {item.variant_description && (
                      <div className="c-order-confirm__item-variant">
                        {item.variant_description}
                      </div>
                    )}
                  </div>
                  <div className="c-order-confirm__item-qty">
                    × {item.quantity}
                  </div>
                  <div className="c-order-confirm__item-total">
                    {formatPrice(item.price * item.quantity)}
                  </div>
                </li>
              ))}
            </ul>

            <div className="c-order-confirm__totals">
              <div className="c-order-confirm__total-row">
                <span>{t('confirmation.subtotal')}</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="c-order-confirm__total-row">
                <span>{t('confirmation.deliveryFee')}</span>
                <span>
                  {order.delivery_fee === 0
                    ? t('confirmation.free')
                    : formatPrice(order.delivery_fee)}
                </span>
              </div>
              <div className="c-order-confirm__total-row c-order-confirm__total-row--grand">
                <span>{t('confirmation.total')}</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Delivery + customer card */}
          <div className="c-order-confirm__card">
            <h2 className="c-order-confirm__card-title">
              <DeliveryIcon size={16} />
              {deliveryLabel}
            </h2>

            <div className="c-order-confirm__detail-list">
              {/* Customer */}
              <div className="c-order-confirm__detail">
                <div className="c-order-confirm__detail-icon">
                  <Phone size={14} />
                </div>
                <div>
                  <div className="c-order-confirm__detail-label">
                    {t('confirmation.contact')}
                  </div>
                  <div className="c-order-confirm__detail-value">
                    {order.customer_name}
                    <br />
                    <a href={`tel:${order.customer_phone}`}>
                      {order.customer_phone}
                    </a>
                  </div>
                </div>
              </div>

              {/* Address */}
              {order.delivery_mode === 'university' && order.university ? (
                <div className="c-order-confirm__detail">
                  <div className="c-order-confirm__detail-icon">
                    <GraduationCap size={14} />
                  </div>
                  <div>
                    <div className="c-order-confirm__detail-label">
                      {t('confirmation.university')}
                    </div>
                    <div className="c-order-confirm__detail-value">
                      {order.university.name}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="c-order-confirm__detail">
                  <div className="c-order-confirm__detail-icon">
                    <MapPin size={14} />
                  </div>
                  <div>
                    <div className="c-order-confirm__detail-label">
                      {t('confirmation.deliveryAddress')}
                    </div>
                    <div className="c-order-confirm__detail-value">
                      {order.wilaya && order.commune && (
                        <>
                          {order.wilaya.code} — {order.wilaya.name}
                          <br />
                          {order.commune.name}
                          <br />
                        </>
                      )}
                      {order.address}
                    </div>
                  </div>
                </div>
              )}

              {/* Note */}
              {order.note && (
                <div className="c-order-confirm__detail">
                  <div className="c-order-confirm__detail-icon">
                    <Package size={14} />
                  </div>
                  <div>
                    <div className="c-order-confirm__detail-label">
                      {t('confirmation.noteLabel')}
                    </div>
                    <div className="c-order-confirm__detail-value">
                      {order.note}
                    </div>
                  </div>
                </div>
              )}

              {/* Placed at */}
              <div className="c-order-confirm__detail">
                <div className="c-order-confirm__detail-icon">
                  <Clock size={14} />
                </div>
                <div>
                  <div className="c-order-confirm__detail-label">
                    {t('confirmation.placedOn')}
                  </div>
                  <div className="c-order-confirm__detail-value">
                    {formatDateTime(order.created_at, language)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="c-order-confirm__actions">
          <Link to="/products" className="c-btn c-btn--primary c-btn--lg">
            {t('confirmation.continueShopping')}
          </Link>
        </div>
      </div>
    </div>
  )
}