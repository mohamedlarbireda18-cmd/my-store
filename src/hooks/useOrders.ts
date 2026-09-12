import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { OrderStatus, OrderWithMeta, OrderDetail } from '../types'
import toast from 'react-hot-toast'

const ORDERS_KEY = ['orders']

// ============================================
// LIST ORDERS
// ============================================
export interface OrderFilters {
  status: OrderStatus | 'all'
  wilayaId: string | 'all'
  search: string
}

export function useOrders(filters: OrderFilters) {
  return useQuery({
    queryKey: [...ORDERS_KEY, filters],
    queryFn: async (): Promise<OrderWithMeta[]> => {
      let query = supabase
        .from('orders')
        .select(`
          *,
          wilaya:wilayas(id, name, code),
          commune:communes(id, name),
          order_items(id)
        `)
        .order('created_at', { ascending: false })

      if (filters.status !== 'all') {
        query = query.eq('status', filters.status)
      }

      if (filters.wilayaId !== 'all') {
        query = query.eq('wilaya_id', filters.wilayaId)
      }

      if (filters.search.trim()) {
        const s = filters.search.trim()
        query = query.or(
          `customer_name.ilike.%${s}%,customer_phone.ilike.%${s}%,order_number.ilike.%${s}%`
        )
      }

      const { data, error } = await query
      if (error) throw error

      return (data ?? []).map((row: any) => ({
        ...row,
        items_count: row.order_items?.length ?? 0,
        order_items: undefined,
      })) as OrderWithMeta[]
    },
  })
}

// ============================================
// SINGLE ORDER (detail)
// ============================================
export function useOrder(id: string | undefined) {
  return useQuery({
    queryKey: ['orders', 'detail', id],
    queryFn: async (): Promise<OrderDetail | null> => {
      if (!id) return null

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          wilaya:wilayas(id, name, code),
          commune:communes(id, name),
          order_items(
            *,
            product:products(id, name, slug, image_url),
            variant:product_variants(id, size, color, sku)
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return data as OrderDetail
    },
    enabled: !!id,
  })
}

// ============================================
// ORDER STATS
// ============================================
export interface OrderStats {
  total: number
  pending: number
  accepted: number
  done: number
  cancelled: number
}

export function useOrderStats() {
  return useQuery({
    queryKey: [...ORDERS_KEY, 'stats'],
    queryFn: async (): Promise<OrderStats> => {
      const { data, error } = await supabase
        .from('orders')
        .select('status')

      if (error) throw error

      const stats: OrderStats = {
        total: data.length,
        pending: 0,
        accepted: 0,
        done: 0,
        cancelled: 0,
      }

      for (const row of data) {
        switch (row.status) {
          case 'PENDING':
            stats.pending++
            break
          case 'ACCEPTED_PENDING':
            stats.accepted++
            break
          case 'DONE':
            stats.done++
            break
          case 'CANCELLED':
            stats.cancelled++
            break
        }
      }

      return stats
    },
  })
}

// ============================================
// UPDATE STATUS
// ============================================
interface StatusUpdatePayload {
  id: string
  status: OrderStatus
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, status }: StatusUpdatePayload) => {
      const { data, error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ORDERS_KEY })
      queryClient.invalidateQueries({ queryKey: ['orders', 'detail', variables.id] })

      const label =
        variables.status === 'ACCEPTED_PENDING'
          ? 'accepted'
          : variables.status === 'DONE'
          ? 'marked as done'
          : variables.status === 'CANCELLED'
          ? 'cancelled'
          : 'updated'

      toast.success(`Order ${label}`)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update order status')
    },
  })
}
// ============================================
// DELETE ORDER
// ============================================
export function useDeleteOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('orders').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORDERS_KEY })
      queryClient.invalidateQueries({ queryKey: ['orders', 'stats'] })
      toast.success('Order deleted')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete order')
    },
  })
}

// ============================================
// UPDATE DELIVERY FEE
// ============================================
interface DeliveryFeePayload {
  id: string
  delivery_fee: number
}

export function useUpdateOrderDeliveryFee() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, delivery_fee }: DeliveryFeePayload) => {
      // Fetch current subtotal to recompute total
      const { data: existing, error: fetchError } = await supabase
        .from('orders')
        .select('subtotal')
        .eq('id', id)
        .single()

      if (fetchError || !existing) throw fetchError ?? new Error('Order not found')

      const newTotal = Number(existing.subtotal) + delivery_fee

      const { data, error } = await supabase
        .from('orders')
        .update({ delivery_fee, total: newTotal })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ORDERS_KEY })
      queryClient.invalidateQueries({ queryKey: ['orders', 'detail', variables.id] })
      toast.success('Delivery fee updated')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update delivery fee')
    },
  })
}