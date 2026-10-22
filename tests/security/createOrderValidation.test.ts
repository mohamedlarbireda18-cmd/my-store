import assert from 'node:assert/strict'
import test from 'node:test'
import {
  DEFAULT_ALLOWED_ORIGINS,
  getBodyByteLimit,
  isAllowedOrigin,
  normalizePhone,
  OrderValidationError,
  parseAllowedOrigins,
  validateOrderPayload,
} from '../../supabase/functions/create-order/validation.ts'

const VALID_UUID = '8b3e2f4a-9c1d-4e7b-8a2f-1d5c6e7f8a9b'
const OTHER_UUID = '3f1a2b4c-5d6e-4f70-9a1b-2c3d4e5f6a7b'

function validPayload(overrides: Record<string, unknown> = {}) {
  return {
    customer_name: 'Amine Benaissa',
    customer_phone: '0550123456',
    wilaya_id: VALID_UUID,
    commune_id: OTHER_UUID,
    address: '12 rue Didouche Mourad, Alger',
    note: 'Appeler avant livraison',
    delivery_mode: 'home',
    idempotency_key: VALID_UUID,
    items: [{ variant_id: OTHER_UUID, quantity: 2 }],
    ...overrides,
  }
}

test('accepts a well-formed order payload', () => {
  const order = validateOrderPayload(validPayload())

  assert.equal(order.customer_name, 'Amine Benaissa')
  assert.equal(order.customer_phone, '0550123456')
  assert.equal(order.delivery_mode, 'home')
  assert.equal(order.university_id, null)
  assert.deepEqual(order.items, [
    { variant_id: OTHER_UUID, quantity: 2 },
  ])
})

test('merges duplicate variant lines', () => {
  const order = validateOrderPayload(
    validPayload({
      items: [
        { variant_id: OTHER_UUID, quantity: 2 },
        { variant_id: OTHER_UUID, quantity: 3 },
      ],
    })
  )

  assert.deepEqual(order.items, [
    { variant_id: OTHER_UUID, quantity: 5 },
  ])
})

test('rejects duplicate lines exceeding the per-line cap', () => {
  assert.throws(
    () =>
      validateOrderPayload(
        validPayload({
          items: [
            { variant_id: OTHER_UUID, quantity: 60 },
            { variant_id: OTHER_UUID, quantity: 60 },
          ],
        })
      ),
    (error: unknown) =>
      error instanceof OrderValidationError && error.code === 'INVALID_QUANTITY'
  )
})

test('rejects too many distinct items', () => {
  const items = Array.from({ length: 51 }, (_, index) => ({
    variant_id: `${index.toString(16).padStart(8, '0')}-1111-4111-8111-111111111111`,
    quantity: 1,
  }))

  assert.throws(
    () => validateOrderPayload(validPayload({ items })),
    (error: unknown) =>
      error instanceof OrderValidationError && error.code === 'INVALID_ITEMS'
  )
})

test('rejects malformed order payloads', () => {
  assert.throws(() => validateOrderPayload(null))
  assert.throws(() => validateOrderPayload('not-an-object'))
  assert.throws(() => validateOrderPayload(validPayload({ items: [] })))
  assert.throws(() =>
    validateOrderPayload(validPayload({ wilaya_id: 'not-a-uuid' }))
  )
  assert.throws(() =>
    validateOrderPayload(validPayload({ delivery_mode: 'rocket' }))
  )
})

test('rejects invalid quantities including floats and negatives', () => {
  for (const quantity of [0, -1, 1.5, 101, '2', null]) {
    assert.throws(
      () =>
        validateOrderPayload(
          validPayload({ items: [{ variant_id: OTHER_UUID, quantity }] })
        ),
      (error: unknown) => error instanceof OrderValidationError
    )
  }
})

test('requires a university identifier only for university delivery', () => {
  assert.throws(
    () => validateOrderPayload(validPayload({ delivery_mode: 'university' })),
    (error: unknown) =>
      error instanceof OrderValidationError && error.code === 'INVALID_ORDER'
  )

  const order = validateOrderPayload(
    validPayload({ delivery_mode: 'university', university_id: VALID_UUID })
  )
  assert.equal(order.university_id, VALID_UUID)

  const homeOrder = validateOrderPayload(
    validPayload({ delivery_mode: 'home', university_id: VALID_UUID })
  )
  assert.equal(homeOrder.university_id, null)
})

test('normalizes phone numbers and rejects invalid ones', () => {
  assert.equal(normalizePhone('0550 12 34 56'), '0550123456')
  assert.equal(normalizePhone('0660-11-22-33'), '0660112233')

  for (const phone of ['12345', '05501234567', '0950123456', '', 'abc']) {
    assert.throws(
      () => normalizePhone(phone),
      (error: unknown) =>
        error instanceof OrderValidationError && error.code === 'INVALID_PHONE'
    )
  }
})

test('strips control characters from free-text fields', () => {
  assert.throws(
    () => validateOrderPayload(validPayload({ customer_name: 'Amine\u0000' })),
    (error: unknown) => error instanceof OrderValidationError
  )
})

test('resolves CORS origins from environment configuration', () => {
  const allowed = parseAllowedOrigins([
    'https://shop.dzairtech.com, https://www.dzairtech.com',
    undefined,
  ])

  for (const origin of DEFAULT_ALLOWED_ORIGINS) {
    assert.equal(allowed.has(origin), true)
  }

  assert.equal(allowed.has('https://shop.dzairtech.com'), true)
  assert.equal(allowed.has('https://www.dzairtech.com'), true)
  assert.equal(allowed.has('https://evil.example.com'), false)

  assert.equal(isAllowedOrigin(null, allowed), true)
  assert.equal(isAllowedOrigin('https://shop.dzairtech.com', allowed), true)
  assert.equal(isAllowedOrigin('https://evil.example.com', allowed), false)
})

test('ignores non-http origins and enforces the body size limit', () => {
  const allowed = parseAllowedOrigins(['javascript:alert(1)', 'not a url'])

  assert.equal(allowed.size, DEFAULT_ALLOWED_ORIGINS.length)
  assert.equal(getBodyByteLimit(), 32 * 1024)
})
