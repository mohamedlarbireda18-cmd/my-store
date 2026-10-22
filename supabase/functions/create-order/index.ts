import { serve } from 'std/http/server.ts'
import { createClient } from '@supabase/supabase-js'
import {
  getBodyByteLimit,
  isAllowedOrigin,
  OrderValidationError,
  parseAllowedOrigins,
  validateOrderPayload,
  type NormalizedOrder,
} from './validation.ts'

const allowedOrigins = parseAllowedOrigins([
  Deno.env.get('ALLOWED_ORIGINS'),
  Deno.env.get('SITE_URL'),
])

const userErrors: Record<
  string,
  { status: number; message: string }
> = {
  INVALID_ORDER: { status: 400, message: 'Invalid order details' },
  INVALID_PHONE: { status: 400, message: 'Invalid phone number format' },
  INVALID_ITEMS: { status: 400, message: 'Invalid order items' },
  INVALID_QUANTITY: { status: 400, message: 'Invalid quantity' },
  PRODUCT_UNAVAILABLE: {
    status: 409,
    message: 'One or more products are unavailable',
  },
  INSUFFICIENT_STOCK: {
    status: 409,
    message: 'One or more items are out of stock',
  },
  PACK_UNAVAILABLE: {
    status: 409,
    message: 'One or more products are unavailable',
  },
  INVALID_WILAYA: { status: 400, message: 'Invalid delivery details' },
  INVALID_COMMUNE: { status: 400, message: 'Invalid delivery details' },
  INVALID_UNIVERSITY: { status: 400, message: 'Invalid delivery details' },
  DELIVERY_UNAVAILABLE: {
    status: 400,
    message: 'Delivery option unavailable',
  },
  STORE_CLOSED: { status: 503, message: 'The store is currently closed' },
}

function baseHeaders(origin: string | null): Headers {
  const headers = new Headers({
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    Vary: 'Origin',
  })

  if (origin && allowedOrigins.has(origin)) {
    headers.set('Access-Control-Allow-Origin', origin)
    headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
    headers.set('Access-Control-Allow-Headers', 'authorization, apikey, content-type')
    headers.set('Access-Control-Max-Age', '600')
  }

  return headers
}

function jsonResponse(
  body: unknown,
  status: number,
  origin: string | null
): Response {
  const headers = baseHeaders(origin)
  headers.set('Content-Type', 'application/json; charset=utf-8')
  return new Response(JSON.stringify(body), { status, headers })
}

function getClientIp(req: Request): string {
  const candidate =
    req.headers.get('cf-connecting-ip') ??
    req.headers.get('x-real-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0] ??
    'unknown'

  return candidate.trim().slice(0, 100)
}

function getSafeRpcError(message: string | undefined): {
  status: number
  message: string
} {
  if (message) {
    for (const [code, error] of Object.entries(userErrors)) {
      if (message.includes(code)) return error
    }
  }

  return { status: 500, message: 'Unable to create order' }
}

serve(async (req: Request) => {
  const origin = req.headers.get('origin')

  if (!isAllowedOrigin(origin, allowedOrigins)) {
    return new Response('Forbidden', {
      status: 403,
      headers: baseHeaders(origin),
    })
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: baseHeaders(origin) })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405, origin)
  }

  const contentLength = Number(req.headers.get('content-length') ?? 0)
  if (Number.isFinite(contentLength) && contentLength > getBodyByteLimit()) {
    return jsonResponse({ error: 'Request too large' }, 413, origin)
  }

  const contentType = req.headers.get('content-type') ?? ''
  if (!contentType.toLowerCase().includes('application/json')) {
    return jsonResponse({ error: 'Unsupported content type' }, 415, origin)
  }

  let payload: unknown
  try {
    const rawBody = await req.text()
    if (new TextEncoder().encode(rawBody).byteLength > getBodyByteLimit()) {
      return jsonResponse({ error: 'Request too large' }, 413, origin)
    }
    payload = JSON.parse(rawBody)
  } catch {
    return jsonResponse({ error: 'Invalid request body' }, 400, origin)
  }

  let order: NormalizedOrder
  try {
    order = validateOrderPayload(payload)
  } catch (error) {
    if (error instanceof OrderValidationError) {
      return jsonResponse({ error: error.message }, 400, origin)
    }
    return jsonResponse({ error: 'Invalid request body' }, 400, origin)
  }

  const serviceRoleKey =
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ??
    Deno.env.get('SERVICE_ROLE_KEY')

  if (!serviceRoleKey) {
    console.error('[create-order] Missing service role configuration')
    return jsonResponse(
      { error: 'Unable to create order' },
      500,
      origin
    )
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    serviceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  )

  const { data: requestAllowed, error: rateLimitError } =
    await supabaseClient.rpc('check_order_rate_limit', {
      p_client_ip: getClientIp(req),
      p_phone: order.customer_phone,
    })

  if (rateLimitError) {
    console.error('[create-order] Rate limit check failed', {
      code: rateLimitError.code ?? 'unknown',
    })
    return jsonResponse({ error: 'Unable to create order' }, 500, origin)
  }

  if (requestAllowed !== true) {
    return jsonResponse(
      { error: 'Too many order attempts. Please try again later.' },
      429,
      origin
    )
  }

  const { data, error } = await supabaseClient.rpc('create_order_atomic', {
    p_order: order,
  })

  if (error) {
    console.error('[create-order] Order transaction failed', {
      code: error.code ?? 'unknown',
    })
    const safeError = getSafeRpcError(error.message)
    return jsonResponse({ error: safeError.message }, safeError.status, origin)
  }

  if (!data?.success) {
    return jsonResponse({ error: 'Unable to create order' }, 500, origin)
  }

  return jsonResponse(data, 201, origin)
})
