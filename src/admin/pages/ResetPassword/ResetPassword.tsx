import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import toast from 'react-hot-toast'
import './ResetPassword.css'

export function ResetPassword() {
  const navigate = useNavigate()
  const [isReady, setIsReady] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    // Supabase puts the session in the URL hash after the user clicks the reset link
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'PASSWORD_RECOVERY' && session) {
          setIsReady(true)
        }
      }
    )

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setIsReady(true)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    if (password !== confirm) {
      toast.error('Passwords do not match')
      return
    }

    setIsSubmitting(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error

      toast.success('Password updated. Please sign in again.')
      await supabase.auth.signOut()
      navigate('/admin/login')
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to update password'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="reset-page">
      <div className="reset-card">
        <h1 className="reset-title">Set a new password</h1>
        <p className="reset-subtitle">
          {isReady
            ? 'Choose a strong password for your account.'
            : 'Verifying reset link...'}
        </p>

        {isReady && (
          <form onSubmit={handleSubmit} className="reset-form">
            <div className="reset-field">
              <label>New password</label>
              <div className="reset-password-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="reset-password-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  aria-label={
                    showPassword ? 'Hide password' : 'Show password'
                  }
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="reset-field">
              <label>Confirm password</label>
              <div className="reset-password-wrap">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="reset-password-toggle"
                  onClick={() => setShowConfirm((v) => !v)}
                  tabIndex={-1}
                  aria-label={
                    showConfirm ? 'Hide password' : 'Show password'
                  }
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="reset-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Updating...' : 'Update password'}
            </button>
          </form>
        )}

        {!isReady && (
          <p className="reset-error">
            Invalid or expired reset link. Please request a new one.
          </p>
        )}
      </div>
    </div>
  )
}