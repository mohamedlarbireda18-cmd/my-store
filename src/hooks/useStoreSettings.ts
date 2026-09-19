import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { StoreSettings, StoreSettingsInput } from '../types'
import toast from 'react-hot-toast'

const SETTINGS_KEY = ['store_settings']

export function useStoreSettings() {
  return useQuery({
    queryKey: SETTINGS_KEY,
    queryFn: async (): Promise<StoreSettings> => {
      const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .eq('id', 1)
        .single()

      if (error) throw error
      return data
    },
  })
}

export function useUpdateStoreSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: StoreSettingsInput): Promise<StoreSettings> => {
      const { data, error } = await supabase
        .from('store_settings')
        .update(input)
        .eq('id', 1)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SETTINGS_KEY })
      toast.success('Store settings saved')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save settings')
    },
  })
}