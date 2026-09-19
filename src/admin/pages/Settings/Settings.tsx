import { useEffect, useState } from 'react'
import {
  User,
  Store,
  Mail,
  KeyRound,
  LogOut,
  Save,
  Lock,
  AlertCircle,
} from 'lucide-react'
import {
  useStoreSettings,
  useUpdateStoreSettings,
} from '../../../hooks/useStoreSettings'
import {
  useMyProfile,
  useUpdateProfile,
  useChangePassword,
  useSignOutEverywhere,
} from '../../../hooks/useProfile'
import { useAdminAuth } from '../../auth/AdminAuthContext'
import toast from 'react-hot-toast'
import './Settings.css'

type Tab = 'profile' | 'store'

export function Settings() {
  const [tab, setTab] = useState<Tab>('profile')

  return (
    <div className="settings">
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-header__title">Settings</h1>
          <p className="admin-page-header__subtitle">
            Manage your account and store preferences.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="settings__tabs">
        <button
          className={`settings__tab ${
            tab === 'profile' ? 'settings__tab--active' : ''
          }`}
          onClick={() => setTab('profile')}
        >
          <User size={16} />
          Profile
        </button>
        <button
          className={`settings__tab ${
            tab === 'store' ? 'settings__tab--active' : ''
          }`}
          onClick={() => setTab('store')}
        >
          <Store size={16} />
          Store
        </button>
      </div>

      {/* Content */}
      {tab === 'profile' ? <ProfileTab /> : <StoreTab />}
    </div>
  )
}

/* ============================================
   Profile tab
   ============================================ */
