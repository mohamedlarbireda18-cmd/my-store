import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MapPin,
  Truck,
  Store,
  GraduationCap,
  AlertCircle,
  ArrowRight,
} from 'lucide-react'
import { useWilayas } from '../../../hooks/useWilayas'
import { useCommunes } from '../../hooks/useCommunes'
import { useUniversities } from '../../hooks/useUniversities'
import { useCreateOrder } from '../../hooks/useCreateOrder'
import { useCart } from '../../context/CartContext'
import { useLanguage } from '../../../i18n/LanguageContext'
import { formatPrice } from '../../../utils/format'
import { rememberOrderPhone } from '../../utils/orderAccess'
import type { DeliveryMode } from '../../../types'
import toast from 'react-hot-toast'
import './CheckoutForm.css'

interface CheckoutFormProps {
  onSuccess: (orderNumber: string) => void
  onDeliveryChange?: (fee: number, isCalculated: boolean) => void
}

export function CheckoutForm({
  onSuccess,
  onDeliveryChange,
}: CheckoutFormProps) {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { items, subtotal, clearCart } = useCart()
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
  const [orderPlaced, setOrderPlaced] = useState(false)
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

  const total = subtotal + deliveryFee

  useEffect(() => {
    onDeliveryChange?.(deliveryFee, isUniversity || !!wilaya)
  }, [deliveryFee, isUniversity, wilaya, onDeliveryChange])

  useEffect(() => {
    setCommuneId('')
  }, [wilayaId])

  useEffect(() => {
    if (deliveryMode === 'desk' && wilaya && !deskAvailable) {
      setDeliveryMode('home')
    }
  }, [wilaya, deliveryMode, deskAvailable])

  // Redirect to cart if empty — but NOT if we just placed an order
  useEffect(() => {
    if (items.length === 0 && !orderPlaced) {
      navigate('/cart')
    }
  }, [items.length, orderPlaced, navigate])

  const validate = (): string | null => {
    if (items.length === 0) return t('form.errors.cartEmpty')
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
      const uni = universities.find((u) => u.id === universityId)
      finalAddress = `University: ${uni?.name ?? t('common.notAvailable')}`
      finalCommuneId = communes[0]?.id ?? ''
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
        items: items.map((item) => ({
          variant_id: item.variant_id,
          quantity: item.quantity,
        })),
      })

      rememberOrderPhone(
        result.order.order_number,
        result.order.customer_phone || phone.trim()
      )
      setIdempotencyKey(crypto.randomUUID())
      setOrderPlaced(true)
      clearCart()
      onSuccess(result.order.order_number)
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t('form.errors.orderFailed')
      )
    }
  }

  return (
    <form className="c-checkout-form" onSubmit={handleSubmit}>
      {/* Contact section */}
      <div className="c-checkout-form__section">
        <h2 className="c-checkout-form__section-title">
          <span className="c-checkout-form__section-number">1</span>
          {t('form.contactInfo')}
        </h2>

        <div className="c-checkout-form__row">
          <div className="c-checkout-form__field">
            <label
              className="c-checkout-form__label"
              htmlFor="checkout-first-name"
            >
              {t('form.firstName')} <span aria-hidden="true">*</span>
            </label>
            <input
              id="checkout-first-name"
              name="firstName"
              type="text"
              className="c-checkout-form__input"
              placeholder={t('form.firstNamePlaceholder')}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              autoComplete="given-name"
              aria-required="true"
            />
          </div>
          <div className="c-checkout-form__field">
            <label
              className="c-checkout-form__label"
              htmlFor="checkout-last-name"
            >
              {t('form.lastName')} <span aria-hidden="true">*</span>
            </label>
            <input
              id="checkout-last-name"
              name="lastName"
              type="text"
              className="c-checkout-form__input"
              placeholder={t('form.lastNamePlaceholder')}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              autoComplete="family-name"
              aria-required="true"
            />
          </div>
        </div>

        <div className="c-checkout-form__field">
          <label className="c-checkout-form__label" htmlFor="checkout-phone">
            {t('form.phone')} <span aria-hidden="true">*</span>
          </label>
          <input
            id="checkout-phone"
            name="phone"
            type="tel"
            inputMode="numeric"
            className="c-checkout-form__input"
            placeholder={t('form.phonePlaceholder')}
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\s/g, ''))}
            autoComplete="tel"
            aria-required="true"
          />
        </div>
      </div>

      {/* Delivery section */}
      <div className="c-checkout-form__section">
        <h2 className="c-checkout-form__section-title">
          <span className="c-checkout-form__section-number">2</span>
          {t('form.delivery')}
        </h2>

        <div className="c-checkout-form__field">
          <label
            className="c-checkout-form__label"
            id="checkout-delivery-label"
          >
            {t('form.deliveryMethod')}
          </label>
          <div
            className="c-checkout-form__delivery c-checkout-form__delivery--three"
            role="group"
            aria-labelledby="checkout-delivery-label"
          >
            <button
              type="button"
              aria-pressed={deliveryMode === 'home'}
              className={`c-checkout-form__delivery-option ${
                deliveryMode === 'home'
                  ? 'c-checkout-form__delivery-option--active'
                  : ''
              }`}
              onClick={() => setDeliveryMode('home')}
            >
              <Truck size={16} />
              <div>
                <div className="c-checkout-form__delivery-title">
                  {t('form.home')}
                </div>
                <div className="c-checkout-form__delivery-fee">
                  {wilaya
                    ? formatPrice(Number(wilaya.delivery_fee_home ?? 0))
                    : t('form.pickWilaya')}
                </div>
              </div>
            </button>

            <button
              type="button"
              aria-pressed={deliveryMode === 'desk'}
              className={`c-checkout-form__delivery-option ${
                deliveryMode === 'desk'
                  ? 'c-checkout-form__delivery-option--active'
                  : ''
              } ${
                !deskAvailable
                  ? 'c-checkout-form__delivery-option--disabled'
                  : ''
              }`}
              onClick={() => deskAvailable && setDeliveryMode('desk')}
              disabled={!deskAvailable}
            >
              <Store size={16} />
              <div>
                <div className="c-checkout-form__delivery-title">
                  {t('form.stopDesk')}
                </div>
                <div className="c-checkout-form__delivery-fee">
                  {!wilaya
                    ? t('form.pickWilaya')
                    : deskAvailable
                    ? formatPrice(Number(wilaya.delivery_fee_desk ?? 0))
                    : t('form.notAvailable')}
                </div>
              </div>
            </button>

            <button
              type="button"
              aria-pressed={deliveryMode === 'university'}
              className={`c-checkout-form__delivery-option ${
                deliveryMode === 'university'
                  ? 'c-checkout-form__delivery-option--active'
                  : ''
              }`}
              onClick={() => setDeliveryMode('university')}
            >
              <GraduationCap size={16} />
              <div>
                <div className="c-checkout-form__delivery-title">
                  {t('form.university')}
                </div>
                <div className="c-checkout-form__delivery-fee">
                  {t('form.free')}
                </div>
              </div>
            </button>
          </div>
        </div>

        {isUniversity ? (
          <div className="c-checkout-form__field">
            <label
              className="c-checkout-form__label"
              htmlFor="checkout-university"
            >
              <GraduationCap size={13} aria-hidden="true" />
              {t('form.chooseUniversity')}{' '}
              <span aria-hidden="true">*</span>
            </label>
            <select
              id="checkout-university"
              name="university"
              className="c-checkout-form__select"
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
            <p className="c-checkout-form__hint c-checkout-form__hint--success">
              <GraduationCap size={12} />
              {t('form.freeUniversityShipping')}
            </p>
          </div>
        ) : (
          <>
            <div className="c-checkout-form__row">
              <div className="c-checkout-form__field">
                <label
                  className="c-checkout-form__label"
                  htmlFor="checkout-wilaya"
                >
                  {t('form.wilaya')} <span aria-hidden="true">*</span>
                </label>
                <select
                  id="checkout-wilaya"
                  name="wilaya"
                  className="c-checkout-form__select"
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
              <div className="c-checkout-form__field">
                <label
                  className="c-checkout-form__label"
                  htmlFor="checkout-commune"
                >
                  {t('form.commune')} <span aria-hidden="true">*</span>
                </label>
                <select
                  id="checkout-commune"
                  name="commune"
                  className="c-checkout-form__select"
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
              <p className="c-checkout-form__hint">
                <AlertCircle size={12} />
                {t('form.stopDeskUnavailable', { wilaya: wilaya.name })}
              </p>
            )}

            <div className="c-checkout-form__field">
              <label
                className="c-checkout-form__label"
                htmlFor="checkout-address"
              >
                <MapPin size={13} aria-hidden="true" />
                {t('form.address')} <span aria-hidden="true">*</span>
              </label>
              <textarea
                id="checkout-address"
                name="address"
                className="c-checkout-form__textarea"
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
      </div>

      {/* Note section */}
      <div className="c-checkout-form__section">
        <h2 className="c-checkout-form__section-title">
          <span className="c-checkout-form__section-number">3</span>
          {t('form.orderNotes')}
        </h2>
        <div className="c-checkout-form__field">
          <label className="c-checkout-form__label" htmlFor="checkout-note">
            {t('form.noteOptional')}
          </label>
          <textarea
            id="checkout-note"
            name="note"
            className="c-checkout-form__textarea"
            rows={3}
            placeholder={t('form.notePlaceholder')}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        className="c-btn c-btn--primary c-btn--lg c-btn--block c-checkout-form__submit"
        disabled={createOrder.isPending || items.length === 0}
      >
        {createOrder.isPending
          ? t('form.placingOrder')
          : t('form.confirmOrderWithTotal', { total: formatPrice(total) })}
        {!createOrder.isPending && <ArrowRight size={18} />}
      </button>
    </form>
  )
}