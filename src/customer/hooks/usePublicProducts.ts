import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import type { Product, ProductVariant } from '../../types'

export interface PublicProduct extends Product {
  category: { id: string; name: string; slug: string } | null
  variants: ProductVariant[]
  min_price: number
  max_price: number
  total_stock: number
}

const PUBLIC_PRODUCTS_KEY = ['public', 'products']

export function usePublicProducts() {
  return useQuery({
    queryKey: PUBLIC_PRODUCTS_KEY,
    queryFn: async (): Promise<PublicProduct[]> => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(id, name, slug),
          variants:product_variants(*)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error

      return (data ?? [])
        .map((row: any) => {
          const activeVariants = (row.variants ?? []).filter(
            (v: ProductVariant) => v.is_active && v.stock > 0
          )
          if (activeVariants.length === 0) return null

          const prices = activeVariants.map((v: ProductVariant) => v.price)
          const totalStock = activeVariants.reduce(
            (sum: number, v: ProductVariant) => sum + v.stock,
            0
          )

          return {
            ...row,
            variants: activeVariants,
            min_price: Math.min(...prices),
            max_price: Math.max(...prices),
            total_stock: totalStock,
          } as PublicProduct
        })
        .filter(Boolean) as PublicProduct[]
    },
    staleTime: 1000 * 60 * 2,
  })
}

export function usePublicProduct(slug: string | undefined) {
  return useQuery({
    queryKey: ['public', 'product', slug],
    queryFn: async (): Promise<PublicProduct | null> => {
      if (!slug) return null

      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(id, name, slug),
          variants:product_variants(*)
        `)
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle()

      if (error || !data) return null

      const activeVariants = (data.variants ?? []).filter(
        (v: ProductVariant) => v.is_active
      )

      const prices = activeVariants.map((v: ProductVariant) => v.price)
      const totalStock = activeVariants.reduce(
        (sum: number, v: ProductVariant) => sum + v.stock,
        0
      )

      return {
        ...data,
        variants: activeVariants,
        min_price: prices.length ? Math.min(...prices) : 0,
        max_price: prices.length ? Math.max(...prices) : 0,
        total_stock: totalStock,
      } as PublicProduct
    },
    enabled: !!slug,
  })
}