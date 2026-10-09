import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import type { University } from '../../types'

export function useUniversities() {
  return useQuery({
    queryKey: ['universities'],
    queryFn: async (): Promise<University[]> => {
      const { data, error } = await supabase
        .from('universities')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (error) throw error
      return data ?? []
    },
    staleTime: 1000 * 60 * 30,
  })
}