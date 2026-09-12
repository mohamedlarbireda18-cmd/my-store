import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import type {
  Product,
  ProductInput,
  ProductVariant,
  ProductVariantInput,
  PackItem,
  PackItemInput,
} from '../types'

// Friendly error messages for common Postgres error codes
function getFriendlyError(error: Error & { code?: string }): string {
  const code = (error as any).code
  switch (code) {
    case '23505':
      return 'A product with this slug already exists. Please choose a different slug.'
    case '23503':
      return 'Invalid reference. Please check the category.'
    case '23514':
      return 'Invalid value. Please check the price and stock fields.'
    default:
      return error.message || 'Something went wrong'
  }
}

const PRODUCTS_KEY = ['products']
const VARIANTS_KEY = ['variants']
const PACK_ITEMS_KEY = ['pack_items']

// Extended type with category, variants & pack items
export interface ProductWithMeta extends Product {
  category: { id: string; name: string } | null
  variants: ProductVariant[]
  pack_items?: PackItem[]
}

// ============================================
// PRODUCTS
// ============================================

// Fetch all products (admin - includes inactive)
export function useProducts() {
  return useQuery({
    queryKey: PRODUCTS_KEY,
    queryFn: async (): Promise<ProductWithMeta[]> => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(id, name),
          variants:product_variants(*),
          pack_items(*)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data || []) as ProductWithMeta[]
    },
  })
}

// Fetch single product with variants and pack items
export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: ['products', id],
    queryFn: async (): Promise<ProductWithMeta | null> => {
      if (!id) return null

      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(id, name),
          variants:product_variants(*),
          pack_items(*)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return data as ProductWithMeta
    },
    enabled: !!id,
  })
}

// Create product (without variants)
export function useCreateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: ProductInput): Promise<Product> => {
      const { data, error } = await supabase
        .from('products')
        .insert(input)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_KEY })
      toast.success('Product created successfully')
    },
    onError: (error: Error & { code?: string }) => {
      toast.error(getFriendlyError(error))
    },
  })
}

// Update product
export function useUpdateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string
      input: Partial<ProductInput>
    }): Promise<Product> => {
      const { data, error } = await supabase
        .from('products')
        .update(input)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_KEY })
      toast.success('Product updated successfully')
    },
    onError: (error: Error & { code?: string }) => {
      toast.error(getFriendlyError(error))
    },
  })
}

// Delete product
export function useDeleteProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase.from('products').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_KEY })
      toast.success('Product deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete product')
    },
  })
}

// Toggle product active status
export function useToggleProductStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      is_active,
    }: {
      id: string
      is_active: boolean
    }): Promise<Product> => {
      const { data, error } = await supabase
        .from('products')
        .update({ is_active })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_KEY })
      toast.success(`Product marked as ${data.is_active ? 'active' : 'inactive'}`)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update status')
    },
  })
}

// ============================================
// PRODUCT VARIANTS
// ============================================

// Create a variant
export function useCreateVariant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: ProductVariantInput): Promise<ProductVariant> => {
      const { data, error } = await supabase
        .from('product_variants')
        .insert(input)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_KEY })
      queryClient.invalidateQueries({ queryKey: VARIANTS_KEY })
    },
    onError: (error: Error & { code?: string }) => {
      toast.error(getFriendlyError(error))
    },
  })
}

// Update a variant
export function useUpdateVariant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string
      input: Partial<ProductVariantInput>
    }): Promise<ProductVariant> => {
      const { data, error } = await supabase
        .from('product_variants')
        .update(input)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_KEY })
      queryClient.invalidateQueries({ queryKey: VARIANTS_KEY })
    },
    onError: (error: Error & { code?: string }) => {
      toast.error(getFriendlyError(error))
    },
  })
}

// Delete a variant
export function useDeleteVariant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase.from('product_variants').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_KEY })
      queryClient.invalidateQueries({ queryKey: VARIANTS_KEY })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete variant')
    },
  })
}

// ============================================
// PACK ITEMS
// ============================================

// Bulk-replace pack items for a pack (delete all + insert new)
export function useReplacePackItems() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      packId,
      items,
    }: {
      packId: string
      items: Omit<PackItemInput, 'pack_id'>[]
    }): Promise<void> => {
      // 1. Delete all existing
      const { error: deleteError } = await supabase
        .from('pack_items')
        .delete()
        .eq('pack_id', packId)

      if (deleteError) throw deleteError

      // 2. Insert new (if any)
      if (items.length > 0) {
        const payload = items.map((item) => ({
          pack_id: packId,
          variant_id: item.variant_id,
          quantity: item.quantity,
        }))

        const { error: insertError } = await supabase
          .from('pack_items')
          .insert(payload)

        if (insertError) throw insertError
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_KEY })
      queryClient.invalidateQueries({ queryKey: PACK_ITEMS_KEY })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save pack items')
    },
  })
}