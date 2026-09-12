import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Phone,
  MapPin,
  MessageSquare,
  User,
  Package,
  ImageIcon,
  Check,
  X,
  Clock,
  CheckCircle2,
  XCircle,
  Copy,
  ShoppingBag,
  Truck,
  Pencil,
  Trash2,
} from 'lucide-react'
import {
  useOrder,
  useUpdateOrderStatus,
  useUpdateOrderDeliveryFee,
  useDeleteOrder,
} from '../../../hooks/useOrders'
import {
  formatPrice,
  formatDateTime,
  orderStatusLabel,
  orderStatusVariant,
} from '../../../utils/format'
import { useWilayas } from '../../../hooks/useWilayas'
import type { OrderStatus } from '../../../types'
import toast from 'react-hot-toast'
import './OrderDetail.css'

export function OrderDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: order, isLoading, error } = useOrder(id)
  const { data: wilayas = [] } = useWilayas()
  const updateStatus = useUpdateOrderStatus()
  const updateDeliveryFee = useUpdateOrderDeliveryFee()
  const deleteOrder = useDeleteOrder()

  const [confirmAction, setConfirmAction] = useState<{
    status: OrderStatus
    label: string
    variant: 'primary' | 'danger' | 'success'
  } | null>(null)

  // Delivery fee edit state
  const [isEditingFee, setIsEditingFee] = useState(false)
  const [feeInput, setFeeInput] = useState('')

  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  if (isLoading) {
    return <div className="order-detail__loading">Loading order...</div>
  }

  if (error || !order) {
    return (
      <div className="admin-card" style={{ padding: 32, textAlign: 'center' }}>
        <p style={{ color: 'var(--admin-red)' }}>
          {error ? (error as Error).message : 'Order not found'}
        </p>
        <button
          className="admin-btn admin-btn--secondary"
          onClick={() => navigate('/admin/orders')}
          style={{ marginTop: 16 }}
        >
          Back to orders
        </button>
      </div>
    )
  }

  const wilaya = wilayas.find((w) => w.id === order.wilaya_id)
  const canEditFee = order.status === 'PENDING'
  const canDelete = order.status === 'CANCELLED'

  // ============================================
  // Action helpers
  // ============================================
  const handleAction = (
    status: OrderStatus,
    label: string,
    variant: 'primary' | 'danger' | 'success'
  ) => {
    setConfirmAction({ status, label, variant })
  }

  const handleConfirm = async () => {
    if (!confirmAction || !order) return
    await updateStatus.mutateAsync({ id: order.id, status: confirmAction.status })
    setConfirmAction(null)
  }

  const handleDelete = async () => {
    if (!order) return
    await deleteOrder.mutateAsync(order.id)
    navigate('/admin/orders')
  }

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(order.customer_phone)
    toast.success('Phone number copied')
  }

  // ============================================
  // Delivery fee editing
  // ============================================
  const startEditingFee = () => {
    setFeeInput(String(order.delivery_fee))
    setIsEditingFee(true)
  }

  const cancelEditingFee = () => {
    setIsEditingFee(false)
    setFeeInput('')
  }

  const saveFee = async () => {
    const value = Number(feeInput)
    if (isNaN(value) || value < 0) {
      toast.error('Enter a valid amount (0 or more)')
      return
    }
    await updateDeliveryFee.mutateAsync({
      id: order.id,
      delivery_fee: value,
    })
    setIsEditingFee(false)
    setFeeInput('')
  }

  const setFreeDelivery = async () => {
    await updateDeliveryFee.mutateAsync({
      id: order.id,
      delivery_fee: 0,
    })
  }

  // ============================================
  // Available actions by status
  // ============================================
  const actions: Array<{
    status: OrderStatus
    label: string
    icon: React.ReactNode
    variant: 'primary' | 'danger' | 'success'
  }> = []

  if (order.status === 'PENDING') {
    actions.push({
      status: 'ACCEPTED_PENDING',
      label: 'Accept Order',
      icon: <Check size={16} />,
      variant: 'primary',
    })
    actions.push({
      status: 'CANCELLED',
      label: 'Cancel Order',
      icon: <X size={16} />,
      variant: 'danger',
    })
  } else if (order.status === 'ACCEPTED_PENDING') {
    actions.push({
      status: 'DONE',
      label: 'Mark as Done',
      icon: <Check size={16} />,
      variant: 'success',
    })
    actions.push({
      status: 'CANCELLED',
      label: 'Cancel Order',
      icon: <X size={16} />,
      variant: 'danger',
    })
  }

  return (
    <div className="order-detail">
      {/* ==============================
          Header
      ============================== */}
      <div className="order-detail__header">
        <button
          className="order-detail__back"
          onClick={() => navigate('/admin/orders')}
        >
          <ArrowLeft size={18} />
          <span>Back</span>
        </button>

        <div className="order-detail__title-wrap">
          <div className="order-detail__title-row">
            <h1 className="order-detail__title">{order.order_number}</h1>
            <span
              className={`admin-badge admin-badge--${orderStatusVariant(
                order.status
              )}`}
            >
              <span className="admin-badge__dot" />
              {orderStatusLabel(order.status)}
            </span>
          </div>
          <p className="order-detail__subtitle">
            Placed on {formatDateTime(order.created_at)}
          </p>
        </div>

        {(actions.length > 0 || canDelete) && (
          <div className="order-detail__header-actions">
            {actions.map((action) => (
              <button
                key={action.status}
                className={`admin-btn admin-btn--${action.variant}`}
                onClick={() =>
                  handleAction(action.status, action.label, action.variant)
                }
                disabled={updateStatus.isPending}
              >
                {action.icon}
                {action.label}
              </button>
            ))}

            {canDelete && (
              <button
                className="admin-btn admin-btn--danger-outline"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={deleteOrder.isPending}
              >
                <Trash2 size={16} />
                Delete Order
              </button>
            )}
          </div>
        )}
      </div>

      {/* ==============================
          Main grid
      ============================== */}
      <div className="order-detail__grid">
        {/* Left column: items + totals */}
        <div className="order-detail__main">
          {/* Items card */}
          <div className="admin-card order-detail__card">
            <h2 className="order-detail__section-title">
              Order Items ({order.order_items.length})
            </h2>

            {order.order_items.length === 0 ? (
              <div className="order-detail__empty">
                <Package size={32} />
                <p>No items in this order</p>
              </div>
            ) : (
              <div className="order-detail__items">
                {order.order_items.map((item) => {
                  const variantLabel = [
                    item.variant?.size,
                    item.variant?.color,
                  ]
                    .filter(Boolean)
                    .join(' / ')

                  return (
                    <div key={item.id} className="order-detail__item">
                      <div className="order-detail__item-image">
                        {item.product?.image_url ? (
                          <img
                            src={item.product.image_url}
                            alt={item.product_name}
                          />
                        ) : (
                          <ImageIcon size={20} />
                        )}
                      </div>

                      <div className="order-detail__item-body">
                        <div className="order-detail__item-name">
                          {item.product_name}
                        </div>
                        {variantLabel && (
                          <div className="order-detail__item-variant">
                            {variantLabel}
                          </div>
                        )}
                        {item.variant?.sku && (
                          <div className="order-detail__item-sku">
                            SKU: {item.variant.sku}
                          </div>
                        )}
                      </div>

                      <div className="order-detail__item-qty">
                        <span className="order-detail__item-qty-label">Qty</span>
                        <span className="order-detail__item-qty-value">
                          {item.quantity}
                        </span>
                      </div>

                      <div className="order-detail__item-price">
                        <div className="order-detail__item-unit">
                          {formatPrice(item.price)} × {item.quantity}
                        </div>
                        <div className="order-detail__item-total">
                          {formatPrice(item.price * item.quantity)}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Totals card */}
          <div className="admin-card order-detail__card">
            <h2 className="order-detail__section-title">Totals</h2>
            <div className="order-detail__totals">
              <div className="order-detail__total-row">
                <span>Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>

              {/* Delivery fee row with editor */}
              <div className="order-detail__total-row order-detail__total-row--fee">
                <span>
                  <Truck size={14} className="order-detail__total-icon" />
                  Delivery Fee
                </span>

                {isEditingFee ? (
                  <div className="order-detail__fee-editor">
                    <input
                      type="number"
                      min="0"
                      step="50"
                      className="order-detail__fee-input"
                      value={feeInput}
                      onChange={(e) => setFeeInput(e.target.value)}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveFee()
                        if (e.key === 'Escape') cancelEditingFee()
                      }}
                    />
                    <button
                      className="order-detail__fee-btn order-detail__fee-btn--save"
                      onClick={saveFee}
                      disabled={updateDeliveryFee.isPending}
                      title="Save"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      className="order-detail__fee-btn order-detail__fee-btn--cancel"
                      onClick={cancelEditingFee}
                      title="Cancel"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="order-detail__fee-display">
                    <span>{formatPrice(order.delivery_fee)}</span>
                    {canEditFee && (
                      <>
                        <button
                          className="order-detail__fee-edit"
                          onClick={startEditingFee}
                          title="Edit delivery fee"
                        >
                          <Pencil size={13} />
                        </button>
                        {order.delivery_fee > 0 && (
                          <button
                            className="order-detail__fee-free"
                            onClick={setFreeDelivery}
                            disabled={updateDeliveryFee.isPending}
                            title="Set as free delivery"
                          >
                            Free
                          </button>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="order-detail__total-row order-detail__total-row--grand">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>

              {canEditFee && !isEditingFee && (
                <div className="order-detail__fee-hint">
                  Delivery fee can be edited while the order is pending.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right column: customer info + timeline */}
        <div className="order-detail__sidebar">
          {/* Customer card */}
          <div className="admin-card order-detail__card">
            <h2 className="order-detail__section-title">Customer</h2>

            <div className="order-detail__customer">
              <div className="order-detail__customer-row">
                <div className="order-detail__customer-icon">
                  <User size={16} />
                </div>
                <div className="order-detail__customer-content">
                  <div className="order-detail__customer-label">Name</div>
                  <div className="order-detail__customer-value">
                    {order.customer_name}
                  </div>
                </div>
              </div>

              <div className="order-detail__customer-row">
                <div className="order-detail__customer-icon">
                  <Phone size={16} />
                </div>
                <div className="order-detail__customer-content">
                  <div className="order-detail__customer-label">Phone</div>
                  <div className="order-detail__customer-value order-detail__customer-value--phone">
                    <a href={`tel:${order.customer_phone}`}>
                      {order.customer_phone}
                    </a>
                    <button
                      className="order-detail__copy"
                      onClick={handleCopyPhone}
                      title="Copy phone"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="order-detail__customer-row">
                <div className="order-detail__customer-icon">
                  <MapPin size={16} />
                </div>
                <div className="order-detail__customer-content">
                  <div className="order-detail__customer-label">
                    Wilaya / Commune
                  </div>
                  <div className="order-detail__customer-value">
                    {wilaya ? `${wilaya.code} — ${wilaya.name}` : '—'}
                    {order.commune && (
                      <>
                        <br />
                        <span className="order-detail__commune">
                          {order.commune.name}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="order-detail__customer-row">
                <div className="order-detail__customer-icon">
                  <MapPin size={16} />
                </div>
                <div className="order-detail__customer-content">
                  <div className="order-detail__customer-label">Address</div>
                  <div className="order-detail__customer-value">
                    {order.address}
                  </div>
                </div>
              </div>

              {order.note && (
                <div className="order-detail__customer-row">
                  <div className="order-detail__customer-icon">
                    <MessageSquare size={16} />
                  </div>
                  <div className="order-detail__customer-content">
                    <div className="order-detail__customer-label">Note</div>
                    <div className="order-detail__customer-value order-detail__note">
                      {order.note}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Timeline card */}
          <div className="admin-card order-detail__card">
            <h2 className="order-detail__section-title">Status Timeline</h2>
            <ol className="order-detail__timeline">
              <TimelineStep
                label="Order placed"
                time={order.created_at}
                done
                active={order.status === 'PENDING'}
                icon={<ShoppingBag size={14} />}
              />
              <TimelineStep
                label="Accepted"
                done={
                  order.status === 'ACCEPTED_PENDING' ||
                  order.status === 'DONE'
                }
                active={order.status === 'ACCEPTED_PENDING'}
                icon={<Clock size={14} />}
              />
              <TimelineStep
                label="Completed"
                done={order.status === 'DONE'}
                active={false}
                icon={<CheckCircle2 size={14} />}
              />
              {order.status === 'CANCELLED' && (
                <TimelineStep
                  label="Cancelled"
                  done
                  active
                  danger
                  icon={<XCircle size={14} />}
                />
              )}
            </ol>
            <div className="order-detail__timeline-updated">
              Last updated {formatDateTime(order.updated_at)}
            </div>
          </div>
        </div>
      </div>

      {/* ==============================
          Confirm modal
      ============================== */}
      {confirmAction && (
        <div
          className="order-detail__modal-backdrop"
          onClick={() => setConfirmAction(null)}
        >
          <div
            className="order-detail__modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="order-detail__modal-header">
              <h3 className="order-detail__modal-title">Confirm action</h3>
            </div>
            <div className="order-detail__modal-body">
              <p>
                Are you sure you want to{' '}
                <strong>{confirmAction.label.toLowerCase()}</strong> for{' '}
                <strong>{order.order_number}</strong>?
              </p>
              {confirmAction.status === 'CANCELLED' && (
                <p className="order-detail__modal-warn">
                  Cancelling is final and cannot be undone.
                </p>
              )}
            </div>
            <div className="order-detail__modal-footer">
              <button
                className="admin-btn admin-btn--secondary"
                onClick={() => setConfirmAction(null)}
                disabled={updateStatus.isPending}
              >
                Cancel
              </button>
              <button
                className={`admin-btn admin-btn--${confirmAction.variant}`}
                onClick={handleConfirm}
                disabled={updateStatus.isPending}
              >
                {updateStatus.isPending ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==============================
          Delete confirmation modal
      ============================== */}
      {showDeleteConfirm && (
        <div
          className="order-detail__modal-backdrop"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="order-detail__modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="order-detail__modal-header">
              <h3 className="order-detail__modal-title">Delete Order</h3>
            </div>
            <div className="order-detail__modal-body">
              <p>
                Are you sure you want to permanently delete{' '}
                <strong>{order.order_number}</strong>?
              </p>
              <p className="order-detail__modal-warn">
                This action cannot be undone. All order items will also be
                removed.
              </p>
            </div>
            <div className="order-detail__modal-footer">
              <button
                className="admin-btn admin-btn--secondary"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleteOrder.isPending}
              >
                Cancel
              </button>
              <button
                className="admin-btn admin-btn--danger"
                onClick={handleDelete}
                disabled={deleteOrder.isPending}
              >
                {deleteOrder.isPending ? 'Deleting...' : 'Delete permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ============================================
   Timeline step
   ============================================ */
interface TimelineStepProps {
  label: string
  time?: string
  done: boolean
  active: boolean
  danger?: boolean
  icon: React.ReactNode
}

function TimelineStep({
  label,
  time,
  done,
  active,
  danger,
  icon,
}: TimelineStepProps) {
  const cls = [
    'order-detail__step',
    done ? 'order-detail__step--done' : '',
    active ? 'order-detail__step--active' : '',
    danger ? 'order-detail__step--danger' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <li className={cls}>
      <div className="order-detail__step-marker">{icon}</div>
      <div className="order-detail__step-body">
        <div className="order-detail__step-label">{label}</div>
        {time && (
          <div className="order-detail__step-time">{formatDateTime(time)}</div>
        )}
      </div>
    </li>
  )
}