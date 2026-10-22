import { useMutation } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useLanguage } from '../../i18n/LanguageContext'
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
  idempotency_key: string
  items: OrderItemInput[]
}

export interface CreateOrderResponse {
  success: boolean
  duplicate: boolean
  order: {
    order_number: string
    total: number
    status: string
    customer_phone: string
  }
}

export function useCreateOrder() {
  const { t } = useLanguage()

  return useMutation({
    mutationFn: async (
      input: CreateOrderInput
    ): Promise<CreateOrderResponse> => {
      const { data, error } = await supabase.functions.invoke('create-order', {
        body: input,
      })

      if (error) {
        let detail = error.message
        try {
          const context = (error as { context?: Response }).context
          if (context && typeof context.json === 'function') {
            const body = await context.json()
            if (body?.error) detail = body.error
          }
        } catch {
          detail = t('form.errors.orderFailed')
        }
        throw new Error(detail || t('form.errors.orderFailed'))
      }

      if (!data || data.error) {
        throw new Error(data?.error || t('form.errors.orderFailed'))
      }

      return data as CreateOrderResponse
    },
  })
}
