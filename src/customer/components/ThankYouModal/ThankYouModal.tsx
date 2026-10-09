import { Link, useNavigate } from 'react-router-dom'
import { CheckCircle2, X, ArrowRight } from 'lucide-react'
import './ThankYouModal.css'

interface ThankYouModalProps {
  isOpen: boolean
  orderNumber: string
  onClose: () => void
}

export function ThankYouModal({
  isOpen,
  orderNumber,
  onClose,
}: ThankYouModalProps) {
  const navigate = useNavigate()

  if (!isOpen) return null

  const handleViewOrder = () => {
    onClose()
    navigate(`/order/${orderNumber}`)
  }

  return (
    <div className="c-thankyou__backdrop" onClick={onClose}>
      <div className="c-thankyou__card" onClick={(e) => e.stopPropagation()}>
        <button
          className="c-thankyou__close"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <div className="c-thankyou__icon">
          <CheckCircle2 size={56} />
        </div>

        <h2 className="c-thankyou__title">Thank you for your order!</h2>
        <p className="c-thankyou__desc">
          Your order has been received successfully.
        </p>

        <div className="c-thankyou__order-number">
          <span className="c-thankyou__order-number-label">Order number</span>
          <span className="c-thankyou__order-number-value">{orderNumber}</span>
        </div>

        <p className="c-thankyou__note">
          We will contact you as soon as possible to confirm your order and
          arrange the delivery.
        </p>

        <div className="c-thankyou__actions">
          <button
            type="button"
            className="c-btn c-btn--primary c-btn--block"
            onClick={handleViewOrder}
          >
            View order details
            <ArrowRight size={16} />
          </button>
          <Link
            to="/products"
            className="c-btn c-btn--ghost c-btn--block"
            onClick={onClose}
          >
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
  )
}