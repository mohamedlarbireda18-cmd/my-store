// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment

import { serve } from 'std/http/server.ts'
import { createClient } from '@supabase/supabase-js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

interface OrderItem {
  product_id: string
  variant_id: string
  quantity: number
}

interface OrderRequest {
  customer_name: string
  customer_phone: string
  wilaya_id: string
  commune_id: string
  address: string
  note?: string
  delivery_mode: 'home' | 'desk' | 'university'
  university_id?: string
  items: OrderItem[]
}

interface VariantWithProduct {
  id: string
  price: number
  stock: number
  is_active: boolean
  size: string | null
  color: string | null
  product: {
    id: string
    name: string
    is_active: boolean
  }
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    )

    // Parse request body
    const body: OrderRequest = await req.json()

    // ============================================
    // DEBUG LOGS
    // ============================================
    console.log('[create-order] Received body:', JSON.stringify(body))
    console.log('[create-order] wilaya_id:', body.wilaya_id)
    console.log('[create-order] commune_id:', body.commune_id)
    console.log('[create-order] delivery_mode:', body.delivery_mode)
    console.log('[create-order] university_id:', body.university_id)
    console.log('[create-order] items count:', body.items?.length)

    // ============================================
    // VALIDATE REQUIRED FIELDS
    // ============================================
    if (
      !body.customer_name ||
      !body.customer_phone ||
      !body.wilaya_id ||
      !body.commune_id ||
      !body.address
    ) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    if (!body.items || body.items.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No items in order' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // Validate phone number format (Algerian phone numbers)
    const phoneRegex = /^(0)(5|6|7)[0-9]{8}$/
    if (!phoneRegex.test(body.customer_phone)) {
      return new Response(
        JSON.stringify({ error: 'Invalid phone number format' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // Validate delivery mode
    if (
      body.delivery_mode !== 'home' &&
      body.delivery_mode !== 'desk' &&
      body.delivery_mode !== 'university'
    ) {
      return new Response(
        JSON.stringify({ error: 'Invalid delivery mode' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // ============================================
    // FETCH WILAYA (with verbose debug)
    // ============================================
    const { data: wilaya, error: wilayaError } = await supabaseClient
      .from('wilayas')
      .select('delivery_fee_home, delivery_fee_desk, is_active')
      .eq('id', body.wilaya_id)
      .single()

    console.log('[create-order] wilaya result:', JSON.stringify(wilaya))
    console.log('[create-order] wilaya error:', JSON.stringify(wilayaError))

    if (wilayaError) {
      return new Response(
        JSON.stringify({
          error: `Wilaya query error: ${wilayaError.message}`,
          code: wilayaError.code,
          details: wilayaError.details,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    if (!wilaya) {
      return new Response(
        JSON.stringify({
          error: 'Wilaya not found',
          received_id: body.wilaya_id,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    if (!wilaya.is_active) {
      return new Response(
        JSON.stringify({
          error: 'Wilaya is inactive',
          received_id: body.wilaya_id,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // ============================================
    // VALIDATE COMMUNE
    // ============================================
    const { data: commune, error: communeError } = await supabaseClient
      .from('communes')
      .select('id, is_active')
      .eq('id', body.commune_id)
      .eq('wilaya_id', body.wilaya_id)
      .single()

    console.log('[create-order] commune result:', JSON.stringify(commune))
    console.log('[create-order] commune error:', JSON.stringify(communeError))

    if (communeError || !commune || !commune.is_active) {
      return new Response(
        JSON.stringify({
          error: 'Invalid or inactive commune for selected wilaya',
          details: communeError?.message,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // ============================================
    // COMPUTE DELIVERY FEE
    // ============================================
    let deliveryFee = 0

    if (body.delivery_mode === 'home') {
      deliveryFee = Number(wilaya.delivery_fee_home ?? 0)
    } else if (body.delivery_mode === 'desk') {
      deliveryFee = Number(wilaya.delivery_fee_desk ?? 0)
      if (!deliveryFee || deliveryFee <= 0) {
        return new Response(
          JSON.stringify({
            error: 'Stop desk delivery not available for this wilaya',
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        )
      }
    } else if (body.delivery_mode === 'university') {
      if (!body.university_id) {
        return new Response(
          JSON.stringify({
            error: 'University is required for university delivery',
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        )
      }

      const { data: university, error: uniError } = await supabaseClient
        .from('universities')
        .select('id, is_active')
        .eq('id', body.university_id)
        .single()

      console.log('[create-order] university:', JSON.stringify(university))
      console.log('[create-order] university error:', JSON.stringify(uniError))

      if (uniError || !university || !university.is_active) {
        return new Response(
          JSON.stringify({
            error: 'Invalid university',
            details: uniError?.message,
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        )
      }

      deliveryFee = 0
    }

    // ============================================
    // VALIDATE PRODUCTS AND CALCULATE SUBTOTAL
    // ============================================
    let subtotal = 0
    const orderItems: Array<{
      product_id: string
      variant_id: string
      product_name: string
      variant_description: string
      price: number
      quantity: number
    }> = []

    for (const item of body.items) {
      const { data: variant, error: variantError } = await supabaseClient
        .from('product_variants')
        .select(
          `
          id,
          price,
          stock,
          is_active,
          size,
          color,
          product:products!inner(
            id,
            name,
            is_active
          )
        `
        )
        .eq('id', item.variant_id)
        .single()

      if (variantError || !variant) {
        return new Response(
          JSON.stringify({
            error: `Variant not found: ${item.variant_id}`,
            details: variantError?.message,
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        )
      }

      const variantData = variant as unknown as VariantWithProduct

      if (!variantData.is_active || !variantData.product.is_active) {
        return new Response(
          JSON.stringify({
            error: `Product is not available: ${variantData.product.name}`,
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        )
      }

      if (variantData.stock < item.quantity) {
        return new Response(
          JSON.stringify({
            error: `Insufficient stock for ${variantData.product.name}. Available: ${variantData.stock}`,
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        )
      }

      if (item.quantity <= 0 || item.quantity > 100) {
        return new Response(
          JSON.stringify({ error: 'Invalid quantity' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        )
      }

      const itemTotal = variantData.price * item.quantity
      subtotal += itemTotal

      orderItems.push({
        product_id: variantData.product.id,
        variant_id: variantData.id,
        product_name: variantData.product.name,
        variant_description: `${variantData.size || ''} ${
          variantData.color || ''
        }`.trim(),
        price: variantData.price,
        quantity: item.quantity,
      })
    }

    // ============================================
    // TOTALS
    // ============================================
    const total = subtotal + deliveryFee

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.floor(
      Math.random() * 1000
    )}`

    console.log('[create-order] subtotal:', subtotal)
    console.log('[create-order] deliveryFee:', deliveryFee)
    console.log('[create-order] total:', total)
    console.log('[create-order] orderNumber:', orderNumber)

    // ============================================
    // CREATE ORDER
    // ============================================
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_name: body.customer_name,
        customer_phone: body.customer_phone,
        wilaya_id: body.wilaya_id,
        commune_id: body.commune_id,
        address: body.address,
        note: body.note || null,
        delivery_mode: body.delivery_mode,
        university_id:
          body.delivery_mode === 'university' ? body.university_id : null,
        subtotal,
        delivery_fee: deliveryFee,
        total,
        status: 'PENDING',
      })
      .select()
      .single()

    if (orderError) {
      console.log('[create-order] order insert error:', JSON.stringify(orderError))
      return new Response(
        JSON.stringify({
          error: 'Failed to create order',
          details: orderError.message,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    // ============================================
    // INSERT ORDER ITEMS
    // ============================================
    const orderItemsWithOrderId = orderItems.map((item) => ({
      ...item,
      order_id: order.id,
    }))

    const { error: itemsError } = await supabaseClient
      .from('order_items')
      .insert(orderItemsWithOrderId)

    if (itemsError) {
      console.log(
        '[create-order] items insert error:',
        JSON.stringify(itemsError)
      )
      // Rollback: delete the order if items failed to insert
      await supabaseClient.from('orders').delete().eq('id', order.id)

      return new Response(
        JSON.stringify({
          error: 'Failed to create order items',
          details: itemsError.message,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    // ============================================
    // DECREMENT STOCK (unwrapping packs)
    // ============================================
    for (const item of body.items) {
      const { data: components, error: componentsError } = await supabaseClient
        .rpc('get_order_components', {
          p_variant_id: item.variant_id,
          p_quantity: item.quantity,
        })

      if (componentsError || !components) {
        console.error(
          '[create-order] Failed to resolve order components:',
          componentsError
        )
        continue
      }

      for (const component of components as Array<{
        variant_id: string
        quantity: number
      }>) {
        const { error: stockError } = await supabaseClient.rpc(
          'decrement_stock',
          {
            variant_id: component.variant_id,
            quantity: component.quantity,
          }
        )

        if (stockError) {
          console.error(
            `[create-order] Failed to update stock for variant ${component.variant_id}:`,
            stockError
          )
        }
      }
    }

    // ============================================
    // SUCCESS
    // ============================================
    return new Response(
      JSON.stringify({
        success: true,
        order: {
          order_number: order.order_number,
          total: order.total,
          status: order.status,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 201,
      }
    )
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    console.error('[create-order] Unexpected error:', errorMessage)
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: errorMessage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})