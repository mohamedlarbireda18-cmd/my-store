import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Profile } from '../types'
import toast from 'react-hot-toast'

const PROFILE_KEY = ['profile']

export function useMyProfile() {
  return useQuery({
    queryKey: PROFILE_KEY,
    queryFn: async (): Promise<Profile | null> => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error
      return data
    },
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: { full_name: string }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('profiles')
        .update({ full_name: input.full_name })
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFILE_KEY })
      toast.success('Profile updated')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update profile')
    },
  })
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.email) throw new Error('No email on file')

      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/admin/reset-password`,
      })

      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Password reset link sent to your email')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to send reset link')
    },
  })
}

export function useSignOutEverywhere() {
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut({ scope: 'global' })
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Signed out of all devices')
      window.location.href = '/admin/login'
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to sign out everywhere')
    },
  })
}