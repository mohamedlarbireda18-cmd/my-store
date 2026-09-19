export interface CartItem {
  variant_id: string
  product_id: string
  product_name: string
  product_slug: string
  variant_description: string
  price: number
  quantity: number
  image_url: string | null
  max_stock: number
}

const CART_KEY = 'dzairtech_cart_v1'

export function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item): item is CartItem => {
      return (
        item &&
        typeof item.variant_id === 'string' &&
        typeof item.product_id === 'string' &&
        typeof item.product_name === 'string' &&
        typeof item.product_slug === 'string' &&
        typeof item.variant_description === 'string' &&
        typeof item.price === 'number' &&
        typeof item.quantity === 'number' &&
        item.quantity > 0
      )
    })
  } catch {
    return []
  }
}

export function saveCart(items: CartItem[]): void {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(items))
  } catch {
    /* ignore quota errors */
  }
}

export function clearCartStorage(): void {
  try {
    localStorage.removeItem(CART_KEY)
  } catch {
    /* ignore */
  }
}