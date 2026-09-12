import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Wilaya } from '../types'

export function useWilayas() {
  return useQuery({
    queryKey: ['wilayas'],
    queryFn: async (): Promise<Wilaya[]> => {
      const { data, error } = await supabase
        .from('wilayas')
        .select('*')
        .order('code', { ascending: true })

      if (error) throw error
      return data ?? []
    },
  })
}