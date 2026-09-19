import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import type { Category } from '../../types'

export interface PublicCategory extends Category {
  product_count: number
}

export function usePublicCategories() {
  return useQuery({
    queryKey: ['public', 'categories'],
    queryFn: async (): Promise<PublicCategory[]> => {
      const { data, error } = await supabase
        .from('categories')
        .select(`
          *,
          products!inner(id, is_active)
        `)
        .eq('is_active', true)
        .eq('products.is_active', true)
        .order('name', { ascending: true })

      if (error) throw error

      return (data ?? []).map((row: any) => ({
        ...row,
        product_count: Array.isArray(row.products) ? row.products.length : 0,
        products: undefined,
      })) as PublicCategory[]
    },
    staleTime: 1000 * 60 * 10,
  })
}