// ============================================
// CATEGORY
// ============================================
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

// ============================================
// PRODUCT
// ============================================
export type ProductType = 'SIMPLE' | 'PACK'

export interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  category_id: string | null
  image_url: string | null
  images: string[] | null
  product_type: ProductType
  compare_price: number | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ProductInput {
  name: string
  slug: string
  description?: string | null
  category_id?: string | null
  image_url?: string | null
  images?: string[] | null
  product_type?: ProductType
  compare_price?: number | null
  is_active?: boolean
}

// ============================================
// PACK ITEMS
// ============================================
export interface PackItem {
  id: string
  pack_id: string
  variant_id: string
  quantity: number
  created_at: string
}

export interface PackItemInput {
  pack_id: string
  variant_id: string
  quantity: number
}

// ============================================
// PRODUCT VARIANT
// ============================================
export interface ProductVariant {
  id: string
  product_id: string
  sku: string | null
  size: string | null
  color: string | null
  price: number
  stock: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ProductVariantInput {
  product_id: string
  sku?: string | null
  size?: string | null
  color?: string | null
  price: number
  stock: number
  is_active?: boolean
}

// ============================================
// WILAYA & COMMUNE
// ============================================
export interface Wilaya {
  id: string
  code: string
  name: string
  delivery_fee: number
  is_active: boolean
  created_at: string
}

export interface Commune {
  id: string
  wilaya_id: string
  code: string
  name: string
  is_active: boolean
  created_at: string
}

// ============================================
// ORDER
// ============================================
export type OrderStatus = 'PENDING' | 'ACCEPTED_PENDING' | 'DONE' | 'CANCELLED'

export interface Order {
  id: string
  order_number: string
  customer_name: string
  customer_phone: string
  wilaya_id: string
  commune_id: string
  address: string
  note: string | null
  subtotal: number
  delivery_fee: number
  total: number
  status: OrderStatus
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  variant_id: string
  product_name: string
  variant_description: string
  price: number
  quantity: number
  created_at: string
}

export interface OrderWithMeta extends Order {
  wilaya: { id: string; name: string; code: string } | null
  commune: { id: string; name: string } | null
  items_count: number
}

export interface OrderItemDetailed extends OrderItem {
  product: { id: string; name: string; slug: string; image_url: string | null } | null
  variant: { id: string; size: string | null; color: string | null; sku: string | null } | null
}

export interface OrderDetail extends Order {
  wilaya: { id: string; name: string; code: string } | null
  commune: { id: string; name: string } | null
  order_items: OrderItemDetailed[]
}

// ============================================
// PROFILE
// ============================================
export interface Profile {
  id: string
  full_name: string | null
  role: string
  created_at: string
  updated_at: string
}

// ============================================
// CART
// ============================================
export interface CartItem {
  variant_id: string
  product_id: string
  product_name: string
  product_slug: string
  variant_description: string
  price: number
  quantity: number
  image_url?: string | null
  max_stock: number
}