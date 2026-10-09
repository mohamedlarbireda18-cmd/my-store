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
import { formatPrice } from '../../../utils/format'
import type { DeliveryMode } from '../../../types'
import toast from 'react-hot-toast'
import './CheckoutForm.css'

interface CheckoutFormProps {
  onSuccess: (orderNumber: string) => void
}

export function CheckoutForm({ onSuccess }: CheckoutFormProps) {
  const navigate = useNavigate()
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

  const total = subtotal + deliveryFee

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
    if (items.length === 0) return 'Your cart is empty'
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

    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const error = validate()
    if (error) {
      toast.error(error)
      return
    }

    // For university orders, default wilaya/commune to Alger
    let finalWilayaId = wilayaId
    let finalCommuneId = communeId
    let finalAddress = address.trim()

    if (isUniversity) {
      const alger = wilayas.find((w) => w.code === '16')
      finalWilayaId = alger?.id ?? wilayaId
      const uni = universities.find((u) => u.id === universityId)
      finalAddress = `University: ${uni?.name ?? 'Unknown'}`

      if (!finalCommuneId && alger) {
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

          if (firstCommune) finalCommuneId = firstCommune.id
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
        items: items.map((item) => ({
          variant_id: item.variant_id,
          quantity: item.quantity,
        })),
      })

      // Mark order placed BEFORE clearing cart so the auto-redirect
      // useEffect doesn't fire when items becomes empty
      setOrderPlaced(true)
      clearCart()
      onSuccess(result.order.order_number)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to place order')
    }
  }

  return (
    <form className="c-checkout-form" onSubmit={handleSubmit}>
      {/* Contact section */}
      <div className="c-checkout-form__section">
        <h2 className="c-checkout-form__section-title">
          <span className="c-checkout-form__section-number">1</span>
          Contact information
        </h2>

        <div className="c-checkout-form__row">
          <div className="c-checkout-form__field">
            <label className="c-checkout-form__label">
              First name <span>*</span>
            </label>
            <input
              type="text"
              className="c-checkout-form__input"
              placeholder="Mohamed"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              autoComplete="given-name"
            />
          </div>
          <div className="c-checkout-form__field">
            <label className="c-checkout-form__label">
              Last name <span>*</span>
            </label>
            <input
              type="text"
              className="c-checkout-form__input"
              placeholder="Benali"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              autoComplete="family-name"
            />
          </div>
        </div>

        <div className="c-checkout-form__field">
          <label className="c-checkout-form__label">
            Phone number <span>*</span>
          </label>
          <input
            type="tel"
            inputMode="numeric"
            className="c-checkout-form__input"
            placeholder="0550123456"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\s/g, ''))}
            autoComplete="tel"
          />
        </div>
      </div>

      {/* Delivery section */}
      <div className="c-checkout-form__section">
        <h2 className="c-checkout-form__section-title">
          <span className="c-checkout-form__section-number">2</span>
          Delivery
        </h2>

        <div className="c-checkout-form__field">
          <label className="c-checkout-form__label">Delivery method</label>
          <div className="c-checkout-form__delivery c-checkout-form__delivery--three">
            <button
              type="button"
              className={`c-checkout-form__delivery-option ${
                deliveryMode === 'home'
                  ? 'c-checkout-form__delivery-option--active'
                  : ''
              }`}
              onClick={() => setDeliveryMode('home')}
            >
              <Truck size={16} />
              <div>
                <div className="c-checkout-form__delivery-title">Home</div>
                <div className="c-checkout-form__delivery-fee">
                  {wilaya
                    ? formatPrice(Number(wilaya.delivery_fee_home ?? 0))
                    : 'Pick wilaya'}
                </div>
              </div>
            </button>

            <button
              type="button"
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
                <div className="c-checkout-form__delivery-title">Stop desk</div>
                <div className="c-checkout-form__delivery-fee">
                  {!wilaya
                    ? 'Pick wilaya'
                    : deskAvailable
                    ? formatPrice(Number(wilaya.delivery_fee_desk ?? 0))
                    : 'Not available'}
                </div>
              </div>
            </button>

            <button
              type="button"
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
                  University
                </div>
                <div className="c-checkout-form__delivery-fee">Free</div>
              </div>
            </button>
          </div>
        </div>

        {isUniversity ? (
          <div className="c-checkout-form__field">
            <label className="c-checkout-form__label">
              <GraduationCap size={13} />
              Choose your university <span>*</span>
            </label>
            <select
              className="c-checkout-form__select"
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
            <p className="c-checkout-form__hint c-checkout-form__hint--success">
              <GraduationCap size={12} />
              Free shipping — we'll deliver to the university entrance.
            </p>
          </div>
        ) : (
          <>
            <div className="c-checkout-form__row">
              <div className="c-checkout-form__field">
                <label className="c-checkout-form__label">
                  Wilaya <span>*</span>
                </label>
                <select
                  className="c-checkout-form__select"
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
              <div className="c-checkout-form__field">
                <label className="c-checkout-form__label">
                  Commune <span>*</span>
                </label>
                <select
                  className="c-checkout-form__select"
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
              <p className="c-checkout-form__hint">
                <AlertCircle size={12} />
                Stop desk not available in {wilaya.name}
              </p>
            )}

            <div className="c-checkout-form__field">
              <label className="c-checkout-form__label">
                <MapPin size={13} />
                Address <span>*</span>
              </label>
              <textarea
                className="c-checkout-form__textarea"
                rows={2}
                placeholder="Street, building, landmark..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                autoComplete="street-address"
              />
            </div>
          </>
        )}
      </div>

      {/* Note section */}
      <div className="c-checkout-form__section">
        <h2 className="c-checkout-form__section-title">
          <span className="c-checkout-form__section-number">3</span>
          Order notes
        </h2>
        <div className="c-checkout-form__field">
          <label className="c-checkout-form__label">Note (optional)</label>
          <textarea
            className="c-checkout-form__textarea"
            rows={3}
            placeholder="Any additional details..."
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
          ? 'Placing order...'
          : `Confirm order — ${formatPrice(total)}`}
        {!createOrder.isPending && <ArrowRight size={18} />}
      </button>
    </form>
  )
}