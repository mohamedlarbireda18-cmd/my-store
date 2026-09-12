import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Product, ProductInput, ProductVariant } from '../types'
import toast from 'react-hot-toast'

const PRODUCTS_KEY = ['products']

// Extended type with category & variant count
export interface ProductWithMeta extends Product {
  category: { id: string; name: string } | null
  variants: ProductVariant[]
}

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
          variants:product_variants(*)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data || []) as ProductWithMeta[]
    },
  })
}

// Fetch single product with variants
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
          variants:product_variants(*)
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
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create product')
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
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update product')
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