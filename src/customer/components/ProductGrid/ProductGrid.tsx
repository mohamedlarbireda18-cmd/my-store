import { Package } from 'lucide-react'
import type { PublicProduct } from '../../hooks/usePublicProducts'
import { ProductCard } from '../ProductCard/ProductCard'
import { useLanguage } from '../../../i18n/LanguageContext'
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
  emptyTitle,
  emptyMessage,
  skeletonCount = 8,
}: ProductGridProps) {
  const { t } = useLanguage()
  const title = emptyTitle ?? t('products.emptyTitle')
  const message = emptyMessage ?? t('products.emptyMessage')

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
        <h3 className="c-product-grid__empty-title">{title}</h3>
        <p className="c-product-grid__empty-desc">{message}</p>
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