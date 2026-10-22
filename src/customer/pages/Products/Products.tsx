import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { X, ChevronDown, Check, Search, Tag } from 'lucide-react'
import { usePublicProducts } from '../../hooks/usePublicProducts'
import { usePublicCategories } from '../../hooks/usePublicCategories'
import { ProductGrid } from '../../components/ProductGrid/ProductGrid'
import { useLanguage } from '../../../i18n/LanguageContext'
import type { TranslationKey } from '../../../i18n/translations'
import './Products.css'

type SortOption = 'newest' | 'price-asc' | 'price-desc' | 'name-asc'

interface PricePreset {
  id: string
  labelKey: TranslationKey
  min: number
  max: number
}

const PRICE_PRESETS: PricePreset[] = [
  { id: 'all', labelKey: 'products.allPrices', min: 0, max: Infinity },
  { id: 'p1', labelKey: 'products.priceUnder1000', min: 0, max: 1000 },
  { id: 'p2', labelKey: 'products.price1000To2000', min: 1000, max: 2000 },
  { id: 'p3', labelKey: 'products.price2000To3000', min: 2000, max: 3000 },
  { id: 'p4', labelKey: 'products.priceOver3000', min: 3000, max: Infinity },
]

const SORT_LABEL_KEYS: Record<SortOption, TranslationKey> = {
  newest: 'products.sortNewest',
  'price-asc': 'products.sortPriceAsc',
  'price-desc': 'products.sortPriceDesc',
  'name-asc': 'products.sortNameAsc',
}

const SORT_OPTIONS = Object.keys(SORT_LABEL_KEYS) as SortOption[]

