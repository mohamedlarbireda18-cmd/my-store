import React, { createContext, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

interface AdminAuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  adminEmail: string | null
  adminName: string | null
  refreshProfile: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined)

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [adminEmail, setAdminEmail] = useState<string | null>(null)
  const [adminName, setAdminName] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    checkSession()
  }, [])

  const loadAdminProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('full_name, role')
      .eq('id', userId)
      .single()

    if (error || data?.role !== 'admin') return null
    return data
  }

  const clearSession = async () => {
    await supabase.auth
      .signOut({ scope: 'local' })
      .catch(() => undefined)
    setIsAuthenticated(false)
    setAdminEmail(null)
    setAdminName(null)
  }

  const checkSession = async () => {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      if (error || !user) {
        setIsAuthenticated(false)
        setAdminEmail(null)
        setAdminName(null)
        return
      }

      const profile = await loadAdminProfile(user.id)
      if (!profile) {
        await clearSession()
        return
      }

      setIsAuthenticated(true)
      setAdminEmail(user.email ?? null)
      setAdminName(profile.full_name ?? null)
    } catch {
      await clearSession()
    } finally {
      setIsLoading(false)
    }
  }

  const refreshProfile = async () => {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      await clearSession()
      return
    }

    const profile = await loadAdminProfile(user.id)
    if (!profile) {
      await clearSession()
      return
    }

    setAdminEmail(user.email ?? null)
    setAdminName(profile.full_name ?? null)
  }

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', data.user.id)
      .single()

    if (profileError || !profile || profile.role !== 'admin') {
      await supabase.auth.signOut()
      throw new Error('Unauthorized: Admin access only')
    }

    setIsAuthenticated(true)
    setAdminEmail(data.user.email ?? null)
    setAdminName(profile.full_name ?? null)
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setIsAuthenticated(false)
    setAdminEmail(null)
    setAdminName(null)
    navigate('/admin/login')
  }

  return (
    <AdminAuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        adminEmail,
        adminName,
        refreshProfile,
        login,
        logout,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext)
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider')
  return ctx
}