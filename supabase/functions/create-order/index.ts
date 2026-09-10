// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "std/http/server.ts"
import { createClient } from "@supabase/supabase-js"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // Validate required fields
    if (!body.customer_name || !body.customer_phone || !body.wilaya_id || !body.commune_id || !body.address) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    if (!body.items || body.items.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No items in order' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Validate phone number format (Algerian phone numbers)
    const phoneRegex = /^(0)(5|6|7)[0-9]{8}$/
    if (!phoneRegex.test(body.customer_phone)) {
      return new Response(
        JSON.stringify({ error: 'Invalid phone number format' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Get wilaya delivery fee
    const { data: wilaya, error: wilayaError } = await supabaseClient
      .from('wilayas')
      .select('delivery_fee, is_active')
      .eq('id', body.wilaya_id)
      .single()

    if (wilayaError || !wilaya || !wilaya.is_active) {
      return new Response(
        JSON.stringify({ error: 'Invalid or inactive wilaya' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Validate commune belongs to wilaya
    const { data: commune, error: communeError } = await supabaseClient
      .from('communes')
      .select('id, is_active')
      .eq('id', body.commune_id)
      .eq('wilaya_id', body.wilaya_id)
      .single()

    if (communeError || !commune || !commune.is_active) {
      return new Response(
        JSON.stringify({ error: 'Invalid or inactive commune for selected wilaya' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Validate products and calculate totals
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
      // Get variant with product info
      const { data: variant, error: variantError } = await supabaseClient
        .from('product_variants')
        .select(`
          id,
          price,
          stock,
          is_active,
          product:products!inner(
            id,
            name,
            is_active
          )
        `)
        .eq('id', item.variant_id)
        .single()

      if (variantError || !variant) {
        return new Response(
          JSON.stringify({ error: `Variant not found: ${item.variant_id}` }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      const variantData = variant as unknown as VariantWithProduct

      // Check if variant and product are active
      if (!variantData.is_active || !variantData.product.is_active) {
        return new Response(
          JSON.stringify({ error: `Product is not available: ${variantData.product.name}` }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      // Check stock
      if (variantData.stock < item.quantity) {
        return new Response(
          JSON.stringify({ 
            error: `Insufficient stock for ${variantData.product.name}. Available: ${variantData.stock}` 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      // Validate quantity
      if (item.quantity <= 0 || item.quantity > 100) {
        return new Response(
          JSON.stringify({ error: 'Invalid quantity' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      // Add to subtotal
      const itemTotal = variantData.price * item.quantity
      subtotal += itemTotal

      // Prepare order item
      orderItems.push({
        product_id: variantData.product.id,
        variant_id: variantData.id,
        product_name: variantData.product.name,
        variant_description: `${variantData.size || ''} ${variantData.color || ''}`.trim(),
        price: variantData.price,
        quantity: item.quantity,
      })
    }

    // Calculate total
    const deliveryFee = wilaya.delivery_fee
    const total = subtotal + deliveryFee

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`

    // Create order in transaction
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
        subtotal,
        delivery_fee: deliveryFee,
        total,
        status: 'PENDING',
      })
      .select()
      .single()

    if (orderError) {
      return new Response(
        JSON.stringify({ error: 'Failed to create order', details: orderError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Insert order items
    const orderItemsWithOrderId = orderItems.map(item => ({
      ...item,
      order_id: order.id,
    }))

    const { error: itemsError } = await supabaseClient
      .from('order_items')
      .insert(orderItemsWithOrderId)

    if (itemsError) {
      // Rollback: delete the order if items failed to insert
      await supabaseClient.from('orders').delete().eq('id', order.id)
      
      return new Response(
        JSON.stringify({ error: 'Failed to create order items', details: itemsError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Update stock for each item
    for (const item of body.items) {
      const { error: stockError } = await supabaseClient.rpc('decrement_stock', {
        variant_id: item.variant_id,
        quantity: item.quantity
      })

      if (stockError) {
        console.error('Failed to update stock:', stockError)
        // Don't fail the order if stock update fails, just log it
      }
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        order: {
          order_number: order.order_number,
          total: order.total,
          status: order.status,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 201 }
    )

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CategoryInput {
  name: string
  slug: string
  description?: string | null
  is_active?: boolean
}