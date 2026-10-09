import { useEffect, useMemo, useState } from 'react'
import { MapPin, Truck, Store, GraduationCap, AlertCircle } from 'lucide-react'
import { useWilayas } from '../../../hooks/useWilayas'
import { useCommunes } from '../../hooks/useCommunes'
import { useUniversities } from '../../hooks/useUniversities'
import { useCreateOrder } from '../../hooks/useCreateOrder'
import { formatPrice } from '../../../utils/format'
import type { DeliveryMode } from '../../../types'
import toast from 'react-hot-toast'
import './OrderForm.css'

interface OrderFormProps {
  variantId: string
  unitPrice: number
  maxStock: number
  onSuccess: (orderNumber: string) => void
}

export function OrderForm({
  variantId,
  unitPrice,
  maxStock,
  onSuccess,
}: OrderFormProps) {
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

  const isUniversity = deliveryMode === 'university'

  const { data: communes = [], isLoading: loadingCommunes } = useCommunes(
    isUniversity ? null : wilayaId || null
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

  const total = unitPrice + deliveryFee

  const validate = (): string | null => {
    if (!firstName.trim()) return 'First name is required'
    if (!lastName.trim()) return 'Last name is required'
    if (!phone.trim()) return 'Phone number is required'

    const phoneRegex = /^(0)(5|6|7)[0-9]{8}$/
    if (!phoneRegex.test(phone.trim())) {
      return 'Invalid phone number (e.g. 0550123456)'
    }

    if (isUniversity) {
      if (!universityId) return 'Please select a university'
    } else {
      if (!wilayaId) return 'Please select a wilaya'
      if (!communeId) return 'Please select a commune'
      if (!address.trim()) return 'Address is required'
    }

    if (maxStock < 1) return 'Out of stock'
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const error = validate()
    if (error) {
      toast.error(error)
      return
    }

    // For university: default to Algiers (wilaya 16) if not set
    let finalWilayaId = wilayaId
    let finalCommuneId = communeId
    let finalAddress = address.trim()

    if (isUniversity) {
      // Find Algiers by code '16'
      const alger = wilayas.find((w) => w.code === '16')
      finalWilayaId = alger?.id ?? wilayaId
      // Commune can be anything; if empty we let the edge function handle it
      // by falling back to the first commune of Alger
      if (!finalCommuneId && alger) {
        // We need a commune — the edge function requires one.
        // Pick the first commune of Alger as a stable default.
        // The customer never sees this — it's just a placeholder.
        finalCommuneId = '' // will be filled below
      }
      const uni = universities.find((u) => u.id === universityId)
      finalAddress = `University: ${uni?.name ?? 'Unknown'}`
    }

    // If university mode and no commune set, fetch the first Alger commune
    if (isUniversity && !finalCommuneId) {
      const alger = wilayas.find((w) => w.code === '16')
      if (alger) {
        try {
          const { supabase } = await import('../../../lib/supabase')
          const { data: firstCommune } = await supabase
            .from('communes')
            .select('id')
            .eq('wilaya_id', alger.id)
            .eq('is_active', true)
            .order('code', { ascending: true })
            .limit(1)
            .maybeSingle()

          if (firstCommune) {
            finalCommuneId = firstCommune.id
          }
        } catch {
          /* ignore */
        }
      }
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
        items: [{ variant_id: variantId, quantity: 1 }],
      })

      onSuccess(result.order.order_number)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to place order')
    }
  }

  return (
    <form className="c-order-form" onSubmit={handleSubmit}>
      <h2 className="c-order-form__title">Order now</h2>
      <p className="c-order-form__subtitle">
        Fill in your details and we'll contact you to confirm.
      </p>

      <div className="c-order-form__row">
        <div className="c-order-form__field">
          <label className="c-order-form__label">
            First name <span>*</span>
          </label>
          <input
            type="text"
            className="c-order-form__input"
            placeholder="Mohamed"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            autoComplete="given-name"
          />
        </div>
        <div className="c-order-form__field">
          <label className="c-order-form__label">
            Last name <span>*</span>
          </label>
          <input
            type="text"
            className="c-order-form__input"
            placeholder="Benali"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            autoComplete="family-name"
          />
        </div>
      </div>

      <div className="c-order-form__field">
        <label className="c-order-form__label">
          Phone number <span>*</span>
        </label>
        <input
          type="tel"
          inputMode="numeric"
          className="c-order-form__input"
          placeholder="0550123456"
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/\s/g, ''))}
          autoComplete="tel"
        />
      </div>

      {/* Delivery method FIRST — so the rest adapts */}
      <div className="c-order-form__field">
        <label className="c-order-form__label">Delivery method</label>
        <div className="c-order-form__delivery c-order-form__delivery--three">
          <button
            type="button"
            className={`c-order-form__delivery-option ${
              deliveryMode === 'home'
                ? 'c-order-form__delivery-option--active'
                : ''
            }`}
            onClick={() => setDeliveryMode('home')}
          >
            <Truck size={16} />
            <div>
              <div className="c-order-form__delivery-title">Home</div>
              {wilaya ? (
                <div className="c-order-form__delivery-fee">
                  {formatPrice(Number(wilaya.delivery_fee_home ?? 0))}
                </div>
              ) : (
                <div className="c-order-form__delivery-fee">Pick wilaya</div>
              )}
            </div>
          </button>

          <button
            type="button"
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
              <div className="c-order-form__delivery-title">Stop desk</div>
              {wilaya ? (
                <div className="c-order-form__delivery-fee">
                  {deskAvailable
                    ? formatPrice(Number(wilaya.delivery_fee_desk ?? 0))
                    : 'Not available'}
                </div>
              ) : (
                <div className="c-order-form__delivery-fee">Pick wilaya</div>
              )}
            </div>
          </button>

          <button
            type="button"
            className={`c-order-form__delivery-option ${
              deliveryMode === 'university'
                ? 'c-order-form__delivery-option--active'
                : ''
            }`}
            onClick={() => setDeliveryMode('university')}
          >
            <GraduationCap size={16} />
            <div>
              <div className="c-order-form__delivery-title">University</div>
              <div className="c-order-form__delivery-fee">Free</div>
            </div>
          </button>
        </div>
      </div>

      {/* UNIVERSITY: only show uni picker */}
      {isUniversity ? (
        <div className="c-order-form__field">
          <label className="c-order-form__label">
            <GraduationCap size={13} />
            Choose your university <span>*</span>
          </label>
          <select
            className="c-order-form__select"
            value={universityId}
            onChange={(e) => setUniversityId(e.target.value)}
          >
            <option value="">Select university...</option>
            {universities.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
          <p className="c-order-form__hint c-order-form__hint--success">
            <GraduationCap size={12} />
            Free shipping — we'll deliver to the university entrance.
          </p>
        </div>
      ) : (
        <>
          {/* Wilaya + Commune */}
          <div className="c-order-form__row">
            <div className="c-order-form__field">
              <label className="c-order-form__label">
                Wilaya <span>*</span>
              </label>
              <select
                className="c-order-form__select"
                value={wilayaId}
                onChange={(e) => setWilayaId(e.target.value)}
              >
                <option value="">Select wilaya...</option>
                {wilayas.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.code} — {w.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="c-order-form__field">
              <label className="c-order-form__label">
                Commune <span>*</span>
              </label>
              <select
                className="c-order-form__select"
                value={communeId}
                onChange={(e) => setCommuneId(e.target.value)}
                disabled={!wilayaId || loadingCommunes}
              >
                <option value="">
                  {!wilayaId
                    ? 'Pick wilaya first'
                    : loadingCommunes
                    ? 'Loading...'
                    : 'Select commune...'}
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
              Stop desk not available in {wilaya.name}
            </p>
          )}

          {/* Address */}
          <div className="c-order-form__field">
            <label className="c-order-form__label">
              <MapPin size={13} />
              Address <span>*</span>
            </label>
            <textarea
              className="c-order-form__textarea"
              rows={2}
              placeholder="Street, building, landmark..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              autoComplete="street-address"
            />
          </div>
        </>
      )}

      <div className="c-order-form__field">
        <label className="c-order-form__label">Note (optional)</label>
        <textarea
          className="c-order-form__textarea"
          rows={2}
          placeholder="Any additional details..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      <div className="c-order-form__summary">
        <div className="c-order-form__summary-row">
          <span>Price</span>
          <span>{formatPrice(unitPrice)}</span>
        </div>
        <div className="c-order-form__summary-row">
          <span>Delivery fee</span>
          <span>
            {isUniversity
              ? 'Free'
              : wilaya
              ? formatPrice(deliveryFee)
              : '—'}
          </span>
        </div>
        <div className="c-order-form__summary-row c-order-form__summary-row--total">
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>
      </div>

      <button
        type="submit"
        className="c-btn c-btn--primary c-btn--lg c-btn--block c-order-form__submit"
        disabled={createOrder.isPending || maxStock < 1}
      >
        {createOrder.isPending
          ? 'Placing order...'
          : maxStock < 1
          ? 'Out of stock'
          : 'Confirm order'}
      </button>
    </form>
  )
}