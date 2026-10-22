import { useEffect, useMemo, useState } from 'react'
import { MapPin, Truck, Store, GraduationCap, AlertCircle } from 'lucide-react'
import { useWilayas } from '../../../hooks/useWilayas'
import { useCommunes } from '../../hooks/useCommunes'
import { useUniversities } from '../../hooks/useUniversities'
import { useCreateOrder } from '../../hooks/useCreateOrder'
import { useLanguage } from '../../../i18n/LanguageContext'
import { formatPrice } from '../../../utils/format'
import { rememberOrderPhone } from '../../utils/orderAccess'
import { QuantityControl } from '../QuantityControl/QuantityControl'
import type { DeliveryMode } from '../../../types'
import toast from 'react-hot-toast'
import './OrderForm.css'

interface OrderFormProps {
  variantId: string
  unitPrice: number
  maxStock: number
  quantity: number
  onQuantityChange: (quantity: number) => void
  onSuccess: (orderNumber: string) => void
}

export function OrderForm({
  variantId,
  unitPrice,
  maxStock,
  quantity,
  onQuantityChange,
  onSuccess,
}: OrderFormProps) {
  const { t } = useLanguage()
  const { data: wilayas = [] } = useWilayas()
  const { data: universities = [] } = useUniversities()
  const createOrder = useCreateOrder()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [wilayaId, setWilayaId] = useState('')
  const [communeId, setCommuneId] = useState('')
  const [address, setAddress] = useState('')
  const [note, setNote] = useState('')
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>('home')
  const [universityId, setUniversityId] = useState('')
  const [idempotencyKey, setIdempotencyKey] = useState(() =>
    crypto.randomUUID()
  )

  const isUniversity = deliveryMode === 'university'

  const algerWilaya = useMemo(
    () => wilayas.find((w) => w.code === '16'),
    [wilayas]
  )

  const { data: communes = [], isLoading: loadingCommunes } = useCommunes(
    isUniversity ? algerWilaya?.id ?? null : wilayaId || null
  )

  const wilaya = useMemo(
    () => wilayas.find((w) => w.id === wilayaId),
    [wilayas, wilayaId]
  )

  const deliveryFee = useMemo(() => {
    if (isUniversity) return 0
    if (!wilaya) return 0
    if (deliveryMode === 'desk') {
      return Number(wilaya.delivery_fee_desk ?? 0)
    }
    return Number(wilaya.delivery_fee_home ?? 0)
  }, [wilaya, deliveryMode, isUniversity])

  const deskAvailable =
    !!wilaya && Number(wilaya.delivery_fee_desk ?? 0) > 0

  useEffect(() => {
    setCommuneId('')
  }, [wilayaId])

  useEffect(() => {
    if (deliveryMode === 'desk' && wilaya && !deskAvailable) {
      setDeliveryMode('home')
    }
  }, [wilaya, deliveryMode, deskAvailable])

  const subtotal = unitPrice * quantity
  const total = subtotal + deliveryFee

  const validate = (): string | null => {
    if (!firstName.trim()) return t('form.errors.firstNameRequired')
    if (!lastName.trim()) return t('form.errors.lastNameRequired')
    if (!phone.trim()) return t('form.errors.phoneRequired')

    const phoneRegex = /^(0)(5|6|7)[0-9]{8}$/
    if (!phoneRegex.test(phone.trim())) {
      return t('form.errors.invalidPhone')
    }

    if (isUniversity) {
      if (!universityId) return t('form.errors.selectUniversity')
    } else {
      if (!wilayaId) return t('form.errors.selectWilaya')
      if (!communeId) return t('form.errors.selectCommune')
      if (!address.trim()) return t('form.errors.addressRequired')
    }

    if (maxStock < 1) return t('form.errors.outOfStock')
    if (quantity > maxStock) {
      return t('cart.onlyInStock', { count: maxStock })
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const error = validate()
    if (error) {
      toast.error(error)
      return
    }

    let finalWilayaId = wilayaId
    let finalCommuneId = communeId
    let finalAddress = address.trim()

    if (isUniversity) {
      finalWilayaId = algerWilaya?.id ?? wilayaId
      finalCommuneId = communes[0]?.id ?? ''
      const uni = universities.find((u) => u.id === universityId)
      finalAddress = `University: ${uni?.name ?? t('common.notAvailable')}`
    }

    if (!finalWilayaId || !finalCommuneId) {
      toast.error(t('form.errors.selectCommune'))
      return
    }

    try {
      const result = await createOrder.mutateAsync({
        customer_name: `${firstName.trim()} ${lastName.trim()}`,
        customer_phone: phone.trim(),
        wilaya_id: finalWilayaId,
        commune_id: finalCommuneId,
        address: finalAddress,
        note: note.trim() || undefined,
        delivery_mode: deliveryMode,
        university_id: isUniversity ? universityId : undefined,
        idempotency_key: idempotencyKey,
        items: [{ variant_id: variantId, quantity }],
      })

      rememberOrderPhone(
        result.order.order_number,
        result.order.customer_phone || phone.trim()
      )
      setIdempotencyKey(crypto.randomUUID())
      onSuccess(result.order.order_number)
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t('form.errors.orderFailed')
      )
    }
  }

  return (
    <form className="c-order-form" onSubmit={handleSubmit}>
      <h2 className="c-order-form__title">{t('order.title')}</h2>
      <p className="c-order-form__subtitle">{t('order.subtitle')}</p>

      <div className="c-order-form__row">
        <div className="c-order-form__field">
          <label className="c-order-form__label" htmlFor="order-first-name">
            {t('form.firstName')} <span aria-hidden="true">*</span>
          </label>
          <input
            id="order-first-name"
            name="firstName"
            type="text"
            className="c-order-form__input"
            placeholder={t('form.firstNamePlaceholder')}
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            autoComplete="given-name"
            aria-required="true"
          />
        </div>
        <div className="c-order-form__field">
          <label className="c-order-form__label" htmlFor="order-last-name">
            {t('form.lastName')} <span aria-hidden="true">*</span>
          </label>
          <input
            id="order-last-name"
            name="lastName"
            type="text"
            className="c-order-form__input"
            placeholder={t('form.lastNamePlaceholder')}
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            autoComplete="family-name"
            aria-required="true"
          />
        </div>
      </div>

      <div className="c-order-form__field">
        <label className="c-order-form__label" htmlFor="order-phone">
          {t('form.phone')} <span aria-hidden="true">*</span>
        </label>
        <input
          id="order-phone"
          name="phone"
          type="tel"
          inputMode="numeric"
          className="c-order-form__input"
          placeholder={t('form.phonePlaceholder')}
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/\s/g, ''))}
          autoComplete="tel"
          aria-required="true"
        />
      </div>

      {/* Delivery method FIRST — so the rest adapts */}
      <div className="c-order-form__field">
        <label
          className="c-order-form__label"
          id="order-delivery-label"
        >
          {t('form.deliveryMethod')}
        </label>
        <div
          className="c-order-form__delivery c-order-form__delivery--three"
          role="group"
          aria-labelledby="order-delivery-label"
        >
          <button
            type="button"
            aria-pressed={deliveryMode === 'home'}
            className={`c-order-form__delivery-option ${
              deliveryMode === 'home'
                ? 'c-order-form__delivery-option--active'
                : ''
            }`}
            onClick={() => setDeliveryMode('home')}
          >
            <Truck size={16} />
            <div>
              <div className="c-order-form__delivery-title">
                {t('form.home')}
              </div>
              {wilaya ? (
                <div className="c-order-form__delivery-fee">
                  {formatPrice(Number(wilaya.delivery_fee_home ?? 0))}
                </div>
              ) : (
                <div className="c-order-form__delivery-fee">
                  {t('form.pickWilaya')}
                </div>
              )}
            </div>
          </button>

          <button
            type="button"
            aria-pressed={deliveryMode === 'desk'}
            className={`c-order-form__delivery-option ${
              deliveryMode === 'desk'
                ? 'c-order-form__delivery-option--active'
                : ''
            } ${
              !deskAvailable ? 'c-order-form__delivery-option--disabled' : ''
            }`}
            onClick={() => deskAvailable && setDeliveryMode('desk')}
            disabled={!deskAvailable}
          >
            <Store size={16} />
            <div>
              <div className="c-order-form__delivery-title">
                {t('form.stopDesk')}
              </div>
              {wilaya ? (
                <div className="c-order-form__delivery-fee">
                  {deskAvailable
                    ? formatPrice(Number(wilaya.delivery_fee_desk ?? 0))
                    : t('form.notAvailable')}
                </div>
              ) : (
                <div className="c-order-form__delivery-fee">
                  {t('form.pickWilaya')}
                </div>
              )}
            </div>
          </button>

          <button
            type="button"
            aria-pressed={deliveryMode === 'university'}
            className={`c-order-form__delivery-option ${
              deliveryMode === 'university'
                ? 'c-order-form__delivery-option--active'
                : ''
            }`}
            onClick={() => setDeliveryMode('university')}
          >
            <GraduationCap size={16} />
            <div>
              <div className="c-order-form__delivery-title">
                {t('form.university')}
              </div>
              <div className="c-order-form__delivery-fee">{t('form.free')}</div>
            </div>
          </button>
        </div>
      </div>

      {/* UNIVERSITY: only show uni picker */}
      {isUniversity ? (
        <div className="c-order-form__field">
          <label className="c-order-form__label" htmlFor="order-university">
            <GraduationCap size={13} aria-hidden="true" />
            {t('form.chooseUniversity')}{' '}
            <span aria-hidden="true">*</span>
          </label>
          <select
            id="order-university"
            name="university"
            className="c-order-form__select"
            value={universityId}
            onChange={(e) => setUniversityId(e.target.value)}
            aria-required="true"
          >
            <option value="">{t('form.selectUniversity')}</option>
            {universities.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
          <p className="c-order-form__hint c-order-form__hint--success">
            <GraduationCap size={12} />
            {t('form.freeUniversityShipping')}
          </p>
        </div>
      ) : (
        <>
          {/* Wilaya + Commune */}
          <div className="c-order-form__row">
            <div className="c-order-form__field">
              <label className="c-order-form__label" htmlFor="order-wilaya">
                {t('form.wilaya')} <span aria-hidden="true">*</span>
              </label>
              <select
                id="order-wilaya"
                name="wilaya"
                className="c-order-form__select"
                value={wilayaId}
                onChange={(e) => setWilayaId(e.target.value)}
                aria-required="true"
              >
                <option value="">{t('form.selectWilaya')}</option>
                {wilayas.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.code} — {w.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="c-order-form__field">
              <label className="c-order-form__label" htmlFor="order-commune">
                {t('form.commune')} <span aria-hidden="true">*</span>
              </label>
              <select
                id="order-commune"
                name="commune"
                className="c-order-form__select"
                value={communeId}
                onChange={(e) => setCommuneId(e.target.value)}
                disabled={!wilayaId || loadingCommunes}
                aria-required="true"
              >
                <option value="">
                  {!wilayaId
                    ? t('form.pickWilayaFirst')
                    : loadingCommunes
                    ? t('form.loading')
                    : t('form.selectCommune')}
                </option>
                {communes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {wilaya && !deskAvailable && deliveryMode === 'desk' && (
            <p className="c-order-form__hint">
              <AlertCircle size={12} />
              {t('form.stopDeskUnavailable', { wilaya: wilaya.name })}
            </p>
          )}

          {/* Address */}
          <div className="c-order-form__field">
            <label className="c-order-form__label" htmlFor="order-address">
              <MapPin size={13} aria-hidden="true" />
              {t('form.address')} <span aria-hidden="true">*</span>
            </label>
            <textarea
              id="order-address"
              name="address"
              className="c-order-form__textarea"
              rows={2}
              placeholder={t('form.addressPlaceholder')}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              autoComplete="street-address"
              aria-required="true"
            />
          </div>
        </>
      )}

      <div className="c-order-form__field">
        <label className="c-order-form__label" htmlFor="order-note">
          {t('form.noteOptional')}
        </label>
        <textarea
          id="order-note"
          name="note"
          className="c-order-form__textarea"
          rows={2}
          placeholder={t('form.notePlaceholder')}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      <div className="c-order-form__quantity">
        <span className="c-order-form__quantity-label">
          {t('common.quantity')}
        </span>
        <QuantityControl
          value={quantity}
          max={Math.max(1, maxStock)}
          onChange={onQuantityChange}
          compact
        />
      </div>

      <div className="c-order-form__summary">
        <div className="c-order-form__summary-row">
          <span>
            {t('form.price')}
            {quantity > 1 ? ` × ${quantity}` : ''}
          </span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <div className="c-order-form__summary-row">
          <span>{t('form.deliveryFee')}</span>
          <span>
            {isUniversity
              ? t('form.free')
              : wilaya
              ? formatPrice(deliveryFee)
              : '—'}
          </span>
        </div>
        <div className="c-order-form__summary-row c-order-form__summary-row--total">
          <span>{t('form.total')}</span>
          <span>{formatPrice(total)}</span>
        </div>
      </div>

      <button
        type="submit"
        className="c-btn c-btn--primary c-btn--lg c-btn--block c-order-form__submit"
        disabled={createOrder.isPending || maxStock < 1}
      >
        {createOrder.isPending
          ? t('form.placingOrder')
          : maxStock < 1
          ? t('form.outOfStock')
          : t('form.confirmOrder')}
      </button>
    </form>
  )
}