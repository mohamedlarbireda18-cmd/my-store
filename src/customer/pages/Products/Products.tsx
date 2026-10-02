import { useMemo, useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { X, ChevronDown, Check } from 'lucide-react'
import { usePublicProducts } from '../../hooks/usePublicProducts'
import { usePublicCategories } from '../../hooks/usePublicCategories'
import { ProductGrid } from '../../components/ProductGrid/ProductGrid'
import './Products.css'

type SortOption = 'newest' | 'price-asc' | 'price-desc' | 'name-asc'

interface PricePreset {
  id: string
  label: string
  min: number
  max: number
}

const PRICE_PRESETS: PricePreset[] = [
  { id: 'all', label: 'All prices', min: 0, max: Infinity },
  { id: 'p1', label: 'Under 1,000 DA', min: 0, max: 1000 },
  { id: 'p2', label: '1,000 – 2,000 DA', min: 1000, max: 2000 },
  { id: 'p3', label: '2,000 – 3,000 DA', min: 2000, max: 3000 },
  { id: 'p4', label: 'Over 3,000 DA', min: 3000, max: Infinity },
]

export function Products() {
  const { data: products = [], isLoading } = usePublicProducts()
  const { data: categories = [] } = usePublicCategories()

  const [searchParams, setSearchParams] = useSearchParams()
  const categoryParam = searchParams.get('category') ?? ''
  const [pricePresetId, setPricePresetId] = useState('all')
  const [sort, setSort] = useState<SortOption>('newest')
  const [isSortOpen, setIsSortOpen] = useState(false)
  const [isPriceOpen, setIsPriceOpen] = useState(false)

  const activePreset =
    PRICE_PRESETS.find((p) => p.id === pricePresetId) ?? PRICE_PRESETS[0]

  const filtered = useMemo(() => {
    let list = [...products]

    if (categoryParam) {
      list = list.filter((p) => p.category?.slug === categoryParam)
    }

    list = list.filter(
      (p) =>
        p.min_price >= activePreset.min && p.min_price <= activePreset.max
    )

    switch (sort) {
      case 'price-asc':
        list.sort((a, b) => a.min_price - b.min_price)
        break
      case 'price-desc':
        list.sort((a, b) => b.min_price - a.min_price)
        break
      case 'name-asc':
        list.sort((a, b) => a.name.localeCompare(b.name))
        break
      default:
        break
    }

    return list
  }, [products, categoryParam, activePreset, sort])

  const hasActiveFilters = !!categoryParam || pricePresetId !== 'all'

  const setCategory = (slug: string) => {
    if (slug) setSearchParams({ category: slug })
    else setSearchParams({})
  }

  const clearAll = () => {
    setSearchParams({})
    setPricePresetId('all')
  }

  useEffect(() => {
    const handler = () => {
      setIsSortOpen(false)
      setIsPriceOpen(false)
    }
    if (isSortOpen || isPriceOpen) {
      document.addEventListener('click', handler)
      return () => document.removeEventListener('click', handler)
    }
  }, [isSortOpen, isPriceOpen])

  const sortLabels: Record<SortOption, string> = {
    newest: 'Newest',
    'price-asc': 'Price: Low to High',
    'price-desc': 'Price: High to Low',
    'name-asc': 'Name: A to Z',
  }

  return (
    <div className="c-products">
      <div className="c-container">
        {/* Header */}
        <div className="c-products__header">
          <div>
            <h1 className="c-page-title">All Products</h1>
            <p className="c-page-subtitle">
              Find the best products for your needs.
            </p>
          </div>

          <div
            className="c-products__sort"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="c-products__sort-btn"
              onClick={() => {
                setIsSortOpen((v) => !v)
                setIsPriceOpen(false)
              }}
            >
              <span className="c-products__sort-btn-label">Sort by:</span>
              <span className="c-products__sort-btn-value">
                {sortLabels[sort]}
              </span>
              <ChevronDown
                size={14}
                className={`c-products__sort-chevron ${
                  isSortOpen ? 'c-products__sort-chevron--open' : ''
                }`}
              />
            </button>

            {isSortOpen && (
              <div className="c-products__dropdown">
                {(Object.keys(sortLabels) as SortOption[]).map((key) => (
                  <button
                    key={key}
                    className={`c-products__dropdown-item ${
                      sort === key ? 'c-products__dropdown-item--active' : ''
                    }`}
                    onClick={() => {
                      setSort(key)
                      setIsSortOpen(false)
                    }}
                  >
                    <span>{sortLabels[key]}</span>
                    {sort === key && <Check size={14} />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Filter bar */}
        <div className="c-products__filterbar">
          <div className="c-products__pills">
            <button
              className={`c-products__pill ${
                !categoryParam ? 'c-products__pill--active' : ''
              }`}
              onClick={() => setCategory('')}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                className={`c-products__pill ${
                  categoryParam === cat.slug ? 'c-products__pill--active' : ''
                }`}
                onClick={() => setCategory(cat.slug)}
              >
                {cat.name}
                <span className="c-products__pill-count">
                  {cat.product_count}
                </span>
              </button>
            ))}
          </div>

          <div
            className="c-products__price"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className={`c-products__price-btn ${
                pricePresetId !== 'all' ? 'c-products__price-btn--active' : ''
              }`}
              onClick={() => {
                setIsPriceOpen((v) => !v)
                setIsSortOpen(false)
              }}
            >
              {activePreset.label}
              <ChevronDown
                size={14}
                className={`c-products__sort-chevron ${
                  isPriceOpen ? 'c-products__sort-chevron--open' : ''
                }`}
              />
            </button>

            {isPriceOpen && (
              <div className="c-products__dropdown">
                {PRICE_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    className={`c-products__dropdown-item ${
                      pricePresetId === preset.id
                        ? 'c-products__dropdown-item--active'
                        : ''
                    }`}
                    onClick={() => {
                      setPricePresetId(preset.id)
                      setIsPriceOpen(false)
                    }}
                  >
                    <span>{preset.label}</span>
                    {pricePresetId === preset.id && <Check size={14} />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Status */}
        <div className="c-products__status">
          <div className="c-products__chips">
            {categoryParam && (
              <button
                className="c-products__chip"
                onClick={() => setCategory('')}
              >
                {categories.find((c) => c.slug === categoryParam)?.name ??
                  categoryParam}
                <X size={12} />
              </button>
            )}
            {pricePresetId !== 'all' && (
              <button
                className="c-products__chip"
                onClick={() => setPricePresetId('all')}
              >
                {activePreset.label}
                <X size={12} />
              </button>
            )}
            {hasActiveFilters && (
              <button className="c-products__chip-clear" onClick={clearAll}>
                Clear all
              </button>
            )}
          </div>

          <span className="c-products__count">
            <strong>{filtered.length}</strong> product
            {filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        <ProductGrid
          products={filtered}
          isLoading={isLoading}
          emptyTitle={
            hasActiveFilters ? 'No products match your filters' : 'No products'
          }
          emptyMessage={
            hasActiveFilters
              ? 'Try adjusting your filters.'
              : 'Check back soon for new products.'
          }
        />
      </div>
    </div>
  )
}