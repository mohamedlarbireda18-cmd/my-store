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
import { formatPrice, formatDateTime } from '../../../utils/format'
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
  order_items: ConfirmationItem[]
}

export function OrderConfirmation() {
  const { orderNumber } = useParams<{ orderNumber: string }>()

  const { data: order, isLoading, error } = useQuery({
    queryKey: ['order-confirmation', orderNumber],
    queryFn: async (): Promise<ConfirmationOrder | null> => {
      if (!orderNumber) return null

      const { data, error } = await supabase
        .from('orders')
        .select(`
          order_number,
          customer_name,
          customer_phone,
          address,
          note,
          delivery_mode,
          delivery_fee,
          subtotal,
          total,
          status,
          created_at,
          wilaya:wilayas(code, name),
          commune:communes(name),
          university:universities(name),
          order_items(id, product_name, variant_description, price, quantity)
        `)
        .eq('order_number', orderNumber)
        .single()

      if (error) return null
      return data as unknown as ConfirmationOrder
    },
    enabled: !!orderNumber,
  })

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
            <h2>Order not found</h2>
            <p>
              We couldn't find an order with the number{' '}
              <strong>{orderNumber}</strong>.
            </p>
            <Link to="/products" className="c-btn c-btn--primary">
              Continue shopping
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const deliveryLabel =
    order.delivery_mode === 'home'
      ? 'Home delivery'
      : order.delivery_mode === 'desk'
      ? 'Stop desk'
      : 'University delivery'

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
            Thank you for your order!
          </h1>
          <p className="c-order-confirm__hero-desc">
            Your order has been received successfully.
          </p>

          <div className="c-order-confirm__order-number">
            <span className="c-order-confirm__order-number-label">
              Order number
            </span>
            <span className="c-order-confirm__order-number-value">
              {order.order_number}
            </span>
          </div>

          <p className="c-order-confirm__hero-note">
            We will contact you as soon as possible to confirm your order and
            arrange the delivery.
          </p>
        </div>

        {/* Details grid */}
        <div className="c-order-confirm__grid">
          {/* Items card */}
          <div className="c-order-confirm__card">
            <h2 className="c-order-confirm__card-title">
              Order items ({order.order_items.length})
            </h2>
            <ul className="c-order-confirm__items">
              {order.order_items.map((item) => (
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
                <span>Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="c-order-confirm__total-row">
                <span>Delivery fee</span>
                <span>
                  {order.delivery_fee === 0
                    ? 'Free'
                    : formatPrice(order.delivery_fee)}
                </span>
              </div>
              <div className="c-order-confirm__total-row c-order-confirm__total-row--grand">
                <span>Total</span>
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
                    Contact
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
                      University
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
                      Delivery address
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
                    <div className="c-order-confirm__detail-label">Note</div>
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
                    Placed on
                  </div>
                  <div className="c-order-confirm__detail-value">
                    {formatDateTime(order.created_at)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="c-order-confirm__actions">
          <Link to="/products" className="c-btn c-btn--primary c-btn--lg">
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
  )
}