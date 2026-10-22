import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, X } from 'lucide-react'
import { useAccessibleDialog } from '../../hooks/useAccessibleDialog'
import { useLanguage } from '../../../i18n/LanguageContext'
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
  const { t } = useLanguage()
  const modalRef = useRef<HTMLDivElement>(null)

  useAccessibleDialog(isOpen, onClose, modalRef)

  if (!isOpen) return null

  return (
    <div
      className="c-thankyou__backdrop"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={modalRef}
        className="c-thankyou__card"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="thankyou-title"
        aria-describedby="thankyou-description"
        tabIndex={-1}
      >
        <button
          type="button"
          className="c-thankyou__close"
          onClick={onClose}
          aria-label={t('common.close')}
        >
          <X size={20} aria-hidden="true" />
        </button>

        <div className="c-thankyou__icon">
          <CheckCircle2 size={56} aria-hidden="true" />
        </div>

        <h2 className="c-thankyou__title" id="thankyou-title">
          {t('thankyou.title')}
        </h2>
        <p className="c-thankyou__desc" id="thankyou-description">
          {t('thankyou.desc')}
        </p>

        <div className="c-thankyou__order-number">
          <span className="c-thankyou__order-number-label">
            {t('thankyou.orderNumber')}
          </span>
          <span className="c-thankyou__order-number-value">{orderNumber}</span>
        </div>

        <p className="c-thankyou__note">{t('thankyou.note')}</p>

        <Link
          to="/products"
          className="c-btn c-btn--primary c-btn--block"
          onClick={onClose}
        >
          {t('thankyou.continueShopping')}
        </Link>
      </div>
    </div>
  )
}
