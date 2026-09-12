import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Package,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ImageIcon,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import {
  useProducts,
  useDeleteProduct,
  useToggleProductStatus,
  type ProductWithMeta,
} from '../../../hooks/useProducts'
import { useCategories } from '../../../hooks/useCategories'
import { formatPrice, formatDate } from '../../../utils/format'
import './Products.css'

const PAGE_SIZE = 8

export function Products() {
  const navigate = useNavigate()
  const [deleting, setDeleting] = useState<ProductWithMeta | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [page, setPage] = useState(1)

  const { data: products = [], isLoading, error } = useProducts()
  const { data: categories = [] } = useCategories()
  const deleteMutation = useDeleteProduct()
  const toggleMutation = useToggleProductStatus()

  // Stats
  const total = products.length
  const activeCount = products.filter((p) => p.is_active).length
  const inactiveCount = total - activeCount
  const lowStockCount = products.filter((p) => {
    const totalStock = p.variants.reduce((sum, v) => sum + v.stock, 0)
    return totalStock > 0 && totalStock < 10
  }).length

  // Filter
  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.slug.toLowerCase().includes(search.toLowerCase())
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && p.is_active) ||
        (statusFilter === 'inactive' && !p.is_active)
      const matchesCategory =
        categoryFilter === 'all' || p.category_id === categoryFilter
      return matchesSearch && matchesStatus && matchesCategory
    })
  }, [products, search, statusFilter, categoryFilter])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const startIndex = (page - 1) * PAGE_SIZE
  const paginated = filtered.slice(startIndex, startIndex + PAGE_SIZE)

  const resetPage = () => setPage(1)

  const handleCreate = () => {
    navigate('/admin/products/new')
  }

  const handleEdit = (product: ProductWithMeta) => {
    navigate(`/admin/products/${product.id}/edit`)
  }

  const handleConfirmDelete = async () => {
    if (!deleting) return
    await deleteMutation.mutateAsync(deleting.id)
    setDeleting(null)
  }

  const handleToggleStatus = async (product: ProductWithMeta) => {
    await toggleMutation.mutateAsync({
      id: product.id,
      is_active: !product.is_active,
    })
  }

  if (error) {
    return (
      <div className="admin-card" style={{ padding: 32, textAlign: 'center' }}>
        <p style={{ color: 'var(--admin-red)' }}>
          Error loading products: {(error as Error).message}
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-header__title">Products</h1>
          <p className="admin-page-header__subtitle">
            Manage your products, variants, stock and pricing.
          </p>
        </div>
        <button className="admin-btn admin-btn--primary" onClick={handleCreate}>
          <Plus size={16} />
          Add Product
        </button>
      </div>

      {/* Stats */}
      <div className="products__stats">
        <StatCard
          icon={<Package size={20} />}
          label="Total Products"
          value={total}
          color="indigo"
        />
        <StatCard
          icon={<CheckCircle2 size={20} />}
          label="Active"
          value={activeCount}
          color="green"
        />
        <StatCard
          icon={<XCircle size={20} />}
          label="Inactive"
          value={inactiveCount}
          color="orange"
        />
        <StatCard
          icon={<AlertTriangle size={20} />}
          label="Low Stock"
          value={lowStockCount}
          color="red"
        />
      </div>

      {/* Table Card */}
      <div className="admin-card products__card">
        {/* Toolbar */}
        <div className="products__toolbar">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as any)
              resetPage()
            }}
            className="products__select"
          >
            <option value="all">All status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value)
              resetPage()
            }}
            className="products__select"
          >
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <div className="products__search">
            <Search size={16} className="products__search-icon" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                resetPage()
              }}
              className="products__search-input"
            />
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="products__loading">Loading products...</div>
        ) : paginated.length === 0 ? (
          <div className="products__empty">
            <Package size={40} className="products__empty-icon" />
            <h3 className="products__empty-title">No products found</h3>
            <p className="products__empty-desc">
              {search || statusFilter !== 'all' || categoryFilter !== 'all'
                ? 'Try adjusting your filters.'
                : 'Get started by creating your first product.'}
            </p>
            {!search && statusFilter === 'all' && categoryFilter === 'all' && (
              <button className="admin-btn admin-btn--primary" onClick={handleCreate}>
                <Plus size={16} />
                Add Product
              </button>
            )}
          </div>
        ) : (
          <div className="products__table-wrap">
            <table className="products__table">
              <thead>
                <tr>
                  <th style={{ width: 48 }}>#</th>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th style={{ width: 140, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((product, idx) => {
                  const variantCount = product.variants.length
                  const totalStock = product.variants.reduce((s, v) => s + v.stock, 0)
                  const prices = product.variants.map((v) => v.price)
                  const minPrice = prices.length ? Math.min(...prices) : 0
                  const maxPrice = prices.length ? Math.max(...prices) : 0
                  const priceLabel =
                    variantCount === 0
                      ? '—'
                      : minPrice === maxPrice
                      ? formatPrice(minPrice)
                      : `${formatPrice(minPrice)} – ${formatPrice(maxPrice)}`

                  return (
                    <tr key={product.id}>
                      <td className="products__cell-num">{startIndex + idx + 1}</td>
                      <td>
                        <div className="products__cell-name">
                          <div className="products__thumb">
                            {product.image_url ? (
                              <img src={product.image_url} alt={product.name} />
                            ) : (
                              <ImageIcon size={18} />
                            )}
                          </div>
                          <div>
                            <div className="products__name">{product.name}</div>
                            <div className="products__meta">
                              {variantCount > 0
                                ? `${variantCount} variant${variantCount > 1 ? 's' : ''}`
                                : 'No variants'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="products__cell-muted">
                        {product.category?.name || '—'}
                      </td>
                      <td className="products__cell-price">{priceLabel}</td>
                      <td>
                        <span
                          className={`products__stock ${
                            totalStock === 0
                              ? 'products__stock--out'
                              : totalStock < 10
                              ? 'products__stock--low'
                              : ''
                          }`}
                        >
                          {totalStock}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(product)}
                          disabled={toggleMutation.isPending}
                          className={`admin-badge admin-badge--${
                            product.is_active ? 'success' : 'warning'
                          } products__status-toggle`}
                          title={
                            product.is_active ? 'Click to deactivate' : 'Click to activate'
                          }
                        >
                          <span className="admin-badge__dot" />
                          {product.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="products__cell-muted">
                        {formatDate(product.created_at)}
                      </td>
                      <td>
                        <div className="products__actions">
                          <button
                            className="products__action-btn"
                            onClick={() => handleEdit(product)}
                            title="Edit"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            className="products__action-btn products__action-btn--danger"
                            onClick={() => setDeleting(product)}
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {filtered.length > 0 && (
          <div className="products__pagination">
            <span className="products__pagination-info">
              Showing <strong>{startIndex + 1}</strong>–
              <strong>{Math.min(startIndex + PAGE_SIZE, filtered.length)}</strong> of{' '}
              <strong>{filtered.length}</strong> products
            </span>
            <div className="products__pagination-controls">
              <button
                className="products__page-btn"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft size={16} />
              </button>
              <span className="products__page-current">
                {page} / {totalPages}
              </span>
              <button
                className="products__page-btn"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      {deleting && (
        <div className="products__modal-backdrop" onClick={() => setDeleting(null)}>
          <div
            className="products__modal products__modal--sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="products__modal-header">
              <h3 className="products__modal-title">Delete Product</h3>
            </div>
            <div className="products__modal-body">
              <p className="products__confirm-text">
                Are you sure you want to delete <strong>{deleting.name}</strong>? This
                action cannot be undone and will delete all its variants.
              </p>
              <p className="products__confirm-warn">
                Tip: prefer setting products to <strong>inactive</strong> if they have
                historical orders.
              </p>
            </div>
            <div className="products__modal-footer">
              <button
                className="admin-btn admin-btn--secondary"
                onClick={() => setDeleting(null)}
                disabled={deleteMutation.isPending}
              >
                Cancel
              </button>
              <button
                className="admin-btn admin-btn--danger"
                onClick={handleConfirmDelete}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ============================================
   Stat Card
   ============================================ */
interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: number
  color: 'indigo' | 'green' | 'orange' | 'red'
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  return (
    <div className="products__stat-card">
      <div className={`products__stat-icon products__stat-icon--${color}`}>{icon}</div>
      <div className="products__stat-content">
        <div className="products__stat-label">{label}</div>
        <div className="products__stat-value">{value}</div>
      </div>
    </div>
  )
}