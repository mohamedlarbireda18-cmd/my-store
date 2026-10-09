import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import type { Commune } from '../../types'

export function useCommunes(wilayaId: string | null) {
  return useQuery({
    queryKey: ['communes', wilayaId],
    queryFn: async (): Promise<Commune[]> => {
      if (!wilayaId) return []

      const { data, error } = await supabase
        .from('communes')
        .select('*')
        .eq('wilaya_id', wilayaId)
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (error) throw error
      return data ?? []
    },
    enabled: !!wilayaId,
    staleTime: 1000 * 60 * 30,
  })
}