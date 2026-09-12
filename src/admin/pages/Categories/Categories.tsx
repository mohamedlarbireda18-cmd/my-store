import { useMemo, useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Tags,
  CheckCircle2,
  XCircle,
  Package,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useToggleCategoryStatus,
} from '../../../hooks/useCategories'
import type { Category, CategoryInput } from '../../../types'
import { generateSlug } from '../../../utils/slug'
import { formatDate } from '../../../utils/format'
import './Categories.css'

const PAGE_SIZE = 8

export function Categories() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [deleting, setDeleting] = useState<Category | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [page, setPage] = useState(1)

  const { data: categories = [], isLoading, error } = useCategories()
  const createMutation = useCreateCategory()
  const updateMutation = useUpdateCategory()
  const deleteMutation = useDeleteCategory()
  const toggleMutation = useToggleCategoryStatus()

  // Stats
  const total = categories.length
  const activeCount = categories.filter((c) => c.is_active).length
  const inactiveCount = total - activeCount

  // Filter + search
  const filtered = useMemo(() => {
    return categories.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.slug.toLowerCase().includes(search.toLowerCase())
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && c.is_active) ||
        (statusFilter === 'inactive' && !c.is_active)
      return matchesSearch && matchesStatus
    })
  }, [categories, search, statusFilter])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const startIndex = (page - 1) * PAGE_SIZE
  const paginated = filtered.slice(startIndex, startIndex + PAGE_SIZE)

  // Reset to page 1 when filters change
  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(1)
  }
  const handleStatusChange = (value: 'all' | 'active' | 'inactive') => {
    setStatusFilter(value)
    setPage(1)
  }

  // Handlers
  const handleCreate = () => {
    setEditing(null)
    setIsModalOpen(true)
  }
  const handleEdit = (category: Category) => {
    setEditing(category)
    setIsModalOpen(true)
  }
  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditing(null)
  }
  const handleConfirmDelete = async () => {
    if (!deleting) return
    await deleteMutation.mutateAsync(deleting.id)
    setDeleting(null)
  }
  const handleToggleStatus = async (cat: Category) => {
    await toggleMutation.mutateAsync({
      id: cat.id,
      is_active: !cat.is_active,
    })
  }

  if (error) {
    return (
      <div className="admin-card" style={{ padding: 32, textAlign: 'center' }}>
        <p style={{ color: 'var(--admin-red)' }}>
          Error loading categories: {(error as Error).message}
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* ==============================
          Page Header
      ============================== */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-header__title">Categories</h1>
          <p className="admin-page-header__subtitle">
            Manage the different categories of products in your store.
          </p>
        </div>
        <button className="admin-btn admin-btn--primary" onClick={handleCreate}>
          <Plus size={16} />
          Add Category
        </button>
      </div>

      {/* ==============================
          Stats Cards
      ============================== */}
      <div className="categories__stats">
        <StatCard
          icon={<Tags size={20} />}
          label="Total Categories"
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
      </div>

      {/* ==============================
          Table Card
      ============================== */}
      <div className="admin-card categories__card">
        {/* Toolbar */}
        <div className="categories__toolbar">
          <div className="categories__filter">
            <select
              value={statusFilter}
              onChange={(e) => handleStatusChange(e.target.value as any)}
              className="categories__select"
            >
              <option value="all">All categories</option>
              <option value="active">Active only</option>
              <option value="inactive">Inactive only</option>
            </select>
          </div>

          <div className="categories__search">
            <Search size={16} className="categories__search-icon" />
            <input
              type="text"
              placeholder="Search categories..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="categories__search-input"
            />
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="categories__loading">Loading categories...</div>
        ) : paginated.length === 0 ? (
          <div className="categories__empty">
            <Tags size={40} className="categories__empty-icon" />
            <h3 className="categories__empty-title">No categories found</h3>
            <p className="categories__empty-desc">
              {search || statusFilter !== 'all'
                ? 'Try adjusting your filters.'
                : 'Get started by creating your first category.'}
            </p>
            {!search && statusFilter === 'all' && (
              <button className="admin-btn admin-btn--primary" onClick={handleCreate}>
                <Plus size={16} />
                Add Category
              </button>
            )}
          </div>
        ) : (
          <div className="categories__table-wrap">
            <table className="categories__table">
              <thead>
                <tr>
                  <th style={{ width: 48 }}>#</th>
                  <th>Category</th>
                  <th>Slug</th>
                  <th>Status</th>
                  <th>Products</th>
                  <th>Created</th>
                  <th style={{ width: 140, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((cat, idx) => (
                  <tr key={cat.id}>
                    <td className="categories__cell-num">{startIndex + idx + 1}</td>
                    <td>
                      <div className="categories__cell-name">
                        <div className="categories__icon-box">
                          <Tags size={16} />
                        </div>
                        <div>
                          <div className="categories__name">{cat.name}</div>
                          {cat.description && (
                            <div className="categories__desc">{cat.description}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="categories__slug">{cat.slug}</span>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(cat)}
                        disabled={toggleMutation.isPending}
                        className={`admin-badge admin-badge--${
                          cat.is_active ? 'success' : 'warning'
                        } categories__status-toggle`}
                        title={
                          cat.is_active
                            ? 'Click to deactivate'
                            : 'Click to activate'
                        }
                      >
                        <span className="admin-badge__dot" />
                        {cat.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td>
                      <span className="categories__products">
                        <Package size={14} />
                        —
                      </span>
                    </td>
                    <td className="categories__cell-muted">{formatDate(cat.created_at)}</td>
                    <td>
                      <div className="categories__actions">
                        <button
                          className="categories__action-btn"
                          onClick={() => handleEdit(cat)}
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          className="categories__action-btn categories__action-btn--danger"
                          onClick={() => setDeleting(cat)}
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {filtered.length > 0 && (
          <div className="categories__pagination">
            <span className="categories__pagination-info">
              Showing <strong>{startIndex + 1}</strong>–
              <strong>{Math.min(startIndex + PAGE_SIZE, filtered.length)}</strong> of{' '}
              <strong>{filtered.length}</strong> categories
            </span>
            <div className="categories__pagination-controls">
              <button
                className="categories__page-btn"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft size={16} />
              </button>
              <span className="categories__page-current">
                {page} / {totalPages}
              </span>
              <button
                className="categories__page-btn"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ==============================
          Create / Edit Modal
      ============================== */}
      {isModalOpen && (
        <CategoryFormModal
          category={editing}
          onClose={handleCloseModal}
          onSubmit={async (data) => {
            if (editing) {
              await updateMutation.mutateAsync({ id: editing.id, input: data })
            } else {
              await createMutation.mutateAsync(data)
            }
            handleCloseModal()
          }}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
        />
      )}

      {/* ==============================
          Delete Confirmation
      ============================== */}
      {deleting && (
        <DeleteConfirmModal
          category={deleting}
          onClose={() => setDeleting(null)}
          onConfirm={handleConfirmDelete}
          isLoading={deleteMutation.isPending}
        />
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
  color: 'indigo' | 'green' | 'orange'
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  return (
    <div className="categories__stat-card">
      <div className={`categories__stat-icon categories__stat-icon--${color}`}>{icon}</div>
      <div className="categories__stat-content">
        <div className="categories__stat-label">{label}</div>
        <div className="categories__stat-value">{value}</div>
      </div>
    </div>
  )
}

/* ============================================
   Category Form Modal
   ============================================ */
interface CategoryFormModalProps {
  category: Category | null
  onClose: () => void
  onSubmit: (data: CategoryInput) => Promise<void>
  isSubmitting: boolean
}

function CategoryFormModal({
  category,
  onClose,
  onSubmit,
  isSubmitting,
}: CategoryFormModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CategoryInput>({
    defaultValues: {
      name: category?.name ?? '',
      slug: category?.slug ?? '',
      description: category?.description ?? '',
      is_active: category?.is_active ?? true,
    },
  })

  const nameValue = watch('name')

  // Auto-generate slug when creating new category
  useEffect(() => {
    if (!category && nameValue) {
      setValue('slug', generateSlug(nameValue))
    }
  }, [nameValue, category, setValue])

  const handleFormSubmit = async (data: CategoryInput) => {
    await onSubmit(data)
  }

  return (
    <div className="categories__modal-backdrop" onClick={onClose}>
      <div className="categories__modal" onClick={(e) => e.stopPropagation()}>
        <div className="categories__modal-header">
          <h3 className="categories__modal-title">
            {category ? 'Edit Category' : 'Add Category'}
          </h3>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="categories__modal-form">
          <div className="categories__field">
            <label className="categories__label">
              Name <span className="categories__required">*</span>
            </label>
            <input
              type="text"
              className={`categories__input ${errors.name ? 'categories__input--error' : ''}`}
              placeholder="e.g. T-Shirts"
              {...register('name', { required: 'Name is required' })}
            />
            {errors.name && (
              <span className="categories__error">{errors.name.message}</span>
            )}
          </div>

          <div className="categories__field">
            <label className="categories__label">
              Slug <span className="categories__required">*</span>
            </label>
            <input
              type="text"
              className={`categories__input ${errors.slug ? 'categories__input--error' : ''}`}
              placeholder="e.g. t-shirts"
              {...register('slug', { required: 'Slug is required' })}
            />
            <span className="categories__hint">
              URL-friendly identifier. Auto-generated from name.
            </span>
            {errors.slug && (
              <span className="categories__error">{errors.slug.message}</span>
            )}
          </div>

          <div className="categories__field">
            <label className="categories__label">Description</label>
            <textarea
              rows={3}
              className="categories__input categories__textarea"
              placeholder="Optional description..."
              {...register('description')}
            />
          </div>

          <label className="categories__checkbox">
            <input type="checkbox" {...register('is_active')} />
            <span>Active (visible to customers)</span>
          </label>

          <div className="categories__modal-footer">
            <button
              type="button"
              className="admin-btn admin-btn--secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="admin-btn admin-btn--primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : category ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ============================================
   Delete Confirmation Modal
   ============================================ */
interface DeleteConfirmModalProps {
  category: Category
  onClose: () => void
  onConfirm: () => void
  isLoading: boolean
}

function DeleteConfirmModal({
  category,
  onClose,
  onConfirm,
  isLoading,
}: DeleteConfirmModalProps) {
  return (
    <div className="categories__modal-backdrop" onClick={onClose}>
      <div
        className="categories__modal categories__modal--sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="categories__modal-header">
          <h3 className="categories__modal-title">Delete Category</h3>
        </div>
        <div className="categories__modal-body">
          <p className="categories__confirm-text">
            Are you sure you want to delete <strong>{category.name}</strong>? This action
            cannot be undone.
          </p>
        </div>
        <div className="categories__modal-footer">
          <button
            className="admin-btn admin-btn--secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            className="admin-btn admin-btn--danger"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
  
}
