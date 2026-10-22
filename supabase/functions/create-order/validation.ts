export type DeliveryMode = 'home' | 'desk' | 'university'

export interface NormalizedOrderItem {
  variant_id: string
  quantity: number
}

export interface NormalizedOrder {
  customer_name: string
  customer_phone: string
  wilaya_id: string
  commune_id: string
  address: string
  note: string | null
  delivery_mode: DeliveryMode
  university_id: string | null
  idempotency_key: string | null
  items: NormalizedOrderItem[]
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const PHONE_PATTERN = /^0[567][0-9]{8}$/
const MAX_ITEMS = 50
const MAX_ITEM_QUANTITY = 100
const MAX_BODY_BYTES = 32 * 1024

export const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:4173',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:4173',
  'http://127.0.0.1:5173',
]

export class OrderValidationError extends Error {
  readonly code: string

  constructor(code: string, message: string) {
    super(message)
    this.name = 'OrderValidationError'
    this.code = code
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function requiredText(
  value: unknown,
  field: string,
  minLength: number,
  maxLength: number
): string {
  if (typeof value !== 'string') {
    throw new OrderValidationError('INVALID_ORDER', `Invalid ${field}`)
  }

  const normalized = value.trim()
  if (normalized.length < minLength || normalized.length > maxLength) {
    throw new OrderValidationError('INVALID_ORDER', `Invalid ${field}`)
  }

  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(normalized)) {
    throw new OrderValidationError('INVALID_ORDER', `Invalid ${field}`)
  }

  return normalized
}

function optionalText(
  value: unknown,
  field: string,
  maxLength: number
): string | null {
  if (value === undefined || value === null || value === '') return null
  return requiredText(value, field, 1, maxLength)
}

function requiredUuid(value: unknown, field: string): string {
  if (typeof value !== 'string' || !UUID_PATTERN.test(value)) {
    throw new OrderValidationError('INVALID_ORDER', `Invalid ${field}`)
  }
  return value.toLowerCase()
}

function optionalUuid(value: unknown, field: string): string | null {
  if (value === undefined || value === null || value === '') return null
  return requiredUuid(value, field)
}

export function normalizePhone(value: unknown): string {
  if (typeof value !== 'string') {
    throw new OrderValidationError(
      'INVALID_PHONE',
      'Invalid phone number format'
    )
  }

  const normalized = value.replace(/[\s-]/g, '')
  if (!PHONE_PATTERN.test(normalized)) {
    throw new OrderValidationError(
      'INVALID_PHONE',
      'Invalid phone number format'
    )
  }

  return normalized
}

export function validateOrderPayload(input: unknown): NormalizedOrder {
  if (!isRecord(input)) {
    throw new OrderValidationError('INVALID_ORDER', 'Invalid order payload')
  }

  const customerName = requiredText(
    input.customer_name,
    'customer name',
    2,
    120
  )
  const customerPhone = normalizePhone(input.customer_phone)
  const wilayaId = requiredUuid(input.wilaya_id, 'wilaya')
  const communeId = requiredUuid(input.commune_id, 'commune')
  const address = requiredText(input.address, 'address', 5, 500)
  const note = optionalText(input.note, 'note', 1000)
  const idempotencyKey = optionalUuid(input.idempotency_key, 'idempotency key')

  const deliveryMode = input.delivery_mode
  if (
    deliveryMode !== 'home' &&
    deliveryMode !== 'desk' &&
    deliveryMode !== 'university'
  ) {
    throw new OrderValidationError(
      'INVALID_ORDER',
      'Invalid delivery mode'
    )
  }

  const universityId =
    deliveryMode === 'university'
      ? requiredUuid(input.university_id, 'university')
      : null

  if (!Array.isArray(input.items) || input.items.length === 0) {
    throw new OrderValidationError('INVALID_ITEMS', 'No items in order')
  }

  if (input.items.length > MAX_ITEMS) {
    throw new OrderValidationError('INVALID_ITEMS', 'Too many order items')
  }

  const aggregated = new Map<string, number>()

  for (const item of input.items) {
    if (!isRecord(item)) {
      throw new OrderValidationError('INVALID_ITEMS', 'Invalid order item')
    }

    const variantId = requiredUuid(item.variant_id, 'variant')
    const quantity = item.quantity
    if (
      typeof quantity !== 'number' ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > MAX_ITEM_QUANTITY
    ) {
      throw new OrderValidationError(
        'INVALID_QUANTITY',
        'Invalid quantity'
      )
    }

    const nextQuantity = (aggregated.get(variantId) ?? 0) + quantity
    if (nextQuantity > MAX_ITEM_QUANTITY) {
      throw new OrderValidationError(
        'INVALID_QUANTITY',
        'Invalid quantity'
      )
    }

    aggregated.set(variantId, nextQuantity)
  }

  return {
    customer_name: customerName,
    customer_phone: customerPhone,
    wilaya_id: wilayaId,
    commune_id: communeId,
    address,
    note,
    delivery_mode: deliveryMode,
    university_id: universityId,
    idempotency_key: idempotencyKey,
    items: Array.from(aggregated, ([variant_id, quantity]) => ({
      variant_id,
      quantity,
    })),
  }
}

export function parseAllowedOrigins(rawValues: Array<string | undefined>): Set<string> {
  const origins = new Set(DEFAULT_ALLOWED_ORIGINS)

  for (const raw of rawValues) {
    if (!raw) continue

    for (const candidate of raw.split(',')) {
      const trimmed = candidate.trim()
      if (!trimmed) continue

      try {
        const parsed = new URL(trimmed)
        if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') continue
        origins.add(parsed.origin)
      } catch {
        continue
      }
    }
  }

  return origins
}

export function isAllowedOrigin(
  origin: string | null,
  allowedOrigins: Set<string>
): boolean {
  return origin === null || allowedOrigins.has(origin)
}

export function getBodyByteLimit(): number {
  return MAX_BODY_BYTES
}
