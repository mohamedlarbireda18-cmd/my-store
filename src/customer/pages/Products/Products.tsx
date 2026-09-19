import { useMemo, useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SlidersHorizontal, X, ChevronDown } from 'lucide-react'
import { usePublicProducts } from '../../hooks/usePublicProducts'
import { usePublicCategories } from '../../hooks/usePublicCategories'
import { ProductGrid } from '../../components/ProductGrid/ProductGrid'
import './Products.css'

type SortOption = 'newest' | 'price-asc' | 'price-desc' | 'name-asc'

export function Products() {
  const { data: products = [], isLoading } = usePublicProducts()
  const { data: categories = [] } = usePublicCategories()

  const [searchParams, setSearchParams] = useSearchParams()
  const categoryParam = searchParams.get('category') ?? ''
  const searchParam = searchParams.get('q') ?? ''

  const [search, setSearch] = useState(searchParam)
  const [sort, setSort] = useState<SortOption>('newest')
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500000])
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    categoryParam ? [categoryParam] : []
  )
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)

  // Sync URL param → state
  useEffect(() => {
    if (categoryParam && !selectedCategories.includes(categoryParam)) {
      setSelectedCategories([categoryParam])
    }
  }, [categoryParam])

  // Max price across all products
  const maxPrice = useMemo(() => {
    if (products.length === 0) return 500000
    return Math.max(...products.map((p) => p.max_price))
  }, [products])

  // Initialize price range when products load
  useEffect(() => {
    setPriceRange([0, maxPrice])
  }, [maxPrice])

  // Filtered + sorted products
  const filtered = useMemo(() => {
    let list = [...products]

    // Category filter
    if (selectedCategories.length > 0) {
      list = list.filter((p) =>
        p.category ? selectedCategories.includes(p.category.slug) : false
      )
    }

    // Search
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.category?.name.toLowerCase() ?? '').includes(q)
      )
    }

    // Price range
    list = list.filter(
      (p) => p.min_price >= priceRange[0] && p.min_price <= priceRange[1]
    )

    // Sort
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
      case 'newest':
      default:
        // Already sorted newest-first from query
        break
    }

    return list
  }, [products, selectedCategories, search, priceRange, sort])

  const toggleCategory = (slug: string) => {
    setSelectedCategories((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    )
  }

  const clearFilters = () => {
    setSelectedCategories([])
    setPriceRange([0, maxPrice])
    setSearch('')
    setSearchParams({})
  }

  const hasActiveFilters =
    selectedCategories.length > 0 ||
    search.trim() !== '' ||
    priceRange[0] > 0 ||
    priceRange[1] < maxPrice

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

          <div className="c-products__sort-wrap">
            <label className="c-products__sort-label">Sort by</label>
            <div className="c-products__sort-inner">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortOption)}
                className="c-products__sort"
              >
                <option value="newest">Newest</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name-asc">Name: A to Z</option>
              </select>
              <ChevronDown size={14} className="c-products__sort-icon" />
            </div>
          </div>
        </div>

        {/* Layout */}
        <div className="c-products__layout">
          {/* Desktop filter sidebar */}
          <aside className="c-products__filters">
            <FilterPanel
              categories={categories}
              selectedCategories={selectedCategories}
              onToggleCategory={toggleCategory}
              priceRange={priceRange}
              onPriceChange={setPriceRange}
              maxPrice={maxPrice}
              onClearFilters={clearFilters}
              hasActiveFilters={hasActiveFilters}
              search={search}
              onSearchChange={setSearch}
            />
          </aside>

          {/* Grid */}
          <div className="c-products__main">
            {/* Mobile filter trigger */}
            <button
              className="c-products__mobile-filter-btn"
              onClick={() => setIsMobileFilterOpen(true)}
            >
              <SlidersHorizontal size={16} />
              Filters
              {hasActiveFilters && (
                <span className="c-products__mobile-filter-dot" />
              )}
            </button>

            <div className="c-products__count">
              <strong>{filtered.length}</strong> product
              {filtered.length !== 1 ? 's' : ''}
            </div>

            <ProductGrid
              products={filtered}
              isLoading={isLoading}
              emptyTitle={
                search || hasActiveFilters
                  ? 'No products match your filters'
                  : 'No products yet'
              }
              emptyMessage={
                search || hasActiveFilters
                  ? 'Try adjusting your filters or search term.'
                  : 'Check back soon for our first drop.'
              }
            />
          </div>
        </div>
      </div>

      {/* Mobile filter sheet */}
      {isMobileFilterOpen && (
        <div
          className="c-products__sheet-backdrop"
          onClick={() => setIsMobileFilterOpen(false)}
        >
          <div
            className="c-products__sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="c-products__sheet-header">
              <h3>Filters</h3>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                aria-label="Close filters"
              >
                <X size={20} />
              </button>
            </div>

            <div className="c-products__sheet-body">
              <FilterPanel
                categories={categories}
                selectedCategories={selectedCategories}
                onToggleCategory={toggleCategory}
                priceRange={priceRange}
                onPriceChange={setPriceRange}
                maxPrice={maxPrice}
                onClearFilters={clearFilters}
                hasActiveFilters={hasActiveFilters}
                search={search}
                onSearchChange={setSearch}
                hideHeader
              />
            </div>

            <div className="c-products__sheet-footer">
              <button
                className="c-btn c-btn--primary c-btn--block"
                onClick={() => setIsMobileFilterOpen(false)}
              >
                Show {filtered.length} result
                {filtered.length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ============================================
   Filter panel (reusable for desktop + mobile)
   ============================================ */
interface FilterPanelProps {
  categories: { id: string; name: string; slug: string; product_count: number }[]
  selectedCategories: string[]
  onToggleCategory: (slug: string) => void
  priceRange: [number, number]
  onPriceChange: (range: [number, number]) => void
  maxPrice: number
  onClearFilters: () => void
  hasActiveFilters: boolean
  search: string
  onSearchChange: (v: string) => void
  hideHeader?: boolean
}

function FilterPanel({
  categories,
  selectedCategories,
  onToggleCategory,
  priceRange,
  onPriceChange,
  maxPrice,
  onClearFilters,
  hasActiveFilters,
  search,
  onSearchChange,
  hideHeader,
}: FilterPanelProps) {
  return (
    <div className="c-filters">
      {!hideHeader && (
        <div className="c-filters__header">
          <h3 className="c-filters__title">Filters</h3>
          {hasActiveFilters && (
            <button className="c-filters__clear" onClick={onClearFilters}>
              Clear all
            </button>
          )}
        </div>
      )}

      {hideHeader && hasActiveFilters && (
        <div className="c-filters__header">
          <span />
          <button className="c-filters__clear" onClick={onClearFilters}>
            Clear all
          </button>
        </div>
      )}

      {/* Search */}
      <div className="c-filters__group">
        <label className="c-filters__label">Search</label>
        <input
          type="text"
          className="c-filters__search"
          placeholder="Search products..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Price range */}
      <div className="c-filters__group">
        <label className="c-filters__label">Price range</label>
        <div className="c-filters__price-display">
          <span>{priceRange[0].toLocaleString()} DA</span>
          <span>{priceRange[1].toLocaleString()} DA</span>
        </div>
        <div className="c-filters__range-inputs">
          <input
            type="range"
            min={0}
            max={maxPrice}
            value={priceRange[0]}
            onChange={(e) =>
              onPriceChange([
                Math.min(Number(e.target.value), priceRange[1] - 100),
                priceRange[1],
              ])
            }
            className="c-filters__range"
          />
          <input
            type="range"
            min={0}
            max={maxPrice}
            value={priceRange[1]}
            onChange={(e) =>
              onPriceChange([
                priceRange[0],
                Math.max(Number(e.target.value), priceRange[0] + 100),
              ])
            }
            className="c-filters__range"
          />
        </div>
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div className="c-filters__group">
          <label className="c-filters__label">Category</label>
          <ul className="c-filters__list">
            {categories.map((cat) => (
              <li key={cat.id}>
                <label className="c-filters__check">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(cat.slug)}
                    onChange={() => onToggleCategory(cat.slug)}
                  />
                  <span className="c-filters__check-label">{cat.name}</span>
                  <span className="c-filters__check-count">
                    {cat.product_count}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}