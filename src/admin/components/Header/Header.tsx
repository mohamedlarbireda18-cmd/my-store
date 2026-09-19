import { useState, useRef, useEffect } from 'react'
import { Menu, Bell, ChevronDown } from 'lucide-react'
import { useAdminAuth } from '../../auth/AdminAuthContext'
import './Header.css'

interface HeaderProps {
  onMenuClick: () => void
}

// Helper: get initials from a name or email
// e.g. "Mohamed Larbi" → "ML", "admin@mystore.com" → "AD"
function getInitials(input: string | null | undefined): string {
  if (!input) return 'AD'
  const name = input.includes('@') ? input.split('@')[0] : input
  const parts = name.split(/[._\s-]/).filter(Boolean)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

export function Header({ onMenuClick }: HeaderProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { adminEmail, adminName } = useAdminAuth()

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const displayName = adminName || 'Admin'
  const initials = getInitials(adminName || adminEmail)

  return (
    <header className="admin-header">
      <button
        className="admin-header__menu-btn"
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      <div className="admin-header__actions">
        <button className="admin-header__icon-btn" aria-label="Notifications">
          <Bell size={19} />
          <span className="admin-header__notif-dot" />
        </button>

        <div className="admin-header__profile" ref={ref}>
          <button
            className="admin-header__profile-btn"
            onClick={() => setOpen(!open)}
          >
            <div className="admin-header__avatar">{initials}</div>
            <span className="admin-header__profile-name">{displayName}</span>
            <ChevronDown
              size={16}
              className={`admin-header__chevron ${open ? 'open' : ''}`}
            />
          </button>

          {open && (
            <div className="admin-header__dropdown">
              <div className="admin-header__dropdown-header">
                <div className="admin-header__avatar admin-header__avatar--lg">
                  {initials}
                </div>
                <div>
                  <div className="admin-header__dropdown-name">
                    {displayName}
                  </div>
                  <div
                    className="admin-header__dropdown-email"
                    title={adminEmail || ''}
                  >
                    {adminEmail || '—'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}