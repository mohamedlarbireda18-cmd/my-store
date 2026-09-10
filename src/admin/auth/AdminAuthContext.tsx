import React, { createContext, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

interface AdminAuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  adminEmail: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined)

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [adminEmail, setAdminEmail] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    checkSession()
  }, [])

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      setIsAuthenticated(!!session)
      setAdminEmail(session?.user?.email ?? null)
    } catch {
      setIsAuthenticated(false)
      setAdminEmail(null)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    if (profileError || !profile || profile.role !== 'admin') {
      await supabase.auth.signOut()
      throw new Error('Unauthorized: Admin access only')
    }

    setIsAuthenticated(true)
    setAdminEmail(data.user.email ?? null)
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setIsAuthenticated(false)
    setAdminEmail(null)
    navigate('/admin/login')
  }

  return (
    <AdminAuthContext.Provider value={{ isAuthenticated, isLoading, adminEmail, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext)
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider')
  return ctx
}