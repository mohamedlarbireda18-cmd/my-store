import { useMemo, useState } from 'react'
import { Plus, Trash2, Package, AlertCircle } from 'lucide-react'
import type { ProductWithMeta } from '../../../hooks/useProducts'
import { formatPrice } from '../../../utils/format'
import './PackItemsEditor.css'

export interface PackItemDraft {
  variant_id: string
  quantity: number
}

interface PackItemsEditorProps {
  items: PackItemDraft[]
  onChange: (items: PackItemDraft[]) => void
  allProducts: ProductWithMeta[]
  currentProductId?: string
  packPrice: number
}

interface ResolvedItem {
  variant_id: string
  productId: string
  productName: string
  productImage: string | null
  unitPrice: number
  totalStock: number
}

export function PackItemsEditor({
  items,
  onChange,
  allProducts,
  currentProductId,
  packPrice,
}: PackItemsEditorProps) {
  const [selectedProductId, setSelectedProductId] = useState('')

  // Which products are already in the pack (dedupe)
  const alreadyAddedProductIds = useMemo(() => {
    const ids = new Set<string>()
    for (const item of items) {
      for (const p of allProducts) {
        if (p.variants.some((v) => v.id === item.variant_id)) {
          ids.add(p.id)
          break
        }
      }
    }
    return ids
  }, [items, allProducts])

  const selectableProducts = useMemo(() => {
    return allProducts.filter(
      (p) =>
        p.product_type === 'SIMPLE' &&
        p.id !== currentProductId &&
        p.is_active &&
        !alreadyAddedProductIds.has(p.id)
    )
  }, [allProducts, currentProductId, alreadyAddedProductIds])

  // Resolve items to product-level info
  const resolved: ResolvedItem[] = useMemo(() => {
    return items
      .map((item) => {
        for (const p of allProducts) {
          const variant = p.variants.find((v) => v.id === item.variant_id)
          if (variant) {
            const totalStock = p.variants.reduce((sum, v) => sum + v.stock, 0)
            return {
              variant_id: item.variant_id,
              productId: p.id,
              productName: p.name,
              productImage: p.image_url,
              unitPrice: variant.price,
              totalStock,
            }
          }
        }
        return null
      })
      .filter(Boolean) as ResolvedItem[]
  }, [items, allProducts])

  const realPrice = resolved.reduce((sum, r) => sum + r.unitPrice, 0)
  const savings = realPrice - packPrice
  const savingsPercent = realPrice > 0 ? Math.round((savings / realPrice) * 100) : 0

  const handleAdd = () => {
    if (!selectedProductId) return
    const product = allProducts.find((p) => p.id === selectedProductId)
    if (!product) return

    // Pick the first active variant with stock > 0, fallback to first active
    const activeVariants = product.variants.filter((v) => v.is_active)
    const preferred = activeVariants.find((v) => v.stock > 0) || activeVariants[0]
    if (!preferred) return

    onChange([...items, { variant_id: preferred.id, quantity: 1 }])
    setSelectedProductId('')
  }

  const handleRemove = (variantId: string) => {
    onChange(items.filter((i) => i.variant_id !== variantId))
  }

  const canAdd = !!selectedProductId

  return (
    <div className="pack-editor">
      {/* Picker */}
      <div className="pack-editor__picker-simple">
        <select
          className="pack-editor__select"
          value={selectedProductId}
          onChange={(e) => setSelectedProductId(e.target.value)}
        >
          <option value="">Select a product to add...</option>
          {selectableProducts.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
              {p.variants[0] ? ` — ${formatPrice(p.variants[0].price)}` : ''}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="admin-btn admin-btn--primary admin-btn--sm pack-editor__add-btn"
          onClick={handleAdd}
          disabled={!canAdd}
        >
          <Plus size={14} />
          Add
        </button>
      </div>

      <p className="pack-editor__hint">
        Each product you add counts as 1 unit. The pack auto-deactivates when any
        included product runs out of stock.
      </p>

      {/* List */}
      {resolved.length === 0 ? (
        <div className="pack-editor__empty">
          <Package size={32} />
          <p>No products in this pack yet. Add products above.</p>
        </div>
      ) : (
        <div className="pack-editor__list">
          {resolved.map((item) => {
            const outOfStock = item.totalStock === 0
            return (
              <div
                key={item.variant_id}
                className="pack-editor__item pack-editor__item--simple"
              >
                <div className="pack-editor__item-image">
                  {item.productImage ? (
                    <img src={item.productImage} alt={item.productName} />
                  ) : (
                    <Package size={18} />
                  )}
                </div>

                <div className="pack-editor__item-info">
                  <div className="pack-editor__item-name">{item.productName}</div>
                  {outOfStock ? (
                    <div className="pack-editor__item-warn">
                      <AlertCircle size={12} />
                      Out of stock
                    </div>
                  ) : (
                    <div className="pack-editor__item-variant">
                      {item.totalStock} in stock
                    </div>
                  )}
                </div>

                <div className="pack-editor__item-price">
                  <div className="pack-editor__item-total">
                    {formatPrice(item.unitPrice)}
                  </div>
                </div>

                <button
                  type="button"
                  className="pack-editor__item-remove"
                  onClick={() => handleRemove(item.variant_id)}
                  title="Remove"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Summary */}
      {resolved.length > 0 && (
        <div className="pack-editor__summary">
          <div className="pack-editor__summary-row">
            <span>Real price (items separately)</span>
            <span className="pack-editor__summary-real">{formatPrice(realPrice)}</span>
          </div>
          {packPrice > 0 && (
            <>
              <div className="pack-editor__summary-row">
                <span>Pack price</span>
                <span className="pack-editor__summary-pack">
                  {formatPrice(packPrice)}
                </span>
              </div>
              <div className="pack-editor__summary-row pack-editor__summary-row--savings">
                <span>Customer saves</span>
                <span>
                  {formatPrice(Math.max(0, savings))}
                  {savingsPercent > 0 && ` (${savingsPercent}%)`}
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}