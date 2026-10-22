import { Minus, Plus } from 'lucide-react'
import { useLanguage } from '../../../i18n/LanguageContext'
import './QuantityControl.css'

interface QuantityControlProps {
  value: number
  max: number
  onChange: (value: number) => void
  label?: string
  compact?: boolean
}

export function QuantityControl({
  value,
  max,
  onChange,
  label,
  compact = false,
}: QuantityControlProps) {
  const { t } = useLanguage()
  const canDecrease = value > 1
  const canIncrease = value < max
  const labelText = label
    ? `${t('common.quantity')}: ${label}`
    : t('common.quantity')

  return (
    <div
      className={`c-qty ${compact ? 'c-qty--compact' : ''}`}
      role="group"
      aria-label={labelText}
    >
      <button
        type="button"
        className="c-qty__btn"
        onClick={() => onChange(Math.max(1, value - 1))}
        disabled={!canDecrease}
        aria-label={t('common.decreaseQuantity')}
      >
        <Minus size={14} aria-hidden="true" />
      </button>
      <span className="c-qty__value" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        className="c-qty__btn"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={!canIncrease}
        aria-label={t('common.increaseQuantity')}
      >
        <Plus size={14} aria-hidden="true" />
      </button>
    </div>
  )
}
