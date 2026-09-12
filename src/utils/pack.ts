import type { ProductWithMeta } from '../hooks/useProducts'
import type { ProductVariant } from '../types'

export interface PackItemDetailed {
  variant: ProductVariant
  product: { id: string; name: string; image_url: string | null }
  quantity: number
  lineTotal: number
}

/**
 * Compute the "real price" of a pack if items were bought separately.
 */
export function computePackRealPrice(items: PackItemDetailed[]): number {
  return items.reduce((sum, item) => sum + item.lineTotal, 0)
}

/**
 * Given a pack's items and all products (with variants), resolve full details.
 */
export function resolvePackItems(
  packId: string,
  allProducts: ProductWithMeta[]
): PackItemDetailed[] {
  const pack = allProducts.find((p) => p.id === packId)
  if (!pack || !pack.pack_items) return []

  const result: PackItemDetailed[] = []

  for (const item of pack.pack_items) {
    // Find the product that owns this variant
    const owner = allProducts.find((p) =>
      p.variants.some((v) => v.id === item.variant_id)
    )
    if (!owner) continue

    const variant = owner.variants.find((v) => v.id === item.variant_id)
    if (!variant) continue

    result.push({
      variant,
      product: {
        id: owner.id,
        name: owner.name,
        image_url: owner.image_url,
      },
      quantity: item.quantity,
      lineTotal: variant.price * item.quantity,
    })
  }

  return result
}