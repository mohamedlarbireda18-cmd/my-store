import { useMutation } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import type { DeliveryMode } from '../../types'

interface OrderItemInput {
  variant_id: string
  quantity: number
}

export interface CreateOrderInput {
  customer_name: string
  customer_phone: string
  wilaya_id: string
  commune_id: string
  address: string
  note?: string
  delivery_mode: DeliveryMode
  university_id?: string
  items: OrderItemInput[]
}

export interface CreateOrderResponse {
  success: boolean
  order: {
    order_number: string
    total: number
    status: string
  }
}

export function useCreateOrder() {
  return useMutation({
    mutationFn: async (
      input: CreateOrderInput
    ): Promise<CreateOrderResponse> => {
      const { data, error } = await supabase.functions.invoke('create-order', {
        body: input,
      })

      if (error) {
        // Try to read the response body from the error context
        let detail = error.message
        try {
          // supabase-js v2 puts the raw Response on error.context
          const ctx = (error as any).context
          if (ctx && typeof ctx.json === 'function') {
            const body = await ctx.json()
            if (body?.error) detail = body.error
            if (body?.details) detail += ` — ${body.details}`
          }
        } catch {
          /* ignore */
        }
        throw new Error(detail || 'Failed to create order')
      }

      if (!data || data.error) {
        throw new Error(data?.error || 'Failed to create order')
      }

      return data as CreateOrderResponse
    },
  })
}