export function Products() {
  const { t } = useLanguage()
  const { data: products = [], isLoading } = usePublicProducts()
  const { data: categories = [] } = usePublicCategories()

  const [searchParams, setSearchParams] = useSearchParams()
  const categoryParam = searchParams.get('category') ?? ''
  const queryParam = searchParams.get('q')?.trim() ?? ''
  const priceParam = searchParams.get('price') ?? 'all'
  const sortParam = searchParams.get('sort') ?? 'newest'
  const dealsOnly = searchParams.get('deals') === '1'

  const pricePresetId = PRICE_PRESETS.some((preset) => preset.id === priceParam)
    ? priceParam
    : 'all'
  const sort: SortOption = SORT_OPTIONS.includes(sortParam as SortOption)
    ? (sortParam as SortOption)
    : 'newest'

  const [searchInput, setSearchInput] = useState(queryParam)
  const [isSortOpen, setIsSortOpen] = useState(false)
  const [isPriceOpen, setIsPriceOpen] = useState(false)

  const activePreset =
    PRICE_PRESETS.find((preset) => preset.id === pricePresetId) ??
    PRICE_PRESETS[0]

  useEffect(() => {
    setSearchInput(queryParam)
  }, [queryParam])

  useEffect(() => {
    const handleOutsideClick = () => {
      setIsSortOpen(false)
      setIsPriceOpen(false)
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsSortOpen(false)
        setIsPriceOpen(false)
      }
    }

    if (isSortOpen || isPriceOpen) {
      document.addEventListener('click', handleOutsideClick)
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('click', handleOutsideClick)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isSortOpen, isPriceOpen])

  const filtered = useMemo(() => {
    const normalizedQuery = queryParam.toLocaleLowerCase('fr')
    let list = [...products]

    if (categoryParam) {
      list = list.filter((product) => product.category?.slug === categoryParam)
    }

    if (normalizedQuery) {
      list = list.filter((product) => {
        const searchable = [
          product.name,
          product.description ?? '',
          product.category?.name ?? '',
        ]
          .join(' ')
          .toLocaleLowerCase('fr')

        return searchable.includes(normalizedQuery)
      })
    }

    if (dealsOnly) {
      list = list.filter(
        (product) =>
          product.compare_price && product.compare_price > product.min_price
      )
    }

    list = list.filter(
      (product) =>
        product.min_price >= activePreset.min &&
        product.min_price <= activePreset.max
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
  }, [products, categoryParam, queryParam, dealsOnly, activePreset, sort])

  const hasActiveFilters =
    !!queryParam ||
    !!categoryParam ||
    pricePresetId !== 'all' ||
    dealsOnly

  const updateParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams)

    if (value) next.set(key, value)
    else next.delete(key)

    setSearchParams(next, { replace: true })
  }

  const setCategory = (slug: string) => {
    updateParam('category', slug || null)
  }

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    updateParam('q', searchInput.trim() || null)
  }

  const clearSearch = () => {
    setSearchInput('')
    updateParam('q', null)
  }

  const clearAll = () => {
    setSearchInput('')
    setSearchParams({}, { replace: true })
    setIsSortOpen(false)
    setIsPriceOpen(false)
  }

  const emptyTitle = queryParam
    ? t('products.noSearchTitle', { query: queryParam })
    : hasActiveFilters
    ? t('products.noMatchTitle')
    : t('products.noProductsTitle')

  const emptyMessage = queryParam
    ? t('products.noSearchMessage')
    : hasActiveFilters
    ? t('products.noMatchMessage')
    : t('products.noProductsMessage')

  const activeCategoryName = categories.find(
    (category) => category.slug === categoryParam
  )?.name

  return (
    <div className="c-products">
      <div className="c-container">
        <div className="c-products__header">
          <div className="c-products__intro">
            <span className="c-section-eyebrow">
              {t('products.eyebrow')}
            </span>
            <h1 className="c-page-title">
              {activeCategoryName ?? t('products.title')}
            </h1>
            <p className="c-page-subtitle">{t('products.subtitle')}</p>
          </div>

          <div className="c-products__toolbar">
            <form
              className="c-products__search"
              role="search"
              onSubmit={handleSearchSubmit}
            >
              <Search
                size={16}
                className="c-products__search-icon"
                aria-hidden="true"
              />
              <input
                type="search"
                className="c-products__search-input"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder={t('products.searchPlaceholder')}
                aria-label={t('products.searchLabel')}
              />
              {searchInput && (
                <button
                  type="button"
                  className="c-products__search-clear"
                  onClick={() => setSearchInput('')}
                  aria-label={t('nav.clearSearch')}
                >
                  <X size={14} aria-hidden="true" />
                </button>
              )}
            </form>

            <div
              className="c-products__price"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                className={`c-products__price-btn ${
                  pricePresetId !== 'all'
                    ? 'c-products__price-btn--active'
                    : ''
                }`}
                onClick={() => {
                  setIsPriceOpen((value) => !value)
                  setIsSortOpen(false)
                }}
                aria-expanded={isPriceOpen}
                aria-haspopup="menu"
                aria-controls="products-price-menu"
              >
                {t(activePreset.labelKey)}
                <ChevronDown
                  size={14}
                  className={`c-products__sort-chevron ${
                    isPriceOpen ? 'c-products__sort-chevron--open' : ''
                  }`}
                  aria-hidden="true"
                />
              </button>

              {isPriceOpen && (
                <div
                  className="c-products__dropdown"
                  role="menu"
                  id="products-price-menu"
                >
                  {PRICE_PRESETS.map((preset) => (
                    <button
                      type="button"
                      key={preset.id}
                      role="menuitemradio"
                      aria-checked={pricePresetId === preset.id}
                      className={`c-products__dropdown-item ${
                        pricePresetId === preset.id
                          ? 'c-products__dropdown-item--active'
                          : ''
                      }`}
                      onClick={() => {
                        updateParam(
                          'price',
                          preset.id === 'all' ? null : preset.id
                        )
                        setIsPriceOpen(false)
                      }}
                    >
                      <span>{t(preset.labelKey)}</span>
                      {pricePresetId === preset.id && (
                        <Check size={14} aria-hidden="true" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div
              className="c-products__sort"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                className="c-products__sort-btn"
                onClick={() => {
                  setIsSortOpen((value) => !value)
                  setIsPriceOpen(false)
                }}
                aria-expanded={isSortOpen}
                aria-haspopup="menu"
                aria-controls="products-sort-menu"
              >
                <span className="c-products__sort-btn-label">
                  {t('products.sortBy')}
                </span>
                <span className="c-products__sort-btn-value">
                  {t(SORT_LABEL_KEYS[sort])}
                </span>
                <ChevronDown
                  size={14}
                  className={`c-products__sort-chevron ${
                    isSortOpen ? 'c-products__sort-chevron--open' : ''
                  }`}
                  aria-hidden="true"
                />
              </button>

              {isSortOpen && (
                <div
                  className="c-products__dropdown"
                  role="menu"
                  id="products-sort-menu"
                >
                  {SORT_OPTIONS.map((option) => (
                    <button
                      type="button"
                      key={option}
                      role="menuitemradio"
                      aria-checked={sort === option}
                      className={`c-products__dropdown-item ${
                        sort === option
                          ? 'c-products__dropdown-item--active'
                          : ''
                      }`}
                      onClick={() => {
                        updateParam(
                          'sort',
                          option === 'newest' ? null : option
                        )
                        setIsSortOpen(false)
                      }}
                    >
                      <span>{t(SORT_LABEL_KEYS[option])}</span>
                      {sort === option && (
                        <Check size={14} aria-hidden="true" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="c-products__filterbar">
          <div className="c-products__pills">
            <button
              type="button"
              className={`c-products__pill ${
                !categoryParam && !dealsOnly
                  ? 'c-products__pill--active'
                  : ''
              }`}
              onClick={() => {
                setCategory('')
                updateParam('deals', null)
              }}
              aria-pressed={!categoryParam && !dealsOnly}
            >
              {t('products.all')}
            </button>
            <button
              type="button"
              className={`c-products__pill c-products__pill--deals ${
                dealsOnly ? 'c-products__pill--active' : ''
              }`}
              onClick={() => updateParam('deals', dealsOnly ? null : '1')}
              aria-pressed={dealsOnly}
            >
              <Tag size={13} aria-hidden="true" />
              {t('products.deals')}
            </button>
            {categories.map((category) => {
              const isActive = categoryParam === category.slug

              return (
                <button
                  type="button"
                  key={category.id}
                  className={`c-products__pill ${
                    isActive ? 'c-products__pill--active' : ''
                  }`}
                  onClick={() => setCategory(category.slug)}
                  aria-pressed={isActive}
                >
                  {category.name}
                  <span className="c-products__pill-count">
                    {category.product_count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="c-products__status">
          <div className="c-products__chips">
            {queryParam && (
              <button
                type="button"
                className="c-products__chip"
                onClick={clearSearch}
              >
                {t('products.searchChip', { query: queryParam })}
                <X size={12} aria-hidden="true" />
              </button>
            )}
            {dealsOnly && (
              <button
                type="button"
                className="c-products__chip"
                onClick={() => updateParam('deals', null)}
              >
                {t('products.deals')}
                <X size={12} aria-hidden="true" />
              </button>
            )}
            {categoryParam && (
              <button
                type="button"
                className="c-products__chip"
                onClick={() => setCategory('')}
              >
                {activeCategoryName ?? categoryParam}
                <X size={12} aria-hidden="true" />
              </button>
            )}
            {pricePresetId !== 'all' && (
              <button
                type="button"
                className="c-products__chip"
                onClick={() => updateParam('price', null)}
              >
                {t(activePreset.labelKey)}
                <X size={12} aria-hidden="true" />
              </button>
            )}
            {hasActiveFilters && (
              <button
                type="button"
                className="c-products__chip-clear"
                onClick={clearAll}
              >
                {t('products.clearAll')}
              </button>
            )}
          </div>

          <span className="c-products__count" aria-live="polite">
            <strong>{filtered.length}</strong>{' '}
            {t('products.countUnit', { count: filtered.length })}
          </span>
        </div>

        <ProductGrid
          products={filtered}
          isLoading={isLoading}
          emptyTitle={emptyTitle}
          emptyMessage={emptyMessage}
        />
      </div>
    </div>
  )
}
