import { Package } from 'lucide-react'
import type { PublicProduct } from '../../hooks/usePublicProducts'
import { ProductCard } from '../ProductCard/ProductCard'
import './ProductGrid.css'

interface ProductGridProps {
  products: PublicProduct[]
  isLoading?: boolean
  emptyTitle?: string
  emptyMessage?: string
  skeletonCount?: number
}

export function ProductGrid({
  products,
  isLoading,
  emptyTitle = 'No products found',
  emptyMessage = 'Check back soon for new products.',
  skeletonCount = 8,
}: ProductGridProps) {
  if (isLoading) {
    return (
      <div className="c-product-grid">
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <div key={i} className="c-product-grid__skeleton">
            <div className="c-product-grid__skeleton-img c-skeleton" />
            <div className="c-product-grid__skeleton-line c-skeleton" />
            <div className="c-product-grid__skeleton-line c-skeleton" />
            <div className="c-product-grid__skeleton-line c-skeleton" style={{ width: '40%' }} />
          </div>
        ))}
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="c-product-grid__empty">
        <div className="c-product-grid__empty-icon">
          <Package size={28} />
        </div>
        <h3 className="c-product-grid__empty-title">{emptyTitle}</h3>
        <p className="c-product-grid__empty-desc">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="c-product-grid">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}