function ProfileTab() {
  const { adminEmail, refreshProfile } = useAdminAuth()
  const { data: profile, isLoading } = useMyProfile()
  const updateProfile = useUpdateProfile()
  const changePassword = useChangePassword()
  const signOutEverywhere = useSignOutEverywhere()

  const [fullName, setFullName] = useState('')

  useEffect(() => {
    if (profile) setFullName(profile.full_name ?? '')
  }, [profile])

  const initials = getInitials(fullName || adminEmail)

  const handleSaveProfile = async () => {
    const trimmed = fullName.trim()
    if (!trimmed) {
      toast.error('Display name cannot be empty')
      return
    }
    await updateProfile.mutateAsync({ full_name: trimmed })
    // Refresh auth context so header + sidebar update immediately
    await refreshProfile()
  }

  return (
    <div className="settings__panel">
      {/* Avatar card */}
      <div className="admin-card settings__card">
        <div className="settings__avatar-row">
          <div className="settings__avatar">{initials}</div>
          <div>
            <div className="settings__avatar-name">
              {fullName || 'Admin'}
            </div>
            <div className="settings__avatar-email">{adminEmail ?? '—'}</div>
          </div>
        </div>
      </div>

      {/* Profile form */}
      <div className="admin-card settings__card">
        <h2 className="settings__section-title">Account Information</h2>

        <div className="settings__field">
          <label className="settings__label">Display name</label>
          <input
            type="text"
            className="settings__input"
            placeholder="Your name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={isLoading}
          />
          <span className="settings__hint">
            Shown across the admin dashboard.
          </span>
        </div>

        <div className="settings__field">
          <label className="settings__label">
            Email <Lock size={12} className="settings__label-lock" />
          </label>
          <input
            type="text"
            className="settings__input settings__input--readonly"
            value={adminEmail ?? ''}
            readOnly
          />
          <span className="settings__hint">
            Contact support to change email.
          </span>
        </div>

        <div className="settings__card-footer">
          <button
            className="admin-btn admin-btn--primary"
            onClick={handleSaveProfile}
            disabled={updateProfile.isPending || isLoading}
          >
            <Save size={16} />
            {updateProfile.isPending ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </div>

      {/* Security card */}
      <div className="admin-card settings__card">
        <h2 className="settings__section-title">Security</h2>

        <div className="settings__action-row">
          <div className="settings__action-icon settings__action-icon--indigo">
            <KeyRound size={16} />
          </div>
          <div className="settings__action-body">
            <div className="settings__action-title">Change Password</div>
            <div className="settings__action-desc">
              We'll email you a secure password reset link.
            </div>
          </div>
          <button
            className="admin-btn admin-btn--secondary admin-btn--sm"
            onClick={() => changePassword.mutate()}
            disabled={changePassword.isPending}
          >
            {changePassword.isPending ? 'Sending...' : 'Send link'}
          </button>
        </div>

        <div className="settings__action-row">
          <div className="settings__action-icon settings__action-icon--danger">
            <LogOut size={16} />
          </div>
          <div className="settings__action-body">
            <div className="settings__action-title">Sign out everywhere</div>
            <div className="settings__action-desc">
              End all active sessions on every device.
            </div>
          </div>
          <button
            className="admin-btn admin-btn--danger-outline admin-btn--sm"
            onClick={() => signOutEverywhere.mutate()}
            disabled={signOutEverywhere.isPending}
          >
            {signOutEverywhere.isPending ? 'Signing out...' : 'Sign out all'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ============================================
   Store tab
   ============================================ */
function StoreTab() {
  const { data: settings, isLoading } = useStoreSettings()
  const updateSettings = useUpdateStoreSettings()

  const [storeName, setStoreName] = useState('')
  const [storePhone, setStorePhone] = useState('')
  const [storeEmail, setStoreEmail] = useState('')
  const [storeAddress, setStoreAddress] = useState('')
  const [orderPrefix, setOrderPrefix] = useState('ORD-')
  const [autoAccept, setAutoAccept] = useState(false)
  const [allowNotes, setAllowNotes] = useState(true)
  const [storeOpen, setStoreOpen] = useState(true)
  const [showOutOfStock, setShowOutOfStock] = useState(true)

  useEffect(() => {
    if (settings) {
      setStoreName(settings.store_name)
      setStorePhone(settings.store_phone ?? '')
      setStoreEmail(settings.store_email ?? '')
      setStoreAddress(settings.store_address ?? '')
      setOrderPrefix(settings.order_prefix)
      setAutoAccept(settings.auto_accept_orders)
      setAllowNotes(settings.allow_order_notes)
      setStoreOpen(settings.store_open)
      setShowOutOfStock(settings.show_out_of_stock)
    }
  }, [settings])

  const handleSave = async () => {
    if (!storeName.trim()) {
      toast.error('Store name cannot be empty')
      return
    }
    await updateSettings.mutateAsync({
      store_name: storeName.trim(),
      store_phone: storePhone.trim() || null,
      store_email: storeEmail.trim() || null,
      store_address: storeAddress.trim() || null,
      order_prefix: orderPrefix.trim() || 'ORD-',
      auto_accept_orders: autoAccept,
      allow_order_notes: allowNotes,
      store_open: storeOpen,
      show_out_of_stock: showOutOfStock,
    })
  }

  if (isLoading) {
    return <div className="settings__loading">Loading settings...</div>
  }

  return (
    <div className="settings__panel">
      {/* Store info */}
      <div className="admin-card settings__card">
        <h2 className="settings__section-title">Store Information</h2>

        <div className="settings__grid-2">
          <div className="settings__field">
            <label className="settings__label">Store name</label>
            <input
              type="text"
              className="settings__input"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="e.g. DzairTech Store"
            />
          </div>

          <div className="settings__field">
            <label className="settings__label">Order prefix</label>
            <input
              type="text"
              className="settings__input"
              value={orderPrefix}
              onChange={(e) => setOrderPrefix(e.target.value)}
              placeholder="ORD-"
              maxLength={8}
            />
            <span className="settings__hint">
              Used for generating order numbers.
            </span>
          </div>
        </div>

        <div className="settings__grid-2">
          <div className="settings__field">
            <label className="settings__label">Phone</label>
            <input
              type="tel"
              className="settings__input"
              value={storePhone}
              onChange={(e) => setStorePhone(e.target.value)}
              placeholder="0550 00 00 00"
            />
          </div>

          <div className="settings__field">
            <label className="settings__label">Email</label>
            <input
              type="email"
              className="settings__input"
              value={storeEmail}
              onChange={(e) => setStoreEmail(e.target.value)}
              placeholder="contact@dzairstore.dz"
            />
          </div>
        </div>

        <div className="settings__field">
          <label className="settings__label">Address</label>
          <textarea
            className="settings__input settings__textarea"
            value={storeAddress}
            onChange={(e) => setStoreAddress(e.target.value)}
            placeholder="Store address"
            rows={3}
          />
        </div>
      </div>

      {/* Operations */}
      <div className="admin-card settings__card">
        <h2 className="settings__section-title">Operations</h2>

        <ToggleRow
          icon={<Store size={16} />}
          iconVariant="green"
          title="Store is open"
          description="Customers can browse and place orders. When off, checkout is disabled."
          checked={storeOpen}
          onChange={setStoreOpen}
        />

        <ToggleRow
          icon={<AlertCircle size={16} />}
          iconVariant="indigo"
          title="Auto-accept new orders"
          description="Automatically move new orders to Accepted status."
          checked={autoAccept}
          onChange={setAutoAccept}
        />

        <ToggleRow
          icon={<User size={16} />}
          iconVariant="indigo"
          title="Allow order notes"
          description="Let customers add a note at checkout."
          checked={allowNotes}
          onChange={setAllowNotes}
        />

        <ToggleRow
          icon={<Mail size={16} />}
          iconVariant="orange"
          title="Show out-of-stock products"
          description="Display out-of-stock products on the storefront (as unavailable)."
          checked={showOutOfStock}
          onChange={setShowOutOfStock}
        />
      </div>

      {/* Save */}
      <div className="settings__save-bar">
        <button
          className="admin-btn admin-btn--primary"
          onClick={handleSave}
          disabled={updateSettings.isPending}
        >
          <Save size={16} />
          {updateSettings.isPending ? 'Saving...' : 'Save store settings'}
        </button>
      </div>
    </div>
  )
}

/* ============================================
   Toggle row
   ============================================ */
interface ToggleRowProps {
  icon: React.ReactNode
  iconVariant: 'green' | 'indigo' | 'orange' | 'danger'
  title: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
}

function ToggleRow({
  icon,
  iconVariant,
  title,
  description,
  checked,
  onChange,
}: ToggleRowProps) {
  return (
    <div className="settings__toggle-row">
      <div
        className={`settings__action-icon settings__action-icon--${iconVariant}`}
      >
        {icon}
      </div>
      <div className="settings__action-body">
        <div className="settings__action-title">{title}</div>
        <div className="settings__action-desc">{description}</div>
      </div>
      <label className="settings__switch">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="settings__switch-slider" />
      </label>
    </div>
  )
}

/* ============================================
   Helpers
   ============================================ */
function getInitials(input: string | null | undefined): string {
  if (!input) return 'AD'
  const name = input.includes('@') ? input.split('@')[0] : input
  const parts = name.split(/[._\s-]/).filter(Boolean)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}